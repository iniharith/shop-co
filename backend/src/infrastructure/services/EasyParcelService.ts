import axios from 'axios';

const BASE_URL = process.env.EASYPARCEL_BASE_URL || 'https://api.easyparcel.com';
const API_KEY = process.env.EASYPARCEL_API_KEY || '';

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
  courier: string; // EasyParcel service ID
}

class EasyParcelService {
  /**
   * Track parcel by tracking number using EasyParcel v3 API
   */
  async trackParcel(trackingNumber: string): Promise<EasyParcelTrackResult | null> {
    try {
      const response = await axios.post(
        `${BASE_URL}/v3.0/submitted/parcel-tracking/`,
        {
          api_key: API_KEY,
          bulk: [{ tracking_no: trackingNumber }],
        },
        { headers: { 'Content-Type': 'application/json' }, timeout: 10000 }
      );

      const data = response.data;
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
        courier: result.courier_name || 'Unknown Courier',
        events,
      };
    } catch (error: any) {
      console.error('[EasyParcel] trackParcel error:', error?.message);
      return null;
    }
  }

  /**
   * Get AWB PDF URL for a booked shipment
   */
  async getAWB(shipmentId: string): Promise<string | null> {
    try {
      const response = await axios.post(
        `${BASE_URL}/v3.0/submitted/shipment/awb/`,
        {
          api_key: API_KEY,
          bulk: [{ shipment_id: shipmentId }],
        },
        { headers: { 'Content-Type': 'application/json' }, timeout: 10000 }
      );
      const data = response.data;
      return data?.result?.[0]?.awb_url || null;
    } catch (error: any) {
      console.error('[EasyParcel] getAWB error:', error?.message);
      return null;
    }
  }

  /**
   * Book a new shipment on EasyParcel, returns shipment ID
   */
  async createShipment(input: EasyParcelShipmentInput): Promise<string | null> {
    try {
      const response = await axios.post(
        `${BASE_URL}/v3.0/submitted/make-shipment/`,
        {
          api_key: API_KEY,
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
        },
        { headers: { 'Content-Type': 'application/json' }, timeout: 15000 }
      );
      const data = response.data;
      return data?.result?.[0]?.shipment_id || null;
    } catch (error: any) {
      console.error('[EasyParcel] createShipment error:', error?.message);
      return null;
    }
  }

  /**
   * Get available courier rates for a shipment
   */
  async getRates(params: {
    fromPostcode: string;
    toPostcode: string;
    weight: number;
  }): Promise<any[]> {
    try {
      const response = await axios.post(
        `${BASE_URL}/v3.0/submitted/get-rates/`,
        {
          api_key: API_KEY,
          bulk: [
            {
              pick_code: params.fromPostcode,
              send_code: params.toPostcode,
              weight: params.weight,
            },
          ],
        },
        { headers: { 'Content-Type': 'application/json' }, timeout: 10000 }
      );
      return response.data?.result?.[0]?.rates || [];
    } catch (error: any) {
      console.error('[EasyParcel] getRates error:', error?.message);
      return [];
    }
  }

  /**
   * Normalize raw EasyParcel status strings to our standard statuses
   */
  private normalizeStatus(rawStatus: string): string {
    const s = rawStatus.toLowerCase();
    if (s.includes('deliver') && s.includes('out')) return 'out_for_delivery';
    if (s.includes('deliver') || s.includes('completed') || s.includes('success')) return 'delivered';
    if (s.includes('transit') || s.includes('sort') || s.includes('hub') || s.includes('arrival'))
      return 'in_transit';
    if (s.includes('pick') || s.includes('collect') || s.includes('pickup')) return 'picked_up';
    if (s.includes('fail') || s.includes('return') || s.includes('exception') || s.includes('undeliver'))
      return 'failed';
    return 'pending';
  }
}

export const easyParcelService = new EasyParcelService();
