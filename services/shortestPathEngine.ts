
import { ShortestPathInput, ShortestPathResult, ShortestPathStep } from "../types";

export class ShortestPathEngine {
    public static solveDijkstra(input: ShortestPathInput): ShortestPathResult {
        const { nodes, edges, startNode, endNode } = input;
        
        // Init
        const distances: Record<string, number> = {};
        const previous: Record<string, string | null> = {};
        const unvisited = new Set(nodes);
        const steps: ShortestPathStep[] = [];

        nodes.forEach(n => {
            distances[n] = Infinity;
            previous[n] = null;
        });
        distances[startNode] = 0;

        let stepCount = 0;

        while (unvisited.size > 0) {
            // Find unvisited node with min distance
            let current: string | null = null;
            let minDist = Infinity;
            
            for (const node of unvisited) {
                if (distances[node] < minDist) {
                    minDist = distances[node];
                    current = node;
                }
            }

            // If we can't reach any more nodes or reached destination
            if (current === null || distances[current] === Infinity) break;
            
            // Log step before exploring neighbors
            stepCount++;
            
            unvisited.delete(current);

            // Reached target?
            if (current === endNode) {
                steps.push({
                    stepIndex: stepCount,
                    visitedNode: current,
                    distances: { ...distances },
                    description: `Reached target node ${current} with minimum distance ${distances[current]}.`
                });
                break;
            }

            // Explore neighbors
            const neighbors = edges.filter(e => e.from === current || e.to === current);
            let updatedNeighbors = 0;

            for (const edge of neighbors) {
                const neighbor = edge.from === current ? edge.to : edge.from;
                if (!unvisited.has(neighbor)) continue;

                const alt = distances[current] + edge.weight;
                if (alt < distances[neighbor]) {
                    distances[neighbor] = alt;
                    previous[neighbor] = current;
                    updatedNeighbors++;
                }
            }

            steps.push({
                stepIndex: stepCount,
                visitedNode: current,
                distances: { ...distances },
                description: `Visited ${current}. Updated ${updatedNeighbors} neighbor(s).`
            });
        }

        // Reconstruct Path
        const path: string[] = [];
        let u: string | null = endNode;
        if (distances[endNode] !== Infinity) {
            while (u !== null) {
                path.unshift(u);
                u = previous[u];
            }
        }

        return {
            path,
            totalDistance: distances[endNode],
            steps
        };
    }
}
