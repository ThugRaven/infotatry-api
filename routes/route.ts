import express from 'express';
import PathFinder from '../utils/PathFinder';

const router = express.Router();
// const graph = createGraph();
const pathFinder = new PathFinder();

router.get('/:query', (req, res) => {
  const query = req.params.query;
  const nodeNames = query.split(';');
  const nodes = pathFinder.getNodes(nodeNames);

  if (nodes.length > 1) {
    // const route = getRoute(graph, nodes);
    const route = pathFinder.getRoutes(nodes, true);
    if (route) {
      return res.status(200).send(route);
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
