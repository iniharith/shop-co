import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import crypto from 'crypto';
import { EasyParcelConnection } from '../db/models/easyParcelConnection.model';

const API_BASE_URL = 'https://api.easyparcel.com/open_api/2026-06';
const SHIPMENT_DETAILS_BASE_URL = 'https://api.easyparcel.com/open_api/2026-03';
const OAUTH_LOGIN_URL = 'https://api.easyparcel.com/oauth/login';
const OAUTH_TOKEN_URL = 'https://api.easyparcel.com/oauth/token';
const REQUEST_TIMEOUT_MS = 20_000;
const TOKEN_EXPIRY_SKEW_MS = 60_000;

export type EasyParcelParcelStatus =
  | 'cancelled'
  | 'pending'
  | 'picked_up'
  | 'in_transit'
  | 'delivered'
  | 'returned'
  | 'on_hold'
  | 'drop_off'
  | 'failed';

export interface EasyParcelParty {
  name: string;
  company?: string;
  phone: { countryCode: string; number: string };
  email?: string;
  address1: string;
  address2?: string;
  postcode: string;
  city: string;
  subdivisionCode: string;
  countryCode: string;
}

export interface EasyParcelShipment {
  sender: EasyParcelParty;
  receiver: EasyParcelParty;
  weight: number;
  width: number;
  length: number;
  height: number;
  parcelValue?: number;
}

export interface EasyParcelSubmitInput extends EasyParcelShipment {
  serviceId: string;
  collectionDate: string;
  reference: string;
  itemDescription: string;
  itemValue: number;
  currency?: string;
}

export interface EasyParcelSubmission {
  orderNumber: string;
  shipmentNumber: string;
  awbNumber: string | null;
  awbUrl?: string;
  awbUrlsByFormat?: { A4?: string; A5?: string; A6?: string };
  trackingUrl?: string;
  courier?: string;
  service?: string;
  shippingPrice?: number;
  currency?: string;
  rawShipment: any;
}

export interface EasyParcelTrackingResult {
  trackingNumber: string;
  shipmentNumber?: string;
  statusCode: number;
  status: EasyParcelParcelStatus;
  courier: string;
  events: Array<{ status: string; description: string; location: string; timestamp: Date }>;
}

export interface EasyParcelListedShipment {
  shipmentNumber: string;
  awbNumber: string | null;
  awbUrl?: string;
  awbUrlsByFormat?: { A4?: string; A5?: string; A6?: string };
  trackingUrl?: string;
  courier?: string;
  service?: string;
  statusCode?: number;
  raw: any;
}

export class EasyParcelApiError extends Error {
  constructor(message: string, public readonly ambiguous: boolean) {
    super(message);
    this.name = 'EasyParcelApiError';
  }
}

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`EasyParcel configuration is missing ${name}`);
  return value;
}

function encryptionKey(): Buffer {
  return crypto.createHash('sha256').update(requiredEnv('EASYPARCEL_TOKEN_ENCRYPTION_KEY')).digest();
}

function encrypt(value: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return [iv, cipher.getAuthTag(), ciphertext].map((part) => part.toString('base64url')).join('.');
}

