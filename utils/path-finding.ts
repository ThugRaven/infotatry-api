import Graph from './Graph';
import features from '../features.json';
import distance from '@turf/distance';

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

type RouteNode = {
  id: number;
  distance: number;
  trail_id: number;
  gCost: number;
  hCost: number;
  fCost: number;
  parent: RouteNode | null;
};

export type Route = {
  trails: Trail[];
  distance: number;
  duration: number;
};

export const createGraph = () => {
  const graph = new Graph();

  features.nodes.forEach((node) => graph.addVertex(node.id));
  features.trails.forEach((trail) =>
    graph.addEdge(
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
  return graph;
};

export const findPath = (graph: Graph, routeNodes: Node[]) => {
  console.time('Search');
  let openSet: RouteNode[] = [];
  const closedSet: RouteNode[] = [];
  const endNode = routeNodes[routeNodes.length - 1];

  openSet.push({
    id: routeNodes[0].id,
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

    if (currentNode.id === endNode.id) {
      console.timeEnd('Search');
      //   console.log(closedSet);
      return retracePath(currentNode);
    }

    openSet = openSet.filter(
      (node) =>
        node.id !== currentNode.id && node.trail_id !== currentNode.trail_id,
    );
    closedSet.push(currentNode);
    // console.log('currentNode', currentNode);

    const neighbors = graph.adjacencyList
      .get(currentNode.id)
      ?.map<RouteNode>((node) => ({
        id: node.node_id,
        distance: node.distance,
        trail_id: node.trail_id,
        gCost: 0,
        hCost: 0,
        fCost: 0,
        parent: null,
      }));

    const currentNodeLngLat = features.nodes.find(
      (node) => node.id === currentNode.id,
    );
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
          const neighborNodeLngLat = features.nodes.find(
            (node) => node.id === neighbor.id,
          );
          if (!neighborNodeLngLat) {
            return null;
          }

          const costToNeighbor = currentNode.gCost + neighbor.distance;
          //   console.log(costToNeighbor, neighbor.id, neighbor.gCost, neighbor);

          if (
            costToNeighbor < neighbor.gCost ||
            !openSet.find(
              (node) =>
                node.id === neighbor.id && node.trail_id === neighbor.trail_id,
            )
          ) {
            neighbor.gCost = costToNeighbor;
            const distanceToEndNode = Math.floor(
              distance(
                [neighborNodeLngLat.lng, neighborNodeLngLat.lat],
                [endNode.lng, endNode.lat],
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
};

const retracePath = (current: RouteNode): Route => {
  const path = [];
  let temp = current;

  path.push(temp.trail_id);
  while (temp.parent) {
    path.push(temp.parent.trail_id);
    temp = temp.parent;
  }

  //   console.log(path);

  const route: Trail[] = [];
  path.forEach((el) => {
    const trail = features.trails.find((trail) => trail.id === el);
    if (trail) {
      route.push(trail as Trail);
    }
  });
  route.reverse();
  //   console.log(route);
  const distance = route.reduce((sum, trail) => sum + trail.distance, 0);
  //   console.log(distance);
  const start = temp;
  const end = current;
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
  return { trails: route, duration: routeTime, distance };
};
