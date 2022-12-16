import { encode } from '@mapbox/polyline';
import express from 'express';
import mongoose from 'mongoose';
import features from '../features.json';
import { Hike, Segment } from '../models/hike';
import { Trail } from '../utils/PathFinder';
import { decode } from '../utils/utils';

const router = express.Router();

router.get('/:id', async (req, res) => {
  const id = req.params.id;

  if (id && mongoose.Types.ObjectId.isValid(id)) {
    let hike = null;
    try {
      hike = await Hike.findById(id);
      if (hike == null) {
        return res.status(404).send({
          status: 404,
          message: 'Hike not found',
        });
      }
    } catch (error) {
      if (error instanceof Error) {
        return res.status(500).send({
          status: 500,
          message: error.message,
        });
      }
    }

    return res.status(200).send(hike);
  }

  res.status(400).send({
    status: 400,
    message: 'Invalid hike ID',
  });
});

router.post('/', async (req, res) => {
  const trailsIds = req.body.trails;
  const segments: Segment[] = [];

  let nodeStart = features.nodes.find(
    (node) =>
      node.name.toLowerCase() === req.body.name.start.trim().toLowerCase(),
  );
  let nodeEnd = features.nodes.find(
    (node) =>
      node.name.toLowerCase() === req.body.name.end.trim().toLowerCase(),
  );
  if (!nodeStart || !nodeEnd) {
    return res.status(400).send({
      status: 400,
      message: 'Invalid nodes',
    });
  }

  const start = trailsIds[0];
  const end = trailsIds[trailsIds.length - 1];
  let ascent = 0;
  let descent = 0;
  const path = [];
  const elevations = [];

  if (trailsIds && trailsIds instanceof Array) {
    const trails: Trail[] = [];
    trailsIds.forEach((id) => {
      const trail = features.trails.find((trail) => trail.id === id);
      if (trail) {
        trails.push(trail as Trail);
      }
    });

    for (let i = 0; i < trails.length; i++) {
      const trail = trails[i];
      const nextTrail = trails[i + 1];

      let startToEnd = true;
      if (trail.node_id.start === start.id) {
        startToEnd = true;
      } else if (trail.node_id.end === start.id) {
        startToEnd = false;
      }

      if (trail.node_id.start === end.id) {
        startToEnd = false;
      } else if (trail.node_id.end === end.id) {
        startToEnd = true;
      }

      if (
        nextTrail &&
        (trail.node_id.end === nextTrail.node_id.start ||
          trail.node_id.end === nextTrail.node_id.end)
      ) {
        startToEnd = true;
      } else if (
        nextTrail &&
        (trail.node_id.start === nextTrail.node_id.end ||
          trail.node_id.start === nextTrail.node_id.start)
      ) {
        startToEnd = false;
      }

      for (let i = 0; i < trail.elevation_profile.length - 1; i++) {
        const elevationDelta = Math.abs(
          trail.elevation_profile[i + 1] - trail.elevation_profile[i],
        );
        if (trail.elevation_profile[i] < trail.elevation_profile[i + 1]) {
          if (startToEnd) {
            ascent += elevationDelta;
          } else {
            descent += elevationDelta;
          }
        } else if (
          trail.elevation_profile[i] > trail.elevation_profile[i + 1]
        ) {
          if (startToEnd) {
            descent += elevationDelta;
          } else {
            ascent += elevationDelta;
          }
        }
      }

      console.log(trail.id, startToEnd, ascent, descent);

      const time = startToEnd ? trail.time.start_end : trail.time.end_start;

      const decoded = decode(trail.encoded);
      // if (startToEnd) {
      //   path.push(...decoded);
      // } else {
      //   path.push(...decoded.reverse());
      // }
      path.push(...(startToEnd ? decoded : decoded.reverse()));
      elevations.push(
        ...(startToEnd
          ? trail.elevation_profile
          : [...trail.elevation_profile].reverse()),
      );

      const segment = new Segment({
        name: startToEnd ? trail.name.start : trail.name.end,
        color: trail.color,
        distance: trail.distance,
        time,
      });

      segments.push(segment);
    }
  }

  // console.log(segments);
  // console.log(path);
  // console.log(encode(encoded));

  const hike = new Hike({
    name: {
      start: nodeStart.name,
      end: nodeEnd.name,
    },
    date: {
      start: req.body.date.start,
      end: req.body.date.end,
    },
    ascent,
    descent,
    encoded: encode(path),
    elevations,
    segments,
  });

  try {
    const newHike = await hike.save();
    return res.status(201).send(newHike);
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).send({
        status: 400,
        message: error.message,
      });
    }
  }
});

export default router;
