import { CustomerUpdateSetting } from '../db/models/customerUpdateSetting.model';

const WHATSAPP_AUTO_UPDATE_KEY = 'whatsapp_customer_auto_updates';

export async function areWhatsAppCustomerUpdatesEnabled(): Promise<boolean> {
  const setting = await CustomerUpdateSetting.findOne({ key: WHATSAPP_AUTO_UPDATE_KEY }).lean();
  return setting?.enabled === true;
}

export async function setWhatsAppCustomerUpdatesEnabled(enabled: boolean): Promise<boolean> {
  const setting = await CustomerUpdateSetting.findOneAndUpdate(
    { key: WHATSAPP_AUTO_UPDATE_KEY },
    { $set: { enabled } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  ).lean();

  return setting?.enabled === true;
}
