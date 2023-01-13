import express from 'express';
import mongoose, { HydratedDocument } from 'mongoose';
import { CompletedHike, PlannedHike } from '../models/hike';
import { User } from '../models/user';
import PathFinder from '../utils/PathFinder';
import { isAuthenticated } from './auth';

const router = express.Router();
const pathFinder = new PathFinder();

router.get('/planned/:id', isAuthenticated, async (req, res) => {
  const id = req.params.id;
  const user = (await req.user) as User;

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

      if (user.id !== hike.userId.toString()) {
        return res.status(401).send({
          status: 401,
          message: 'Unauthorized',
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

router.get('/completed/:id', isAuthenticated, async (req, res) => {
  const id = req.params.id;
  const user = (await req.user) as User;

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

      if (user.id !== hike.userId.toString()) {
        return res.status(401).send({
          status: 401,
          message: 'Unauthorized',
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
  const { query, date } = req.body;
  const user = (await req.user) as User;
  if (!query || !date) {
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

  const nodeNames = query.split(';');
  const { nodeStartName, nodeEndName } =
    pathFinder.getFirstAndLastNode(nodeNames);

  if (
    typeof query !== 'string' ||
    typeof date !== 'number' ||
    !nodeStartName ||
    !nodeEndName
  ) {
    return res.status(400).send({
      status: 400,
      message: 'Invalid params',
    });
  }

  const plannedHike = new PlannedHike({
    userId: user.id,
    query,
    name: {
      start: nodeStartName,
      end: nodeEndName,
    },
    date,
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
  let avoidClosedTrails = req.body.avoidClosedTrails === true ? true : false;
  const user = (await req.user) as User;

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

  if (user.id !== plannedHike.userId.toString()) {
    return res.status(401).send({
      status: 401,
      message: 'Unauthorized',
    });
  }

  const nodeNames = plannedHike.query.split(';');
  const nodes = pathFinder.getNodes(nodeNames);
  const routeWithSegments = pathFinder.getRouteWithSegments(
    nodes,
    avoidClosedTrails,
  );
  console.log('routeWithSegments', routeWithSegments);

  if (!routeWithSegments) {
    return res.status(404).send({
      status: 404,
      message: 'Route not found',
    });
  }

  const { route, segments, encoded, elevations } = routeWithSegments;
  const completedHike = new CompletedHike({
    userId: plannedHike.userId,
    query: plannedHike.query,
    name: {
      start: route.name.start,
      end: route.name.end,
    },
    date: {
      start: plannedHike.date,
      end: plannedHike.date,
    },
    distance: route.distance,
    time: route.time,
    ascent: route.ascent,
    descent: route.descent,
    encoded,
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
