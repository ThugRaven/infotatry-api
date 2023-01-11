import mongoose, { Document, Schema } from 'mongoose';

export interface Announcement extends Document {
  type: string;
  title: string;
  featureIds: number[];
  reason: string;
  since: number | null;
  until: number | null;
  description: string;
  isClosed: boolean;
}

const announcementSchema = new Schema<Announcement>(
  {
    type: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    featureIds: {
      type: [Number],
      required: true,
    },
    reason: {
      type: String,
      required: true,
    },
    since: {
      type: Number,
      required: true,
    },
    until: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    isClosed: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

export const Announcement = mongoose.model<Announcement>(
  'Announcement',
  announcementSchema,
);
