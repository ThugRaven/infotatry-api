import mongoose from 'mongoose';

export interface Segment {
  name: {
    start: string;
    end: string;
  };
  color: string[];
  distance: number;
  startEndTime: number;
  endStartTime: number;
  encoded: string;
}

export interface Hike {
  dateStart: Date;
  dateEnd: Date;
  name: {
    start: string;
    end: string;
  };
  segments: Segment[];
}

export interface Trip {
  dateStart: Date;
  dateEnd: Date;
  hikes: Hike[];
}

const segmentSchema = new mongoose.Schema({
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
  color: {
    type: [String],
    required: true,
  },
  distance: {
    type: Number,
    required: true,
  },
  startEndTime: {
    type: Number,
    required: true,
  },
  endStartTime: {
    type: Number,
    required: true,
  },
  encoded: {
    type: String,
    required: true,
  },
});

const hikeSchema = new mongoose.Schema({
  dateStart: {
    type: Date,
    required: true,
  },
  dateEnd: {
    type: Date,
    required: true,
  },
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
  segments: {
    type: [segmentSchema],
    required: true,
  },
});

const tripSchema = new mongoose.Schema({
  dateStart: {
    type: Date,
    required: true,
  },
  dateEnd: {
    type: Date,
    required: true,
  },
  hikes: {
    type: [hikeSchema],
    required: true,
  },
});

export const Segment = mongoose.model<Segment>('Segment', segmentSchema);
export const Hike = mongoose.model<Hike>('Hike', hikeSchema);
export const Trip = mongoose.model<Trip>('Trip', tripSchema);
