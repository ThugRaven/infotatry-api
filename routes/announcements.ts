import express from 'express';
import { Announcement } from '../models/announcement';
import { isAuthenticatedWithRoles } from './auth';

const router = express.Router();

router.get('/closures', async (req, res) => {
  const announcements = await Announcement.find({
    type: 'closure',
    isClosed: false,
  });

  return res.status(200).send(announcements);
});

router.get('/all', isAuthenticatedWithRoles(['admin']), async (req, res) => {
  const announcements = await Announcement.find();

  return res.status(200).send(announcements);
});

router.post('/', isAuthenticatedWithRoles(['admin']), async (req, res) => {
  const {
    type,
    title,
    featuresType,
    featuresIds: featuresIdsString,
    reason,
    since,
    until,
    source,
    description,
  } = req.body;

  let featuresIds: number[] = [];
  featuresIdsString.split(',').forEach((id: string) => {
    featuresIds.push(parseInt(id));
  });
  console.log(req.body);
  console.log(featuresIds);

  const announcement = new Announcement({
    type,
    title,
    featuresType,
    featuresIds,
    reason,
    since,
    until,
    source,
    description,
  });

  try {
    const newAnnouncement = await announcement.save();
    return res.status(201).send(newAnnouncement);
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).send({
        status: 400,
        message: error.message,
      });
    }
  }
});

router.patch('/:id', async (req, res) => {
  const id = req.params.id;
  const announcement = await Announcement.findById(id);

  if (announcement) {
    announcement.isClosed = !announcement.isClosed;
    const updatedAnnouncement = await announcement.save();

    return res.status(200).send(updatedAnnouncement);
  }

  return res.status(404).send({
    message: 'Announcement not found',
  });
});

router.put('/:id', async (req, res) => {
  const id = req.params.id;
  const {
    type,
    title,
    featuresType,
    featuresIds,
    reason,
    since,
    until,
    source,
    description,
  } = req.body;
  const announcement = await Announcement.findById(id);

  if (announcement) {
    announcement.type = type;
    announcement.title = title;
    announcement.featuresType = featuresType;
    announcement.featuresIds = featuresIds.split(',');
    announcement.reason = reason;
    announcement.since = since;
    announcement.until = until;
    announcement.source = source;
    announcement.description = description;
    const updatedAnnouncement = await announcement.save();

    return res.status(200).send(updatedAnnouncement);
  }

  return res.status(404).send({
    message: 'Announcement not found',
  });
});

router.delete('/:id', async (req, res) => {
  const id = req.params.id;
  const response = await Announcement.deleteOne({ _id: id });
  console.log(response);

  if (response.deletedCount) {
    return res.status(200).send({ deleted: true });
  }

  return res.status(404).send({ message: 'Announcement not found' });
});

export default router;