function decrypt(value: string): string {
  const [iv, tag, ciphertext] = value.split('.').map((part) => Buffer.from(part, 'base64url'));
  if (!iv || !tag || !ciphertext) throw new Error('Stored EasyParcel token is invalid');
  const decipher = crypto.createDecipheriv('aes-256-gcm', encryptionKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
}

function oauthConfiguration(): { clientId: string; clientSecret: string; redirectUri: string } {
  return {
    clientId: requiredEnv('EASYPARCEL_CLIENT_ID'),
    clientSecret: requiredEnv('EASYPARCEL_CLIENT_SECRET'),
    redirectUri: requiredEnv('EASYPARCEL_REDIRECT_URI'),
  };
}

function safeApiMessage(data: any, fallback: string): string {
  const message = data?.message || data?.msg || data?.error_description || data?.error?.message;
  if (typeof message === 'string' && message.length <= 300) return message;
  if (Array.isArray(data?.errors)) {
    const errors = data.errors.filter((value: unknown): value is string => typeof value === 'string').join('; ');
    if (errors && errors.length <= 300) return errors;
  }
  return fallback;
}

function assertNoItemErrors(payload: any): void {
  const queue: any[] = [payload];
  while (queue.length) {
    const value = queue.shift();
    if (!value || typeof value !== 'object') continue;
    if (String(value.status || '').toLowerCase() === 'error') {
      throw new EasyParcelApiError(safeApiMessage(value, 'EasyParcel rejected a shipment item'), false);
    }
    if (Array.isArray(value)) queue.push(...value);
    else {
      for (const key of ['data', 'shipments', 'shipment', 'results', 'result']) {
        if (value[key]) queue.push(value[key]);
      }
    }
  }
}

function submitPartyPayload(party: EasyParcelParty): object {
  return {
    name: party.name,
    ...(party.company ? { company: party.company } : {}),
    phone_number_country_code: party.phone.countryCode,
    phone_number: party.phone.number,
    ...(party.email ? { email: party.email } : {}),
    address_1: party.address1,
    ...(party.address2 ? { address_2: party.address2 } : {}),
    postcode: party.postcode,
    city: party.city,
    subdivision_code: party.subdivisionCode,
    country_code: party.countryCode,
  };
}

function quotationShipmentPayload(shipment: EasyParcelShipment): object {
  return {
    sender: {
      postcode: shipment.sender.postcode,
      subdivision_code: shipment.sender.subdivisionCode,
      country: shipment.sender.countryCode,
    },
    receiver: {
      postcode: shipment.receiver.postcode,
      subdivision_code: shipment.receiver.subdivisionCode,
      country: shipment.receiver.countryCode,
    },
    ...(shipment.parcelValue === undefined ? {} : { parcel_value: shipment.parcelValue }),
    weight: shipment.weight,
    width: shipment.width,
    length: shipment.length,
    height: shipment.height,
  };
}

function firstDefined(...values: any[]): any {
  return values.find((value) => value !== undefined && value !== null && value !== '');
}

function awbUrls(value: any): { A4?: string; A5?: string; A6?: string } | undefined {
  const source = value?.awb_urls
    || value?.awbUrls
    || value?.awb_urls_by_format
    || value?.awb_url_by_format
    || (typeof value?.awb_url === 'object' ? value.awb_url : undefined)
    || (typeof value?.awb?.url === 'object' ? value.awb.url : undefined)
    || {};
  const result = {
    A4: firstDefined(source.A4, source.a4),
    A5: firstDefined(source.A5, source.a5),
    A6: firstDefined(source.A6, source.a6),
  };
  return result.A4 || result.A5 || result.A6 ? result : undefined;
}

function awbNumber(value: any): string | null {
  const number = firstDefined(value?.awb_number, value?.awb?.number, value?.tracking_number, typeof value?.awb === 'string' ? value.awb : undefined);
  return number ? String(number) : null;
}

function primaryAwbUrl(value: any): string | undefined {
  const direct = firstDefined(
    typeof value?.awb_url === 'string' ? value.awb_url : undefined,
    typeof value?.awb?.url === 'string' ? value.awb.url : undefined,
    awbUrls(value)?.A4
  );
  return direct ? String(direct) : undefined;
}

export function mapEasyParcelStatus(code: number): EasyParcelParcelStatus {
  switch (code) {
    case 0: return 'cancelled';
    case 3: return 'picked_up';
    case 4: return 'in_transit';
    case 5: return 'delivered';
    case 6: return 'returned';
    case 8: return 'on_hold';
    case 11: return 'drop_off';
    case 2:
    case 7:
    default: return 'pending';
  }
}

export function mapEasyParcelOrderStatus(code: number): 'SHIPPED' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED' | 'RETURNED' | undefined {
  if (code === 0) return 'CANCELLED';
  if (code === 3 || code === 11) return 'SHIPPED';
  if (code === 4) return 'IN_TRANSIT';
  if (code === 5) return 'DELIVERED';
  if (code === 6) return 'RETURNED';
  return undefined;
}

