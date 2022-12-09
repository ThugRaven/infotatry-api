import distance from '@turf/distance';
import features from '../features.json';
import Graph from './Graph';

export type TrailColor = 'red' | 'blue' | 'green' | 'yellow' | 'black';

export type Trail = {
  id: number;
  name: {
    start: string;
    end: string;
  };
  color: TrailColor[];
  distance: number;
  time: {
    start_end: number;
    end_start: number;
  };
  encoded: string;
  node_id: {
    start: number;
    end: number;
  };
  elevation_profile: number[];
};

export type Node = {
  id: number;
  name: string;
  type: string;
  lat: number;
  lng: number;
  elevation: number;
};

type SegmentNode = {
  id: number;
  distance: number;
  trail_id: number;
  gCost: number;
  hCost: number;
  fCost: number;
  parent: SegmentNode | null;
};

export type Route = {
  name: {
    start: string;
    end: string;
  };
  trails: number[];
  distance: number;
  duration: number;
  ascent: number;
  descent: number;
};

export type Segment = {
  trails: number[];
  distance: number;
  duration: number;
  ascent: number;
  descent: number;
};

export default class PathFinder {
  graph = new Graph();
  nodes = new Map<number, Node>();
  trails = new Map<number, Trail>();

  constructor() {
    this.initializeFeatures();
    this.createGraph();
  }

  initializeFeatures() {
    features.nodes.forEach((node) => this.nodes.set(node.id, node));
    features.trails.forEach((trail) =>
      this.trails.set(trail.id, trail as Trail),
    );
  }

  createGraph() {
    features.nodes.forEach((node) => this.graph.addVertex(node.id));
    features.trails.forEach((trail) =>
      this.graph.addEdge(
        {
          node_id: trail.node_id.start,
          trail_id: trail.id,
          distance: trail.distance,
        },
        {
          node_id: trail.node_id.end,
          trail_id: trail.id,
          distance: trail.distance,
        },
      ),
    );

    //   console.log(graph.adjacencyList);
  }

  getRoute(routeNodes: Node[]): Route | null {
    if (routeNodes.length > 0) {
      const route: Route = {
        name: {
          start: routeNodes[0].name,
          end: routeNodes[routeNodes.length - 1].name,
        },
        trails: [],
        distance: 0,
        duration: 0,
        ascent: 0,
        descent: 0,
      };
      for (let i = 0; i < routeNodes.length - 1; i++) {
        const node = routeNodes[i];
        const nextNode = routeNodes[i + 1];
        let segment: Segment | null = null;
        segment = this.findPath(node, nextNode);
        if (segment) {
          route.trails.push(...segment.trails);
          route.distance += segment.distance;
          route.duration += segment.duration;
          route.ascent += segment.ascent;
          route.descent += segment.descent;
        } else return null;
      }
      return route;
    } else {
      return null;
    }
  }

