import distance from '@turf/distance';
import { Segment } from '../models/hike';
import Graph from './Graph';
import { mapFeatures } from './MapFeatures';
import { decode, encode } from './path-utils';

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

type WeatherSite = {
  id: number;
  name: string;
};

export type Route = {
  name: {
    start: string;
    end: string;
  };
  trails: number[];
  distance: number;
  time: number;
  ascent: number;
  descent: number;
  weatherSite: WeatherSite | null;
};

export type PathSegment = {
  trails: number[];
  distance: number;
  time: number;
  ascent: number;
  descent: number;
  highestNode: Node | null;
};

export type RawPathSegment = {
  distance: number;
  time: number;
  ascent: number;
  descent: number;
  highestNode: Node | null;
  decodedArray: [number, number][];
  elevations: number[];
  segments: Segment[];
};

export default class PathFinder {
  graph = new Graph();

  constructor() {
    console.log('Initialize PathFinder');
    this.createGraph();
  }

  createGraph() {
    mapFeatures.nodes.forEach((node) => this.graph.addVertex(node.id));
    mapFeatures.trails.forEach((trail) =>
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

    // console.log(this.graph.adjacencyList);
    //   console.log(graph.adjacencyList);
  }

  getNodes(names: string[]) {
    const foundNodes: Node[] = [];

    names.forEach((name) => {
      const nodeId = mapFeatures.nodeNames.get(name.trim().toLowerCase());
      if (nodeId) {
        const node = mapFeatures.nodes.get(nodeId);
        if (node) {
          foundNodes.push(node);
        }
      }
    });

    // console.log(this.nodeNames);
    // console.log(foundNodes);
    return foundNodes;
  }

  getFirstAndLastNode(names: string[]) {
    const nodeStartId = mapFeatures.nodeNames.get(
      names[0].trim().toLowerCase(),
    );
    const nodeEndId = mapFeatures.nodeNames.get(
      names[names.length - 2].trim().toLowerCase(),
    );

    const nodeStartName = nodeStartId
      ? mapFeatures.nodes.get(nodeStartId)?.name
      : undefined;
    const nodeEndName = nodeEndId
      ? mapFeatures.nodes.get(nodeEndId)?.name
      : undefined;

    return { nodeStartName, nodeEndName };
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
        time: 0,
        ascent: 0,
        descent: 0,
        weatherSite: null,
      };

      let highestNode: Node | null = null;

      for (let i = 0; i < routeNodes.length - 1; i++) {
        const node = routeNodes[i];
        const nextNode = routeNodes[i + 1];
        let segment: PathSegment | null = null;
        segment = this.findPath(node, nextNode, false) as PathSegment;
        if (segment) {
          route.trails.push(...segment.trails);
          route.distance += segment.distance;
          route.time += segment.time;
          route.ascent += segment.ascent;
          route.descent += segment.descent;

          if (segment.highestNode) {
            if (
              !highestNode ||
              segment.highestNode.elevation > highestNode?.elevation
            ) {
              highestNode = segment.highestNode;
            }
          }
        } else return null;
      }

      const lastNode = routeNodes[routeNodes.length - 1];
      if (
        highestNode &&
        (routeNodes[0].name === routeNodes[routeNodes.length - 1].name ||
          routeNodes[0].elevation > lastNode.elevation ||
          routeNodes[0].elevation > lastNode.elevation - 150)
      ) {
        route.weatherSite = {
          id: highestNode.id,
          name: highestNode.name,
        };
      } else {
        route.weatherSite = {
          id: lastNode.id,
          name: lastNode.name,
        };
      }

      console.log(route.weatherSite);

      return route;
    } else {
      return null;
    }
  }

  getRoutes(
    routeNodes: Node[], // :Route | null
  ) {
    const MAX_PATH_FINDING_RETRIES = 3;
    const routes: Route[] = [];
    let passedClosedTrail = false;

    if (routeNodes.length > 0) {
      for (let i = 0; i < MAX_PATH_FINDING_RETRIES; i++) {
        passedClosedTrail = false;

        const route: Route = {
          name: {
            start: routeNodes[0].name,
            end: routeNodes[routeNodes.length - 1].name,
          },
          trails: [],
          distance: 0,
          time: 0,
          ascent: 0,
          descent: 0,
          weatherSite: null,
        };

        let highestNode: Node | null = null;

        console.log(
          `i: ${i}, passedClosedTrail: ${passedClosedTrail}, avoidClosedTrails: ${
            i > 0 ? true : false
          }`,
        );
        for (let j = 0; j < routeNodes.length - 1; j++) {
          const node = routeNodes[j];
          const nextNode = routeNodes[j + 1];
          let segment: PathSegment | null = null;
          const foundPath = this.findPath2(
            node,
            nextNode,
            false,
            i > 0 ? true : false,
          );

          if (foundPath) {
            passedClosedTrail = passedClosedTrail
              ? passedClosedTrail
              : foundPath.passedClosedTrail;
            console.log('passedClosedTrail', passedClosedTrail);
          } else {
            console.log('Route not found');
          }
          if (foundPath && foundPath.path) {
            segment = foundPath.path as PathSegment;
            route.trails.push(...segment.trails);
            route.distance += segment.distance;
            route.time += segment.time;
            route.ascent += segment.ascent;
            route.descent += segment.descent;

            if (segment.highestNode) {
              if (
                !highestNode ||
                segment.highestNode.elevation > highestNode?.elevation
              ) {
                highestNode = segment.highestNode;
              }
            }
          } else return null;
        }

        const lastNode = routeNodes[routeNodes.length - 1];
        if (
          highestNode &&
          (routeNodes[0].name === routeNodes[routeNodes.length - 1].name ||
            routeNodes[0].elevation > lastNode.elevation ||
            routeNodes[0].elevation > lastNode.elevation - 150)
        ) {
          route.weatherSite = {
            id: highestNode.id,
            name: highestNode.name,
          };
        } else {
          route.weatherSite = {
            id: lastNode.id,
            name: lastNode.name,
          };
        }

        console.log(route.weatherSite);

        routes.push(route);

        if (!passedClosedTrail) {
          break;
        }
      }
    } else {
      return null;
    }

    return routes;
  }

  getRouteWithSegments(routeNodes: Node[]): {
    route: Route;
    segments: Segment[];
    encoded: string;
    elevations: number[];
  } | null {
    if (routeNodes.length > 0) {
      const route: Route = {
        name: {
          start: routeNodes[0].name,
          end: routeNodes[routeNodes.length - 1].name,
        },
        trails: [],
        distance: 0,
        time: 0,
        ascent: 0,
        descent: 0,
        weatherSite: null,
      };

      let highestNode: Node | null = null;
      const decodedArray = [];
      const segments: Segment[] = [];
      const elevations = [];

      for (let i = 0; i < routeNodes.length - 1; i++) {
        const node = routeNodes[i];
        const nextNode = routeNodes[i + 1];
        let segment = this.findPath(node, nextNode, true);
        if (segment) {
          let segmentRaw = segment as RawPathSegment;
          route.distance += segment.distance;
          route.time += segment.time;
          route.ascent += segment.ascent;
          route.descent += segment.descent;
          segments.push(...segmentRaw.segments);
          decodedArray.push(...segmentRaw.decodedArray);
          elevations.push(...segmentRaw.elevations);

          if (segment.highestNode) {
            if (
              !highestNode ||
              segment.highestNode.elevation > highestNode?.elevation
            ) {
              highestNode = segment.highestNode;
            }
          }
        } else return null;
      }

      segments.push({
        name: routeNodes[routeNodes.length - 1].name,
        color: [''],
        distance: 0,
        time: 0,
        length: 0,
      });

      const encoded = encode(decodedArray);
      const lastNode = routeNodes[routeNodes.length - 1];
      if (
        highestNode &&
        (routeNodes[0].name === routeNodes[routeNodes.length - 1].name ||
          routeNodes[0].elevation > lastNode.elevation ||
          routeNodes[0].elevation > lastNode.elevation - 150)
      ) {
        route.weatherSite = {
          id: highestNode.id,
          name: highestNode.name,
        };
      } else {
        route.weatherSite = {
          id: lastNode.id,
          name: lastNode.name,
        };
      }

      console.log(route.weatherSite);

      return {
        route,
        segments,
        encoded,
        elevations,
      };
    } else {
      return null;
    }
  }

  findPath(
    startNode: Node,
    targetNode: Node,
    raw: boolean,
  ): PathSegment | RawPathSegment | null {
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
        // const trail = mapFeatures.trails.get(openSet[i].trail_id);
        // const isClosed = (trail && trail.closed) ?? false;
        if (
          openSet[i].fCost < currentNode.fCost ||
          (openSet[i].fCost === currentNode.fCost &&
            openSet[i].hCost < currentNode.hCost)
        ) {
          // if (isClosed) {
          //   console.log(
          //     'trail skipped because of closure',
          //     openSet[i].trail_id,
          //   );
          //   continue;
          // }
          currentNode = openSet[i];
        }
      }

      if (currentNode.id === targetNode.id) {
        console.timeEnd('Search');
        //   console.log(closedSet);
        if (!raw) {
          return this.retracePath(currentNode).path;
        }
        return this.retraceRawPath(currentNode).path;
        // return this.retracePath(currentNode);
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

      const currentNodeLngLat = mapFeatures.nodes.get(currentNode.id);
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
            const neighborNodeLngLat = mapFeatures.nodes.get(neighbor.id);
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

  findPath2(
    startNode: Node,
    targetNode: Node,
    raw: boolean,
    avoidClosedTrails: boolean,
  ): {
    path: PathSegment | RawPathSegment;
    passedClosedTrail: boolean;
  } | null {
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
        const isClosed = mapFeatures.closedTrails.has(openSet[i].trail_id);
        if (
          openSet[i].fCost < currentNode.fCost ||
          (openSet[i].fCost === currentNode.fCost &&
            openSet[i].hCost < currentNode.hCost)
        ) {
          if (isClosed && avoidClosedTrails) {
            console.log('Skipped closed trail:', openSet[i].trail_id);
            continue;
          }
          currentNode = openSet[i];
        }
      }

      if (currentNode.id === targetNode.id) {
        console.timeEnd('Search');
        //   console.log(closedSet);
        if (!raw) {
          const { path, passedClosedTrail } = this.retracePath(currentNode);
          console.log('passedClosedTrail', passedClosedTrail);
          return { path, passedClosedTrail };
        }
        const { path, passedClosedTrail } = this.retraceRawPath(currentNode);
        return { path, passedClosedTrail };
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

      const currentNodeLngLat = mapFeatures.nodes.get(currentNode.id);
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
            const neighborNodeLngLat = mapFeatures.nodes.get(neighbor.id);
            if (!neighborNodeLngLat) {
              return null;
            }

            const costToNeighbor = currentNode.gCost + neighbor.distance;
            //   console.log(costToNeighbor, neighbor.id, neighbor.gCost, neighbor);

            const isClosed = mapFeatures.closedTrails.has(neighbor.trail_id);
            if (
              ((avoidClosedTrails && !isClosed) || !avoidClosedTrails) &&
              (costToNeighbor < neighbor.gCost ||
                !openSet.find(
                  (node) =>
                    node.id === neighbor.id &&
                    node.trail_id === neighbor.trail_id,
                ))
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

  getTrailDirection(
    trail: Trail,
    nextTrail: Trail,
    start: SegmentNode,
    end: SegmentNode,
  ) {
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

    return startToEnd;
  }

  getTrailAscentAndDescent(trail: Trail, startToEnd: boolean) {
    let ascent = 0;
    let descent = 0;

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
      } else if (trail.elevation_profile[i] > trail.elevation_profile[i + 1]) {
        if (startToEnd) {
          descent += elevationDelta;
        } else {
          ascent += elevationDelta;
        }
      }
    }

    return [ascent, descent];
  }

  getTrailTime(trail: Trail, startToEnd: boolean) {
    const time = startToEnd ? trail.time.start_end : trail.time.end_start;

    return time;
  }

  retracePath(current: SegmentNode): {
    path: PathSegment;
    passedClosedTrail: boolean;
  } {
    const trailsIds = [];
    let temp = current;
    let passedClosedTrail = false;

    trailsIds.push(temp.trail_id);
    while (temp.parent) {
      if (temp.parent.trail_id != 0) {
        trailsIds.push(temp.parent.trail_id);
      }
      temp = temp.parent;
    }
    trailsIds.reverse();

    // console.log(path);

    const route: Trail[] = [];
    let highestNode: Node | null = null;
    let distance = 0;
    let routeTime = 0;
    let totalAscent = 0;
    let totalDescent = 0;
    trailsIds.forEach((id) => {
      const trail = mapFeatures.trails.get(id);
      const isClosed = mapFeatures.closedTrails.has(id);
      if (trail) {
        if (isClosed) {
          passedClosedTrail = true;
        }
        route.push(trail as Trail);
      }
    });

    //   console.log(route);
    //   console.log(distance);
    const start = temp;
    const end = current;
    for (let i = 0; i < route.length; i++) {
      const trail = route[i];
      const nextTrail = route[i + 1];

      const nodeStart = mapFeatures.nodes.get(trail.node_id.start);
      const nodeEnd = mapFeatures.nodes.get(trail.node_id.end);
      if (nodeStart && nodeEnd) {
        if (!highestNode) {
          highestNode = nodeStart;
        }

        if (highestNode.elevation < nodeStart.elevation) {
          highestNode = nodeStart;
        }
        if (highestNode.elevation < nodeEnd.elevation) {
          highestNode = nodeEnd;
        }
      }

      const startToEnd = this.getTrailDirection(trail, nextTrail, start, end);

      distance += trail.distance;
      routeTime += this.getTrailTime(trail, startToEnd);
      const [ascent, descent] = this.getTrailAscentAndDescent(
        trail,
        startToEnd,
      );
      totalAscent += ascent;
      totalDescent += descent;

      console.log(
        trail.id,
        startToEnd,
        ascent,
        totalAscent,
        descent,
        totalDescent,
      );
    }

    //   console.log(routeTime);
    //   console.log(`${Math.floor(routeTime / 60)}h${routeTime % 60}m`);
    // return { trails: route, duration: routeTime, distance };
    return {
      path: {
        trails: trailsIds,
        distance,
        time: routeTime,
        ascent: totalAscent,
        descent: totalDescent,
        highestNode,
      },
      passedClosedTrail,
    };
  }

  retraceRawPath(current: SegmentNode): {
    path: RawPathSegment;
    passedClosedTrail: boolean;
  } {
    const trailsIds = [];
    let temp = current;
    let passedClosedTrail = false;

    trailsIds.push(temp.trail_id);
    while (temp.parent) {
      if (temp.parent.trail_id != 0) {
        trailsIds.push(temp.parent.trail_id);
      }
      temp = temp.parent;
    }
    trailsIds.reverse();

    // console.log(path);

    const route: Trail[] = [];
    let highestNode: Node | null = null;
    let decodedArray = [];
    const elevations = [];
    const segments: Segment[] = [];
    let distance = 0;
    let routeTime = 0;
    let totalAscent = 0;
    let totalDescent = 0;
    trailsIds.forEach((id) => {
      const trail = mapFeatures.trails.get(id);
      const isClosed = mapFeatures.closedTrails.has(id);
      if (trail) {
        if (isClosed) {
          passedClosedTrail = true;
        }
        route.push(trail as Trail);
      }
    });

    //   console.log(route);
    //   console.log(distance);
    const start = temp;
    const end = current;
    for (let i = 0; i < route.length; i++) {
      const trail = route[i];
      const nextTrail = route[i + 1];

      const nodeStart = mapFeatures.nodes.get(trail.node_id.start);
      const nodeEnd = mapFeatures.nodes.get(trail.node_id.end);
      if (nodeStart && nodeEnd) {
        if (!highestNode) {
          highestNode = nodeStart;
        }

        if (highestNode.elevation < nodeStart.elevation) {
          highestNode = nodeStart;
        }
        if (highestNode.elevation < nodeEnd.elevation) {
          highestNode = nodeEnd;
        }
      }

      const startToEnd = this.getTrailDirection(trail, nextTrail, start, end);

      const decoded = decode(trail.encoded);
      decodedArray.push(...(startToEnd ? decoded : decoded.reverse()));
      distance += trail.distance;
      const time = this.getTrailTime(trail, startToEnd);
      routeTime += time;
      const [ascent, descent] = this.getTrailAscentAndDescent(
        trail,
        startToEnd,
      );
      totalAscent += ascent;
      totalDescent += descent;
      elevations.push(
        ...(startToEnd
          ? trail.elevation_profile
          : [...trail.elevation_profile].reverse()),
      );
      const segment = {
        name: startToEnd ? trail.name.start : trail.name.end,
        color: trail.color,
        distance: trail.distance,
        time,
        length: decoded.length,
      };
      segments.push(segment);

      console.log(
        trail.id,
        startToEnd,
        ascent,
        totalAscent,
        descent,
        totalDescent,
      );
    }

    //   console.log(routeTime);
    //   console.log(`${Math.floor(routeTime / 60)}h${routeTime % 60}m`);
    // return { trails: route, duration: routeTime, distance };
    console.log('final', decodedArray);
    console.log('final', encode(decodedArray));

    return {
      path: {
        distance,
        time: routeTime,
        ascent: totalAscent,
        descent: totalDescent,
        highestNode,
        decodedArray,
        elevations,
        segments,
      },
      passedClosedTrail,
    };
  }
}
