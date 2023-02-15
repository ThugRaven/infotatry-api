import express from 'express';
import { Avalanche } from '../models/avalanche';
import { isAuthenticatedWithRoles } from './auth';

const router = express.Router();

router.get('/', async (req, res) => {
  // const avalanches = await Avalanche.findOne({
  //   until: { $gt: Date.now() },
  // });
  const avalanches = await Avalanche.find().limit(2).sort({ until: -1 });

  return res.status(200).send(avalanches);
});

router.get('/week', async (req, res) => {
  const avalanches = await Avalanche.find().limit(9).sort({ until: -1 });

  return res.status(200).send(avalanches);
});

router.get('/all', isAuthenticatedWithRoles(['admin']), async (req, res) => {
  const avalanches = await Avalanche.find();

  return res.status(200).send(avalanches);
});

router.post('/', isAuthenticatedWithRoles(['admin']), async (req, res) => {
  const { danger, increase, am, pm, forecast, until } = req.body;

  console.log(req.body);

  const avalanche = new Avalanche({
    danger,
    increase,
    am,
    pm,
    forecast,
    until,
  });

  try {
    const newAvalanche = await avalanche.save();
    return res.status(201).send(newAvalanche);
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).send({
        status: 400,
        message: error.message,
      });
    }
  }
});

router.put('/:id', isAuthenticatedWithRoles(['admin']), async (req, res) => {
  const id = req.params.id;
  const { danger, increase, am, pm, forecast, until } = req.body;

  const avalanche = await Avalanche.findById(id);

  if (avalanche) {
    avalanche.danger = danger;
    avalanche.increase = increase;
    avalanche.am = am;
    avalanche.pm = pm;
    avalanche.forecast = forecast;
    avalanche.until = until;
    const updatedAvalanche = await avalanche.save();

    return res.status(200).send(updatedAvalanche);
  }

  return res.status(404).send({
    message: 'Avalanche not found',
  });
});

router.delete('/:id', isAuthenticatedWithRoles(['admin']), async (req, res) => {
  const id = req.params.id;
  const response = await Avalanche.deleteOne({ _id: id });
  console.log(response);

  if (response.deletedCount) {
    return res.status(200).send({ deleted: true });
  }

  return res.status(404).send({ message: 'Avalanche not found' });
});

export default router;
