import express from 'express';
const router = express.Router();

router.get('/:query', (req, res) => {
  const query = req.params.query;
  const nodes = query.split(';');

  console.log(nodes);
  res.status(200).send({
    route: nodes,
  });
});

export default router;
