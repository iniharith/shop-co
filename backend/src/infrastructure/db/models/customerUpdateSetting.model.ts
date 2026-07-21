import mongoose, { Schema } from 'mongoose';

interface CustomerUpdateSettingDocument {
  key: string;
  enabled: boolean;
}

const CustomerUpdateSettingSchema = new Schema<CustomerUpdateSettingDocument>(
  {
    key: { type: String, required: true, unique: true },
    enabled: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const CustomerUpdateSetting = mongoose.model<CustomerUpdateSettingDocument>(
  'CustomerUpdateSetting',
  CustomerUpdateSettingSchema
);
