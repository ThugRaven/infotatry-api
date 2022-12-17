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
    query: {
      type: String,
      required: true,
    },
    name: {
      start: {
        type: String,
      },
      end: {
        type: String,
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
    },
    descent: {
      type: Number,
    },
    encoded: {
      type: String,
    },
    elevations: {
      type: [Number],
    },
    segments: {
      type: [segmentSchema],
    },
  },
  { timestamps: true },
);

export const Segment = mongoose.model<Segment>('Segment', segmentSchema);
export const Hike = mongoose.model<Hike>('Hike', hikeSchema);
