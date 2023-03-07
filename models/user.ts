import mongoose, { Document, Schema } from 'mongoose';

export type Ban = {
  duration: number | null;
  bannedAt: Date | null;
  reason?: string;
};

export interface UserStats {
  time: number;
  distance: number;
  ascent: number;
  descent: number;
}

export interface User extends Document {
  name: string;
  email: string;
  password?: string;
  image?: string;
  roles: string[];
  ban: Ban;
  stats: UserStats;
}

const userStatsSchema = new mongoose.Schema(
  {
    time: {
      type: Number,
      default: 0,
      required: true,
    },
    distance: {
      type: Number,
      default: 0,
      required: true,
    },
    ascent: {
      type: Number,
      default: 0,
      required: true,
    },
    descent: {
      type: Number,
      default: 0,
      required: true,
    },
  },
  { autoCreate: false, _id: false },
);

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
    roles: {
      type: [String],
      default: ['user'],
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
    stats: {
      type: userStatsSchema,
      required: true,
      default: {
        time: 0,
        distance: 0,
        ascent: 0,
        descent: 0,
      },
    },
  },
  { timestamps: true, autoIndex: false },
);

export const UserStats = mongoose.model<UserStats>(
  'UserStats',
  userStatsSchema,
);
export const User = mongoose.model<User>('User', userSchema);
