import express from 'express';
import mongoose, { HydratedDocument } from 'mongoose';
import features from '../features.json';
import { CompletedHike, PlannedHike, Segment } from '../models/hike';
import { User } from '../models/user';
import PathFinder, { Trail } from '../utils/PathFinder';
import { decode, encode } from '../utils/utils';
import { isAuthenticated } from './auth';

const router = express.Router();
const pathFinder = new PathFinder();

router.get('/planned/:id', async (req, res) => {
  const id = req.params.id;

  if (id && mongoose.Types.ObjectId.isValid(id)) {
    let hike = null;
    try {
      hike = await PlannedHike.findById(id);
      if (hike == null) {
        return res.status(404).send({
          status: 404,
          message: 'Hike not found',
        });
      }
      const nodeNames = hike.query.split(';');
      const nodes = pathFinder.getNodes(nodeNames);
      const route = pathFinder.getRoute(nodes);
      if (route) {
        return res.status(200).send(route);
      }
    } catch (error) {
      if (error instanceof Error) {
        return res.status(500).send({
          status: 500,
          message: error.message,
        });
      }
    }
  }

  res.status(400).send({
    status: 400,
    message: 'Invalid hike ID',
  });
});

router.get('/completed/:id', async (req, res) => {
  const id = req.params.id;

  if (id && mongoose.Types.ObjectId.isValid(id)) {
    let hike = null;
    try {
      hike = await CompletedHike.findById(id);
      if (hike == null) {
        return res.status(404).send({
          status: 404,
          message: 'Hike not found',
        });
      }

      return res.status(200).send(hike);
    } catch (error) {
      if (error instanceof Error) {
        return res.status(500).send({
          status: 500,
          message: error.message,
        });
      }
    }
  }

  res.status(400).send({
    status: 400,
    message: 'Invalid hike ID',
  });
});

router.post('/planned', isAuthenticated, async (req, res) => {
  const { query, dateStart, dateEnd } = req.body;
  const user = (await req.user) as User;
  if (!query || !dateStart || !dateEnd) {
    return res.status(400).send({
      status: 400,
      message: 'Missing params',
    });
  }

  if (!user) {
    return res.status(401).send({
      status: 401,
      message: 'Unauthorized',
    });
  }

  if (
    typeof query !== 'string' ||
    typeof dateStart !== 'number' ||
    typeof dateEnd !== 'number'
  ) {
    return res.status(400).send({
      status: 400,
      message: 'Invalid params',
    });
  }

  const plannedHike = new PlannedHike({
    userId: user.id,
    query,
    date: {
      start: dateStart,
      end: dateEnd,
    },
  });

  try {
    const hike = await plannedHike.save();
    return res.status(201).send(hike);
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).send({
        status: 400,
        message: error.message,
      });
    }
  }
});

router.post('/completed/:id', isAuthenticated, async (req, res) => {
  const id = req.params.id;
  const user = (await req.user) as User;
  // console.log(id);

  let plannedHike: HydratedDocument<PlannedHike> | null = null;
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({
      status: 400,
      message: 'Invalid hike ID',
    });
  }

  try {
    plannedHike = await PlannedHike.findById(id);
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).send({
        status: 500,
        message: error.message,
      });
    }
  }

  if (plannedHike == null) {
    return res.status(404).send({
      status: 404,
      message: 'Hike not found',
    });
  }

  if (user.id !== plannedHike.userId) {
    return res.status(401).send({
      status: 401,
      message: 'Unauthorized',
    });
  }
  // console.log(plannedHike);

  const nodeNames = plannedHike.query.split(';');
  const nodes = pathFinder.getNodes(nodeNames);
  const route = pathFinder.getRoute(nodes);
  if (!route) {
    return res.status(404).send({
      status: 404,
      message: 'Route not found',
    });
  }

  const trailsIds = route.trails;
  const segments: Segment[] = [];

  let nodeStart = features.nodes.find(
    (node) => node.name.toLowerCase() === route.name.start.trim().toLowerCase(),
  );
  let nodeEnd = features.nodes.find(
    (node) => node.name.toLowerCase() === route.name.end.trim().toLowerCase(),
  );
  if (!nodeStart || !nodeEnd) {
    return res.status(400).send({
      status: 400,
      message: 'Invalid nodes',
    });
  }

  let ascent = 0;
  let descent = 0;
  let totalDistance = 0;
  let totalTime = 0;
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

    const start = trails[0];
    const end = trails[trails.length - 1];

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

      // console.log(trail.id, startToEnd, ascent, descent);

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
        length: decoded.length,
      });

      totalDistance += trail.distance;
      totalTime += time;

      segments.push(segment);
    }
  }

  // Add the last node of the route
  const segment = new Segment({
    name: nodeEnd.name,
    color: '',
    distance: 0,
    time: 0,
    length: 0,
  });

  segments.push(segment);

  // console.log(segments);
  // console.log(path);
  // console.log(encode(encoded));

  const completedHike = new CompletedHike({
    userId: plannedHike.userId,
    query: plannedHike.query,
    name: {
      start: nodeStart.name,
      end: nodeEnd.name,
    },
    date: {
      start: plannedHike.date.start,
      end: plannedHike.date.end,
    },
    distance: totalDistance,
    time: totalTime,
    ascent,
    descent,
    encoded: encode(path),
    elevations,
    segments,
  });

  try {
    const hike = await completedHike.save();
    return res.status(201).send(hike);
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
