import mongoose, { Document, Schema } from 'mongoose';

export interface Avalanche extends Document {
  danger: number;
  increase: boolean;
  am: {
    elevation?: number;
    danger: number[];
    increase: boolean;
    problem?: string;
    aspect?: string;
  };
  pm: {
    elevation?: number;
    danger: number[];
    increase: boolean;
    problem?: string;
    aspect?: string;
  };
  forecast: number;
  until: Date;
}

const avalancheSchema = new Schema<Avalanche>(
  {
    danger: {
      type: Number,
      required: true,
    },
    increase: {
      type: Boolean,
      default: false,
    },
    am: {
      elevation: {
        type: Number,
      },
      danger: {
        type: [Number],
        required: true,
      },
      increase: {
        type: Boolean,
        default: false,
      },
      problem: {
        type: String,
      },
      aspect: {
        type: String,
      },
    },
    pm: {
      elevation: {
        type: Number,
      },
      danger: {
        type: [Number],
        required: true,
      },
      increase: {
        type: Boolean,
        default: false,
      },
      problem: {
        type: String,
      },
      aspect: {
        type: String,
      },
    },
    forecast: {
      type: Number,
      required: true,
    },
    until: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true },
);

export const Avalanche = mongoose.model<Avalanche>(
  'Avalanche',
  avalancheSchema,
);
