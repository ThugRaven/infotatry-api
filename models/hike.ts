import mongoose from 'mongoose';

export interface Segment {
  name: string;
  color: string[];
  distance: number;
  time: number;
  length: number;
}

export interface Hike {
  name: {
    start: string;
    end: string;
  };
  date: {
    start: Date;
    end: Date;
  };
  ascent: number;
  descent: number;
  encoded: string;
  elevations: number[];
  segments: Segment[];
}

const segmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    color: {
      type: [String],
      required: true,
    },
    distance: {
      type: Number,
      required: true,
    },
    time: {
      type: Number,
      required: true,
    },
    length: {
      type: Number,
      required: true,
    },
  },
  { autoCreate: false, _id: false },
);

const hikeSchema = new mongoose.Schema(
  {
    name: {
      start: {
        type: String,
        required: true,
      },
      end: {
        type: String,
        required: true,
      },
    },
    date: {
      start: {
        type: Date,
        required: true,
      },
      end: {
        type: Date,
        required: true,
      },
    },
    ascent: {
      type: Number,
      required: true,
    },
    descent: {
      type: Number,
      required: true,
    },
    encoded: {
      type: String,
      required: true,
    },
    elevations: {
      type: [Number],
      required: true,
    },
    segments: {
      type: [segmentSchema],
      required: true,
    },
  },
  { timestamps: true },
);

export const Segment = mongoose.model<Segment>('Segment', segmentSchema);
export const Hike = mongoose.model<Hike>('Hike', hikeSchema);
