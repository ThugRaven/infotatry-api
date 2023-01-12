import features from '../features.json';
import { Announcement } from '../models/announcement';
import { Node, Trail } from './PathFinder';

class MapFeatures {
  nodes = new Map<number, Node>();
  nodeNames = new Map<string, number>();
  trails = new Map<number, Trail>();
  announcements: Announcement[] = [];

  constructor() {
    console.log('Initialize features');
    this.initialize();
  }

  async initialize() {
    this.initializeFeatures();
    await this.getAnnouncements();
    this.setClosedTrails();
  }

  initializeFeatures() {
    features.nodes.forEach((node) => {
      this.nodes.set(node.id, { ...node });
      this.nodeNames.set(node.name.trim().toLowerCase(), node.id);
    });
    features.trails.forEach((trail) =>
      this.trails.set(trail.id, { ...trail } as Trail),
    );
  }

  async getAnnouncements() {
    console.log('Fetch announcements');

    const announcements = await Announcement.find({
      type: 'closure',
      isClosed: false,
    });

    this.announcements = announcements;
    return announcements;
  }

  setClosedTrails() {
    console.log('All announcements', this.announcements);

    this.announcements.forEach((announcement) => {
      announcement.featuresIds.forEach((id) => {
        const trail = this.trails.get(id);

        if (
          trail &&
          (!announcement.since ||
            (announcement.since.getTime() <= Date.now() &&
              (!announcement.until ||
                announcement.until.getTime() >= Date.now())))
        ) {
          trail.closed = true;
          console.log('Closed trail id: ', trail.id);
        }
      });
    });
  }
}

export const mapFeatures = new MapFeatures();
