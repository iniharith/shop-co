/**
 * Coded by Harith
 * Kampungcetak ®
 */
import axios, { AxiosInstance } from 'axios';

// ─── EasyParcel Marketplace OAuth2 Configuration ─────────────────────────────
// Uses Client Credentials grant — token is obtained server-to-server.
// No user login or redirect needed.
const CLIENT_ID = process.env.EASYPARCEL_CLIENT_ID || '';
const CLIENT_SECRET = process.env.EASYPARCEL_CLIENT_SECRET || '';
const BASE_URL = process.env.EASYPARCEL_BASE_URL || 'https://connect.easyparcel.my';
const TOKEN_URL = `${BASE_URL}/oauth/token`;

export interface EasyParcelTrackResult {
  trackingNumber: string;
  status: string;
  courier: string;
  events: Array<{
    status: string;
    description: string;
    location: string;
    timestamp: Date;
  }>;
}

export interface EasyParcelShipmentInput {
  senderName: string;
  senderPhone: string;
  senderAddress: string;
  senderCity: string;
  senderState: string;
  senderPostcode: string;
  recipientName: string;
  recipientPhone: string;
  recipientAddress: string;
  recipientCity: string;
  recipientState: string;
  recipientPostcode: string;
  weight: number;
  courier: string; // service_id from getRates()
}

class EasyParcelService {
  private accessToken: string | null = null;
  private tokenExpiresAt: number = 0;
  private http: AxiosInstance;

  constructor() {
    this.http = axios.create({ baseURL: BASE_URL, timeout: 15000 });
  }

  // ─── OAuth2: Client Credentials Token ──────────────────
  // Automatically called before every API request.
  // Caches the token in memory and refreshes when it expires.
  private async getAccessToken(): Promise<string> {
    const now = Date.now();

    // Return cached token if still valid (with 60s buffer)
    if (this.accessToken && now < this.tokenExpiresAt - 60_000) {
      return this.accessToken;
    }

    if (!CLIENT_ID || !CLIENT_SECRET) {
      throw new Error(
        'EASYPARCEL_CLIENT_ID and EASYPARCEL_CLIENT_SECRET must be set in environment variables'
      );
    }

    console.log('[EasyParcel] 🔑 Fetching new OAuth2 access token...');

    const response = await axios.post(
      TOKEN_URL,
      new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
      }),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 10000,
      }
    );

    const { access_token, expires_in } = response.data;

    this.accessToken = access_token;
    // expires_in is in seconds; store as ms timestamp
    this.tokenExpiresAt = now + (expires_in ?? 3600) * 1000;

    console.log(`[EasyParcel] ✅ Token acquired, expires in ${expires_in}s`);
    return this.accessToken!;
  }

  // ─── Helper: authorized POST request ───────────────────
  private async post(action: string, body: object): Promise<any> {
    const token = await this.getAccessToken();
    const response = await this.http.post(`/?ac=${action}`, body, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  }

  // ─── Track Parcel ───────────────────────────────────────
  async trackParcel(trackingNumber: string): Promise<EasyParcelTrackResult | null> {
    try {
      const data = await this.post('EPParcelStatusBulk', {
        bulk: [{ tracking_no: trackingNumber }],
      });

      if (!data?.result?.[0]) return null;

      const result = data.result[0];
      const events = (result.tracking_history || []).map((h: any) => ({
        status: h.status || '',
        description: h.content || h.description || '',
        location: h.location || '',
        timestamp: new Date(h.date_time || Date.now()),
      }));

      return {
        trackingNumber,
        status: this.normalizeStatus(result.status || 'pending'),
        courier: result.courier_name || 'Unknown',
        events,
      };
    } catch (error: any) {
      console.error('[EasyParcel] trackParcel error:', error?.message);
      return null;
    }
  }

  // ─── Get Shipping Rates ─────────────────────────────────
  async getRates(params: {
    fromPostcode: string;
    fromState: string;
    toPostcode: string;
    toState: string;
    weight: number;
  }): Promise<any[]> {
    try {
      const data = await this.post('EPRateCheckingBulk', {
        bulk: [
          {
            pick_code: params.fromPostcode,
            pick_state: params.fromState,
            pick_country: 'MY',
            send_code: params.toPostcode,
            send_state: params.toState,
            send_country: 'MY',
            weight: params.weight,
          },
        ],
      });
      return data?.result?.[0]?.rates || [];
    } catch (error: any) {
      console.error('[EasyParcel] getRates error:', error?.message);
      return [];
    }
  }

  // ─── Create Shipment ────────────────────────────────────
  async createShipment(input: EasyParcelShipmentInput): Promise<string | null> {
    try {
      const data = await this.post('EPSubmitOrderBulk', {
        bulk: [
          {
            service_id: input.courier,
            sender_name: input.senderName,
            sender_phone: input.senderPhone,
            sender_address: input.senderAddress,
            sender_city: input.senderCity,
            sender_state: input.senderState,
            sender_postcode: input.senderPostcode,
            receiver_name: input.recipientName,
            receiver_phone: input.recipientPhone,
            receiver_address: input.recipientAddress,
            receiver_city: input.recipientCity,
            receiver_state: input.recipientState,
            receiver_postcode: input.recipientPostcode,
            weight: input.weight,
            content: 'Printed Products',
            value: 10,
            send_date: new Date().toISOString().split('T')[0],
          },
        ],
      });
      return data?.result?.[0]?.order_id || null;
    } catch (error: any) {
      console.error('[EasyParcel] createShipment error:', error?.message);
      return null;
    }
  }

  // ─── Get AWB PDF URL ────────────────────────────────────
  async getAWB(orderId: string): Promise<string | null> {
    try {
      const data = await this.post('EPGetOrderAWBBulk', {
        bulk: [{ order_id: orderId }],
      });
      return data?.result?.[0]?.awb_url || null;
    } catch (error: any) {
      console.error('[EasyParcel] getAWB error:', error?.message);
      return null;
    }
  }

  // ─── Normalize Status ───────────────────────────────────
  private normalizeStatus(rawStatus: string): string {
    const s = rawStatus.toLowerCase();
    if (s.includes('deliver') && s.includes('out')) return 'out_for_delivery';
    if (s.includes('deliver') || s.includes('completed') || s.includes('success'))
      return 'delivered';
    if (s.includes('transit') || s.includes('sort') || s.includes('hub') || s.includes('arrival'))
      return 'in_transit';
    if (s.includes('pick') || s.includes('collect') || s.includes('pickup'))
      return 'picked_up';
    if (
      s.includes('fail') ||
      s.includes('return') ||
      s.includes('exception') ||
      s.includes('undeliver')
    )
      return 'failed';
    return 'pending';
  }
}

export const easyParcelService = new EasyParcelService();
