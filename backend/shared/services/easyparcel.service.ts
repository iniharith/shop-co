import axios from 'axios';

/**
 * EasyParcel API Integration Service
 * Docs: https://connect.easyparcel.my/
 * Supports: Individual API plan
 */
export class EasyParcelService {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor() {
    this.apiKey = process.env.EASYPARCEL_API_KEY || '';
    const env = process.env.EASYPARCEL_ENV || 'demo';
    this.baseUrl =
      env === 'live'
        ? 'https://connect.easyparcel.my/'
        : 'https://demo.connect.easyparcel.my/';
  }

  /**
   * Track a parcel by AWB number via EasyParcel EPTrackingBulk endpoint
   */
  async trackParcel(awbNo: string): Promise<{
    status: string;
    description: string;
    tracking_url: string;
  } | null> {
    try {
      const response = await axios.post(
        `${this.baseUrl}?ac=EPTrackingBulk`,
        {
          api_key: this.apiKey,
          bulk: [{ awb_no: awbNo }],
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 15000,
        }
      );

      const data = response.data;

      // EasyParcel returns array of results
      if (
        data &&
        Array.isArray(data.result) &&
        data.result.length > 0
      ) {
        const result = data.result[0];
        return {
          status: result.status || 'UNKNOWN',
          description: result.tracking_status || result.status || '',
          tracking_url: result.tracking_url || '',
        };
      }

      console.warn(`[EasyParcel] No tracking result for AWB: ${awbNo}`);
      return null;
    } catch (error: any) {
      console.error(`[EasyParcel] trackParcel error for ${awbNo}:`, error.message);
      return null;
    }
  }

  /**
   * Get AWB PDF label URL for thermal printer (A6 size)
   */
  async getAWBPdfUrl(awbNo: string): Promise<string | null> {
    try {
      const response = await axios.post(
        `${this.baseUrl}?ac=EPGetLabel`,
        {
          api_key: this.apiKey,
          bulk: [{ awb_no: awbNo, label_size: 'A6' }],
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 15000,
        }
      );

      const data = response.data;

      if (
        data &&
        Array.isArray(data.result) &&
        data.result.length > 0 &&
        data.result[0].awb_id_link
      ) {
        return data.result[0].awb_id_link;
      }

      console.warn(`[EasyParcel] No AWB PDF for AWB: ${awbNo}`);
      return null;
    } catch (error: any) {
      console.error(`[EasyParcel] getAWBPdfUrl error for ${awbNo}:`, error.message);
      return null;
    }
  }
}

export default EasyParcelService;