class EasyParcelService {
  private refreshPromise: Promise<string> | null = null;

  isConfigured(): boolean {
    return ['EASYPARCEL_CLIENT_ID', 'EASYPARCEL_CLIENT_SECRET', 'EASYPARCEL_REDIRECT_URI', 'EASYPARCEL_TOKEN_ENCRYPTION_KEY']
      .every((name) => Boolean(process.env[name]?.trim()));
  }

  private missingShippingConfiguration(): string[] {
    return [
      'EASYPARCEL_SENDER_NAME',
      'EASYPARCEL_SENDER_PHONE',
      'EASYPARCEL_SENDER_ADDRESS_1',
      'EASYPARCEL_SENDER_POSTCODE',
      'EASYPARCEL_SENDER_CITY',
      'EASYPARCEL_SENDER_SUBDIVISION_CODE',
    ].filter((name) => !process.env[name]?.trim());
  }

  async getConnectionStatus(): Promise<{ configured: boolean; shippingConfigured: boolean; missingShippingConfiguration: string[]; connected: boolean; needsReconnect: boolean; environment: string; expiresAt: Date | null }> {
    const connection = await EasyParcelConnection.findOne({ key: 'singleton' }).lean();
    const configured = this.isConfigured();
    const missingShippingConfiguration = this.missingShippingConfiguration();
    const refreshExpired = Boolean(connection?.refreshTokenExpiresAt && connection.refreshTokenExpiresAt <= new Date());
    const invalidated = Boolean(connection?.invalidatedAt);
    let tokensReadable = Boolean(connection?.accessTokenEncrypted && connection?.refreshTokenEncrypted);
    if (configured && tokensReadable) {
      try {
        decrypt(connection!.accessTokenEncrypted!);
        decrypt(connection!.refreshTokenEncrypted!);
      } catch {
        tokensReadable = false;
      }
    }
    return {
      configured,
      shippingConfigured: missingShippingConfiguration.length === 0,
      missingShippingConfiguration,
      connected: configured && tokensReadable && !refreshExpired && !invalidated,
      needsReconnect: Boolean(connection?.accessTokenEncrypted) && (!configured || !tokensReadable || refreshExpired || invalidated),
      environment: connection?.environment || process.env.EASYPARCEL_ENV?.trim() || 'sandbox',
      expiresAt: connection?.accessTokenExpiresAt || null,
    };
  }

