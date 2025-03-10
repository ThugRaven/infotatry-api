import express from 'express';
import { Announcement } from '../models/announcement';
import { mapFeatures } from '../utils/MapFeatures';
import { getPaginationValues } from '../utils/utils';
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
  const queryPage = req.query.page?.toString();
  const { page, pageSize, offset } = getPaginationValues(queryPage, 10);
  const count = await Announcement.countDocuments();

  if (offset >= count) {
    return res.status(200).send({ page, pageSize, count, data: [] });
  }
  const announcements = await Announcement.find()
    .sort({ createdAt: -1 })
    .skip(offset)
    .limit(pageSize);

  return res.status(200).send({ page, pageSize, count, data: announcements });
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
    await mapFeatures.updateAnnouncements();
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

router.patch('/:id', isAuthenticatedWithRoles(['admin']), async (req, res) => {
  const id = req.params.id;
  const announcement = await Announcement.findById(id);

  if (announcement) {
    announcement.isClosed = !announcement.isClosed;
    const updatedAnnouncement = await announcement.save();
    await mapFeatures.updateAnnouncements();

    return res.status(200).send(updatedAnnouncement);
  }

  return res.status(404).send({
    message: 'Announcement not found',
  });
});

router.put('/:id', isAuthenticatedWithRoles(['admin']), async (req, res) => {
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
    await mapFeatures.updateAnnouncements();

    return res.status(200).send(updatedAnnouncement);
  }

  return res.status(404).send({
    message: 'Announcement not found',
  });
});

router.delete('/:id', isAuthenticatedWithRoles(['admin']), async (req, res) => {
  const id = req.params.id;
  const response = await Announcement.deleteOne({ _id: id });
  console.log(response);

  if (response.deletedCount) {
    await mapFeatures.updateAnnouncements();

    return res.status(200).send({ deleted: true });
  }

  return res.status(404).send({ message: 'Announcement not found' });
});

export default router;
