import express from 'express';
import features from '../features.json';
import { createGraph, getRoute, Node } from '../utils/path-finding';

const router = express.Router();
const graph = createGraph();

router.get('/:query', (req, res) => {
  const query = req.params.query;
  const nodeNames = query.split(';');
  const nodes: Node[] = [];

  nodeNames.forEach((name) => {
    const node = features.nodes.find(
      (node) => node.name.trim().toLowerCase() == name.trim().toLowerCase(),
    );
    if (node) {
      nodes.push(node);
    }
  });

  if (nodes.length > 1) {
    const route = getRoute(graph, nodes);
    if (route) {
      return res.status(200).send({
        route: route,
      });
    }
    // console.log(route);
  }

  // console.log(nodes);
  res.status(404).send({
    status: 404,
    message: 'Route not found',
  });
});

export default router;
