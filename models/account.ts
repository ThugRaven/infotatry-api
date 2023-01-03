import mongoose, { Document, ObjectId, Schema } from 'mongoose';

export interface Account extends Document {
  provider: string;
  providerId: string;
  userId: ObjectId;
}

const accountSchema = new Schema<Account>(
  {
    provider: {
      type: String,
      required: true,
    },
    providerId: {
      type: String,
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
  },
  { timestamps: true },
);

export const Account = mongoose.model<Account>('Account', accountSchema);
