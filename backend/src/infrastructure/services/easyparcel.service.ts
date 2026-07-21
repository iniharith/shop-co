import axios from 'axios';

class EasyParcelService {
  private accessToken: string;
  private apiBase: string;

  constructor() {
    this.accessToken = process.env.EASYPARCEL_ACCESS_TOKEN || '';
    this.apiBase = process.env.EASYPARCEL_API_BASE || 'https://api.easyparcel.com/open_api/2026-06';
  }

  private async authenticate(): Promise<string> {
    if (!this.accessToken) {
      throw new Error(
        'EasyParcel OAuth is not configured. Set EASYPARCEL_ACCESS_TOKEN from the Authorization Code flow.'
      );
    }

    return this.accessToken;
  }

  public async submitOrder(orderData: any): Promise<any> {
    const token = await this.authenticate();
    const sender = {
      name: process.env.EASYPARCEL_SENDER_NAME || '',
      company: process.env.EASYPARCEL_SENDER_COMPANY || '',
      phone: process.env.EASYPARCEL_SENDER_PHONE || '',
      address: process.env.EASYPARCEL_SENDER_ADDRESS || '',
      city: process.env.EASYPARCEL_SENDER_CITY || '',
      state: process.env.EASYPARCEL_SENDER_STATE || '',
      postcode: process.env.EASYPARCEL_SENDER_POSTCODE || '',
    };
    const serviceId = process.env.EASYPARCEL_SERVICE_ID || '';
    const missingSenderFields = Object.entries(sender)
      .filter(([, value]) => !value)
      .map(([key]) => key);

    if (missingSenderFields.length || !serviceId) {
      throw new Error(
        `EasyParcel configuration is incomplete: ${[
          ...missingSenderFields.map((field) => `sender ${field}`),
          ...(!serviceId ? ['service ID'] : []),
        ].join(', ')}`
      );
    }

    if (
      !orderData.customerName ||
      !orderData.customerPhone ||
      !orderData.address?.street ||
      !orderData.address?.city ||
      !orderData.address?.state ||
      !orderData.address?.postalCode
    ) {
      throw new Error('Order shipping address must include recipient name, phone, street, city, state, and postcode');
    }

    try {
      const payload = {
        orders: [
          {
            weight: orderData.weight,
            content: orderData.content,
            value: orderData.value,
            pick_name: sender.name,
            pick_company: sender.company,
            pick_contact: sender.phone,
            pick_mobile: sender.phone,
            pick_addr1: sender.address,
            pick_city: sender.city,
            pick_state: sender.state,
            pick_code: sender.postcode,
            pick_country: 'MY',
            send_name: orderData.customerName,
            send_contact: orderData.customerPhone,
            send_mobile: orderData.customerPhone,
            send_addr1: orderData.address.street,
            send_city: orderData.address.city,
            send_state: orderData.address.state,
            send_code: orderData.address.postalCode,
            send_country: orderData.address.country || 'MY',
            service_id: serviceId,
          }
        ]
      };

      const response = await axios.post(`${this.apiBase}/shipment/submit_orders`, payload, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = response.data?.result?.[0];
      const orderNo = result?.order_no || result?.order_id;
      const awb = result?.awb || result?.tracking_number;
      if (!orderNo || !awb) {
        throw new Error('EasyParcel response did not include both an order number and AWB');
      }

      return { orderNo, awb };

    } catch (error: any) {
      console.error('EasyParcel Submit Error:', error.response?.data || error.message);
      const apiMessage = error.response?.data?.message || error.response?.data?.error || error.message;
      throw new Error(`EasyParcel shipment creation failed: ${apiMessage}`);
    }
  }

  public async getTrackingStatus(awb: string): Promise<any> {
    const token = await this.authenticate();
    
    try {
      const response = await axios.post(`${this.apiBase}/shipment/tracking_status`, {
        awb: [awb]
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.data?.result?.length) {
        throw new Error('EasyParcel returned no tracking result');
      }

      return response.data;
    } catch (error: any) {
      console.error('EasyParcel Tracking Error:', error.response?.data || error.message);
      const apiMessage = error.response?.data?.message || error.response?.data?.error || error.message;
      throw new Error(`EasyParcel tracking failed: ${apiMessage}`);
    }
  }
}

export const easyparcelService = new EasyParcelService();