  findPath(startNode: Node, targetNode: Node) {
    console.time('Search');
    let openSet: SegmentNode[] = [];
    const closedSet: SegmentNode[] = [];

    openSet.push({
      id: startNode.id,
      distance: 0,
      trail_id: 0,
      gCost: 0,
      hCost: 0,
      fCost: 0,
      parent: null,
    });

    while (openSet.length > 0) {
      let currentNode = openSet[0];

      for (let i = 0; i < openSet.length; i++) {
        if (
          openSet[i].fCost < currentNode.fCost ||
          (openSet[i].fCost === currentNode.fCost &&
            openSet[i].hCost < currentNode.hCost)
        ) {
          currentNode = openSet[i];
        }
      }

      if (currentNode.id === targetNode.id) {
        console.timeEnd('Search');
        //   console.log(closedSet);
        return this.retracePath(currentNode);
      }

      openSet = openSet.filter(
        (node) =>
          node.id !== currentNode.id && node.trail_id !== currentNode.trail_id,
      );
      closedSet.push(currentNode);
      // console.log('currentNode', currentNode);

      const neighbors = this.graph.adjacencyList
        .get(currentNode.id)
        ?.map<SegmentNode>((node) => ({
          id: node.node_id,
          distance: node.distance,
          trail_id: node.trail_id,
          gCost: 0,
          hCost: 0,
          fCost: 0,
          parent: null,
        }));

      const currentNodeLngLat = this.nodes.get(currentNode.id);
      if (currentNodeLngLat) {
        if (!neighbors) {
          return null;
        }

        neighbors.forEach((neighbor) => {
          if (
            !closedSet.find(
              (node) =>
                node.id === neighbor.id && node.trail_id === neighbor.trail_id,
            )
          ) {
            const neighborNodeLngLat = this.nodes.get(neighbor.id);
            if (!neighborNodeLngLat) {
              return null;
            }

            const costToNeighbor = currentNode.gCost + neighbor.distance;
            //   console.log(costToNeighbor, neighbor.id, neighbor.gCost, neighbor);

            if (
              costToNeighbor < neighbor.gCost ||
              !openSet.find(
                (node) =>
                  node.id === neighbor.id &&
                  node.trail_id === neighbor.trail_id,
              )
            ) {
              neighbor.gCost = costToNeighbor;
              const distanceToEndNode = Math.floor(
                distance(
                  [neighborNodeLngLat.lng, neighborNodeLngLat.lat],
                  [targetNode.lng, targetNode.lat],
                  {
                    units: 'meters',
                  },
                ),
              );
              neighbor.hCost = distanceToEndNode;
              neighbor.fCost = costToNeighbor + distanceToEndNode;
              neighbor.parent = currentNode;

              if (
                !openSet.find(
                  (node) =>
                    node.id === neighbor.id &&
                    node.trail_id === neighbor.trail_id,
                )
              ) {
                openSet.push(neighbor);
                //   console.log('neighbor', neighbor);
              }
            }
          }
        });
      }
    }
    return null;
  }

  retracePath(current: SegmentNode): Segment {
    const path = [];
    let temp = current;

    path.push(temp.trail_id);
    while (temp.parent) {
      if (temp.parent.trail_id != 0) {
        path.push(temp.parent.trail_id);
      }
      temp = temp.parent;
    }
    path.reverse();

    // console.log(path);

    const route: Trail[] = [];
    let ascent = 0;
    let descent = 0;
    path.forEach((id) => {
      const trail = this.trails.get(id);
      if (trail) {
        route.push(trail as Trail);
      }
    });

    //   console.log(route);
    const distance = route.reduce((sum, trail) => sum + trail.distance, 0);
    //   console.log(distance);
    const start = temp;
    const end = current;
    for (let i = 0; i < route.length; i++) {
      const trail = route[i];
      const nextTrail = route[i + 1];

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
    }
    const routeTime = route.reduce((sum, trail, index, trails) => {
      let time = 0;
      // console.log('reduce');
      // console.log(trails[index]);
      // console.log(trails[index + 1]);
      if (trail.node_id.start === start.id) {
        time = trail.time.start_end;
      } else if (trail.node_id.end === start.id) {
        time = trail.time.end_start;
      }

      if (trail.node_id.start === end.id) {
        time = trail.time.end_start;
      } else if (trail.node_id.end === end.id) {
        time = trail.time.start_end;
      }

      if (
        trails[index + 1] &&
        (trails[index + 1].node_id.start === trail.node_id.end ||
          trails[index + 1].node_id.end === trail.node_id.end)
      ) {
        time = trail.time.start_end;
      } else if (
        trails[index + 1] &&
        (trails[index + 1].node_id.end === trail.node_id.start ||
          trails[index + 1].node_id.start === trail.node_id.start)
      ) {
        time = trail.time.end_start;
      }

      // console.log(time);
      return sum + time;
    }, 0);

    //   console.log(routeTime);
    //   console.log(`${Math.floor(routeTime / 60)}h${routeTime % 60}m`);
    // return { trails: route, duration: routeTime, distance };
    return { trails: path, distance, duration: routeTime, ascent, descent };
  }
}