  async createAuthorizationUrl(): Promise<string> {
    const { clientId, redirectUri } = oauthConfiguration();
    requiredEnv('EASYPARCEL_TOKEN_ENCRYPTION_KEY');
    const state = crypto.randomBytes(32).toString('base64url');
    const stateHash = crypto.createHash('sha256').update(state).digest('hex');
    const environment = process.env.EASYPARCEL_ENV?.trim() || 'sandbox';
    await EasyParcelConnection.findOneAndUpdate(
      { key: 'singleton' },
      {
        $set: {
          environment,
          oauthStateHash: stateHash,
          oauthStateExpiresAt: new Date(Date.now() + 10 * 60_000),
        },
        $setOnInsert: { key: 'singleton' },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    const query = new URLSearchParams({ response_type: 'code', client_id: clientId, redirect_uri: redirectUri, state });
    return `${OAUTH_LOGIN_URL}?${query.toString()}`;
  }

  async handleAuthorizationCallback(code: string, state: string): Promise<void> {
    if (!code || !state) throw new Error('Missing OAuth callback parameters');
    const connection = await EasyParcelConnection.findOne({ key: 'singleton' });
    const receivedHash = crypto.createHash('sha256').update(state).digest();
    const expectedHash = connection?.oauthStateHash ? Buffer.from(connection.oauthStateHash, 'hex') : Buffer.alloc(0);
    const stateValid = expectedHash.length === receivedHash.length && crypto.timingSafeEqual(receivedHash, expectedHash);
    if (!connection || !stateValid || !connection.oauthStateExpiresAt || connection.oauthStateExpiresAt <= new Date()) {
      throw new Error('Invalid or expired OAuth state');
    }

    await EasyParcelConnection.updateOne(
      { _id: connection._id },
      { $unset: { oauthStateHash: 1, oauthStateExpiresAt: 1 } }
    );
    const config = oauthConfiguration();
    const response = await axios.post(
      OAUTH_TOKEN_URL,
      new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: config.redirectUri }).toString(),
      {
        timeout: REQUEST_TIMEOUT_MS,
        headers: {
          Authorization: `Basic ${Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );
    await this.persistTokens(response.data, connection.refreshTokenEncrypted);
  }

  async getWallet(): Promise<any> {
    return this.request({ method: 'GET', url: '/wallet' });
  }

  async getQuotations(shipments: EasyParcelShipment[]): Promise<any[]> {
    if (!shipments.length) throw new Error('At least one shipment is required');
    const response = await this.request({
      method: 'POST',
      url: '/shipment/quotations',
      data: { shipment: shipments.map(quotationShipmentPayload) },
    });
    return Array.isArray(response?.data) ? response.data : response?.data?.quotations || response?.quotations || [];
  }

  async submitOrder(input: EasyParcelSubmitInput): Promise<EasyParcelSubmission> {
    const response = await this.request({
      method: 'POST',
      url: '/shipment/submit_orders',
      data: {
        shipment: [{
          reference: input.reference,
          service_id: input.serviceId,
          collection_date: input.collectionDate,
          weight: input.weight,
          height: input.height,
          length: input.length,
          width: input.width,
          item: [{
            content: input.itemDescription,
            weight: input.weight,
            height: input.height,
            length: input.length,
            width: input.width,
            currency_code: input.currency || 'MYR',
            value: input.itemValue,
            quantity: 1,
          }],
          sender: submitPartyPayload(input.sender),
          receiver: submitPartyPayload(input.receiver),
          feature: {
            sms_tracking: false,
            email_tracking: false,
            whatsapp_tracking: false,
            awb_branding: { enable: false },
          },
        }],
      },
    });
    const dataItem = Array.isArray(response?.data) ? response.data[0] : response?.data;
    const order = dataItem?.order_details || {};
    const shipment = (Array.isArray(dataItem?.shipments) ? dataItem.shipments[0] : dataItem?.shipments) || {};
    const orderNumber = firstDefined(order.order_number, order.order_no, order.number);
    const shipmentNumber = firstDefined(shipment.shipment_number, shipment.number);
    if (!orderNumber || !shipmentNumber) throw new Error('EasyParcel response omitted order or shipment number');
    const urls = awbUrls(shipment);
    return {
      orderNumber: String(orderNumber),
      shipmentNumber: String(shipmentNumber),
      awbNumber: awbNumber(shipment),
      awbUrl: primaryAwbUrl(shipment),
      awbUrlsByFormat: urls,
      trackingUrl: firstDefined(shipment.tracking_url, shipment.trackingUrl),
      courier: firstDefined(shipment.courier_name, shipment.courier?.name, shipment.courier),
      service: firstDefined(shipment.courier_service, shipment.service_name, shipment.service?.name, shipment.service),
      shippingPrice: Number(firstDefined(dataItem?.pricing_breakdown?.total_paid_amount, dataItem?.pricing_breakdown?.total_order_amount, shipment.pricing_breakdown?.total_paid_amount, shipment.pricing_breakdown?.shipment_price, shipment.shipping_price)) || undefined,
      currency: firstDefined(shipment.pricing_breakdown?.currency_code, dataItem?.pricing_breakdown?.currency_code, 'MYR'),
      rawShipment: shipment,
    };
  }

  async trackParcels(awbNumbers: string[]): Promise<EasyParcelTrackingResult[]> {
    const unique = [...new Set(awbNumbers.filter(Boolean))];
    const results: EasyParcelTrackingResult[] = [];
    for (let index = 0; index < unique.length; index += 100) {
      const batch = unique.slice(index, index + 100);
      const response = await this.request({
        method: 'POST',
        url: '/shipment/tracking_status',
        data: { awb_numbers: batch },
      });
      const rows = Array.isArray(response?.data) ? response.data : response?.data?.results || response?.results || [];
      for (const row of rows) {
        if (String(row.status || '').toLowerCase() !== 'success') continue;
        const code = Number(firstDefined(row.latest_shipment_status_code, row.status_code, row.shipment_status_code, row.status?.code, 2));
        const events = (row.status_log || row.events || row.tracking_events || row.trackings || []).map((event: any) => ({
          status: String(firstDefined(event.shipment_status_code, event.status, event.status_name, event.status_code, '')),
          description: String(firstDefined(event.tracking_status, event.description, event.message, event.details, '')),
          location: String(firstDefined(event.location, event.city, '')),
          timestamp: new Date(firstDefined(event.event_date, event.timestamp, event.datetime, event.date_time, Date.now())),
        }));
        results.push({
          trackingNumber: awbNumber(row) || '',
          shipmentNumber: firstDefined(row.shipment_number, row.number),
          statusCode: code,
          status: mapEasyParcelStatus(code),
          courier: String(firstDefined(row.courier_name, row.courier?.name, row.courier, 'unknown')),
          events,
        });
      }
    }
    return results;
  }

  async listShipments(limit = 250): Promise<EasyParcelListedShipment[]> {
    return (await this.listShipmentPage(limit)).shipments;
  }

  async findShipmentsByNumbers(shipmentNumbers: string[]): Promise<EasyParcelListedShipment[]> {
    const wanted = new Set(shipmentNumbers.filter(Boolean));
    const found = new Map<string, EasyParcelListedShipment>();
    let beforeShipmentNumber: string | undefined;

    for (let page = 0; page < 20 && found.size < wanted.size; page++) {
      const result = await this.listShipmentPage(250, beforeShipmentNumber);
      for (const shipment of result.shipments) {
        if (wanted.has(shipment.shipmentNumber)) found.set(shipment.shipmentNumber, shipment);
      }
      if (!result.hasMore || !result.nextShipmentNumber || result.nextShipmentNumber === beforeShipmentNumber) break;
      beforeShipmentNumber = result.nextShipmentNumber;
    }

    return [...found.values()];
  }

  async getShipmentDetails(shipmentNumber: string): Promise<EasyParcelListedShipment> {
    const response = await this.request({
      method: 'POST',
      baseURL: SHIPMENT_DETAILS_BASE_URL,
      url: '/shipment/details',
      data: { shipment_number: shipmentNumber },
    });
    const row = Array.isArray(response?.data) ? response.data[0] : response?.data;
    if (!row?.shipment_number) throw new Error('EasyParcel shipment details were not found');
    const details = row.shipment_details || {};
    return {
      shipmentNumber: String(row.shipment_number),
      awbNumber: awbNumber(details),
      awbUrl: primaryAwbUrl(details),
      awbUrlsByFormat: awbUrls(details),
      trackingUrl: firstDefined(details.tracking_url, details.trackingUrl),
      courier: firstDefined(row.courier?.courier_name, row.courier?.name),
      service: firstDefined(row.courier?.service_types, row.courier?.service_name),
      statusCode: details.shipment_status_code !== undefined && details.shipment_status_code !== null && Number.isFinite(Number(details.shipment_status_code))
        ? Number(details.shipment_status_code)
        : undefined,
      raw: row,
    };
  }

  private async listShipmentPage(limit = 250, beforeShipmentNumber?: string): Promise<{ shipments: EasyParcelListedShipment[]; hasMore: boolean; nextShipmentNumber?: string }> {
    const response = await this.request({
      method: 'POST',
      url: '/shipment/list',
      data: {
        limit: Math.max(1, Math.min(250, Math.floor(limit))),
        ...(beforeShipmentNumber ? { before_shipment_number: beforeShipmentNumber } : {}),
      },
    });
    const rows = Array.isArray(response?.data) ? response.data : response?.data?.shipments || response?.shipments || [];
    const shipments = rows.map((row: any) => ({
      shipmentNumber: String(firstDefined(row.shipment_number, row.number, '')),
      awbNumber: awbNumber(row),
      awbUrl: primaryAwbUrl(row),
      awbUrlsByFormat: awbUrls(row),
      trackingUrl: firstDefined(row.tracking_url, row.trackingUrl),
      courier: firstDefined(row.courier_name, row.courier?.courier_name, row.courier?.courier_short_name, row.courier?.name, row.courier),
      service: firstDefined(row.service_name, row.courier?.service_type, row.service?.name, row.service),
      statusCode: Number.isFinite(Number(firstDefined(row.status_code, row.shipment_status_code)))
        ? Number(firstDefined(row.status_code, row.shipment_status_code))
        : undefined,
      raw: row,
    })).filter((row: EasyParcelListedShipment) => row.shipmentNumber);
    return {
      shipments,
      hasMore: response?.pagination?.has_more === true,
      nextShipmentNumber: response?.pagination?.next_shipment_number || shipments[shipments.length - 1]?.shipmentNumber,
    };
  }

  private async request(config: AxiosRequestConfig, retried = false): Promise<any> {
    let dispatched = false;
    try {
      const token = await this.getAccessToken();
      dispatched = true;
      const response = await axios.request({
        ...config,
        baseURL: config.baseURL || API_BASE_URL,
        timeout: REQUEST_TIMEOUT_MS,
        headers: { ...config.headers, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      assertNoItemErrors(response.data);
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      if (axiosError.response?.status === 401 && !retried) {
        try {
          await this.refreshAccessToken();
        } catch (refreshError) {
          throw new EasyParcelApiError(
            refreshError instanceof Error ? refreshError.message : 'EasyParcel authorization refresh failed; reconnect EasyParcel',
            false
          );
        }
        return this.request(config, true);
      }
      if (error instanceof EasyParcelApiError) throw error;
      if (!dispatched) {
        throw new EasyParcelApiError(error instanceof Error ? error.message : 'EasyParcel authentication failed', false);
      }
      const status = axiosError.response?.status;
      const ambiguous = !status || status === 429 || status >= 500;
      throw new EasyParcelApiError(
        `EasyParcel request failed${status ? ` (${status})` : ''}: ${safeApiMessage(axiosError.response?.data, axiosError.code === 'ECONNABORTED' ? 'request timed out' : 'upstream request failed')}`,
        ambiguous
      );
    }
  }

  private async getAccessToken(): Promise<string> {
    const connection = await EasyParcelConnection.findOne({ key: 'singleton' });
    if (!connection?.accessTokenEncrypted) throw new Error('EasyParcel is not connected');
    if (connection.invalidatedAt) throw new Error('EasyParcel authorization must be reconnected');
    if (!connection.accessTokenExpiresAt || connection.accessTokenExpiresAt.getTime() <= Date.now() + TOKEN_EXPIRY_SKEW_MS) {
      return this.refreshAccessToken();
    }
    return decrypt(connection.accessTokenEncrypted);
  }

  private async refreshAccessToken(): Promise<string> {
    if (this.refreshPromise) return this.refreshPromise;
    this.refreshPromise = this.performRefresh().finally(() => { this.refreshPromise = null; });
    return this.refreshPromise;
  }

  private async performRefresh(): Promise<string> {
    const lockId = crypto.randomUUID();
    const connection = await EasyParcelConnection.findOneAndUpdate(
      {
        key: 'singleton',
        $or: [
          { refreshLockId: { $exists: false } },
          { refreshLockExpiresAt: { $lte: new Date() } },
        ],
      },
      { $set: { refreshLockId: lockId, refreshLockExpiresAt: new Date(Date.now() + REQUEST_TIMEOUT_MS + 5_000) } },
      { new: true }
    );
    if (!connection) return this.waitForConcurrentRefresh();
    try {
      if (!connection.refreshTokenEncrypted) throw new Error('EasyParcel refresh token is unavailable; reconnect EasyParcel');
      if (connection.refreshTokenExpiresAt && connection.refreshTokenExpiresAt <= new Date()) {
        throw new Error('EasyParcel refresh token expired; reconnect EasyParcel');
      }
      const config = oauthConfiguration();
      const response = await axios.post(
        OAUTH_TOKEN_URL,
        new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: decrypt(connection.refreshTokenEncrypted),
          redirect_uri: config.redirectUri,
        }).toString(),
        {
          timeout: REQUEST_TIMEOUT_MS,
          headers: {
            Authorization: `Basic ${Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64')}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );
      return this.persistTokens(response.data, connection.refreshTokenEncrypted, lockId);
    } catch (error) {
      const status = (error as AxiosError).response?.status;
      if (status === 400 || status === 401) {
        const invalidated = await EasyParcelConnection.updateOne(
          { _id: connection._id, refreshLockId: lockId, refreshTokenEncrypted: connection.refreshTokenEncrypted },
          { $set: { invalidatedAt: new Date() }, $unset: { refreshLockId: 1, refreshLockExpiresAt: 1 } }
        );
        if (invalidated.modifiedCount) {
          throw new EasyParcelApiError('EasyParcel authorization expired or was revoked; reconnect EasyParcel', false);
        }
        return this.waitForConcurrentRefresh();
      }
      throw error;
    } finally {
      await EasyParcelConnection.updateOne(
        { _id: connection._id, refreshLockId: lockId },
        { $unset: { refreshLockId: 1, refreshLockExpiresAt: 1 } }
      );
    }
  }

  private async waitForConcurrentRefresh(): Promise<string> {
    for (let attempt = 0; attempt < 120; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, 250));
      const connection = await EasyParcelConnection.findOne({ key: 'singleton' });
      if (!connection) throw new Error('EasyParcel is not connected');
      if (connection.invalidatedAt) throw new Error('EasyParcel authorization must be reconnected');
      if (connection.refreshLockExpiresAt && connection.refreshLockExpiresAt <= new Date()) return this.performRefresh();
      if (!connection.refreshLockId && connection.accessTokenEncrypted) {
        if (connection.accessTokenExpiresAt && connection.accessTokenExpiresAt.getTime() > Date.now() + TOKEN_EXPIRY_SKEW_MS) {
          return decrypt(connection.accessTokenEncrypted);
        }
        return this.performRefresh();
      }
    }
    throw new Error('Timed out waiting for EasyParcel authorization refresh');
  }

  private async persistTokens(payload: any, existingRefreshToken?: string, refreshLockId?: string): Promise<string> {
    const body = payload?.data || payload;
    const accessToken = body?.access_token;
    const refreshToken = body?.refresh_token;
    if (!accessToken || (!refreshToken && !existingRefreshToken)) throw new Error('EasyParcel token response was incomplete');
    const accessExpiresIn = Number(body.expires_in || body.access_token_expires_in || 3600);
    const refreshExpiresIn = Number(body.refresh_expires_in || body.refresh_token_expires_in || 0);
    const update: Record<string, any> = {
      environment: process.env.EASYPARCEL_ENV?.trim() || 'sandbox',
      accessTokenEncrypted: encrypt(accessToken),
      accessTokenExpiresAt: body.expires_at ? new Date(body.expires_at) : new Date(Date.now() + Math.max(1, accessExpiresIn) * 1000),
    };
    if (refreshToken) update.refreshTokenEncrypted = encrypt(refreshToken);
    else update.refreshTokenEncrypted = existingRefreshToken;
    if (body.refresh_token_expires_at) update.refreshTokenExpiresAt = new Date(body.refresh_token_expires_at);
    else if (refreshExpiresIn > 0) update.refreshTokenExpiresAt = new Date(Date.now() + refreshExpiresIn * 1000);
    const saved = await EasyParcelConnection.findOneAndUpdate(
      { key: 'singleton', ...(refreshLockId ? { refreshLockId } : {}) },
      { $set: update, $unset: { oauthStateHash: 1, oauthStateExpiresAt: 1, invalidatedAt: 1, refreshLockId: 1, refreshLockExpiresAt: 1 }, $setOnInsert: { key: 'singleton' } },
      { upsert: !refreshLockId, new: true, setDefaultsOnInsert: true }
    );
    if (!saved && refreshLockId) return this.waitForConcurrentRefresh();
    return accessToken;
  }
}

export const easyParcelService = new EasyParcelService();
