import mongoose, { Document, Schema } from 'mongoose';

export type Ban = {
  duration: number | null;
  bannedAt: Date | null;
  reason?: string;
};

export interface User extends Document {
  name: string;
  email: string;
  password?: string;
  image?: string;
  ban: Ban;
}

const userSchema = new Schema<User>(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
    },
    image: {
      type: String,
    },
    ban: {
      duration: {
        type: Number,
        default: null,
      },
      bannedAt: {
        type: Date,
        default: null,
      },
      reason: {
        type: String,
        default: null,
      },
    },
  },
  { timestamps: true, autoIndex: false },
);

export const User = mongoose.model<User>('User', userSchema);
