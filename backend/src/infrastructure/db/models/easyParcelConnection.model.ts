import mongoose, { Document, Schema } from 'mongoose';

export interface IEasyParcelConnection extends Document {
  key: 'singleton';
  environment: string;
  accessTokenEncrypted?: string;
  refreshTokenEncrypted?: string;
  accessTokenExpiresAt?: Date;
  refreshTokenExpiresAt?: Date;
  oauthStateHash?: string;
  oauthStateExpiresAt?: Date;
  invalidatedAt?: Date;
  refreshLockId?: string;
  refreshLockExpiresAt?: Date;
}

const EasyParcelConnectionSchema = new Schema<IEasyParcelConnection>(
  {
    key: { type: String, required: true, unique: true, default: 'singleton' },
    environment: { type: String, required: true, default: 'sandbox' },
    accessTokenEncrypted: { type: String },
    refreshTokenEncrypted: { type: String },
    accessTokenExpiresAt: { type: Date },
    refreshTokenExpiresAt: { type: Date },
    oauthStateHash: { type: String },
    oauthStateExpiresAt: { type: Date },
    invalidatedAt: { type: Date },
    refreshLockId: { type: String },
    refreshLockExpiresAt: { type: Date },
  },
  { timestamps: true }
);

export const EasyParcelConnection = mongoose.model<IEasyParcelConnection>(
  'EasyParcelConnection',
  EasyParcelConnectionSchema
);
