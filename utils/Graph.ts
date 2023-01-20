export type Edge = {
  node_id: number;
  trail_id: number;
  distance: number;
  passable: boolean;
};

export default class Graph {
  adjacencyList = new Map<number, Edge[]>();

  addVertex(node: number) {
    this.adjacencyList.set(node, []);
  }

  addEdge(origin: Edge, destination: Edge) {
    this.adjacencyList.get(origin.node_id)?.push(destination);
    this.adjacencyList.get(destination.node_id)?.push(origin);
  }
}
