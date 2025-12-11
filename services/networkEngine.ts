
import { NetworkTask, NetworkResult, NetworkCalculation } from "../types";

export class NetworkEngine {

    public static calculatePERT(tasksInput: NetworkTask[]): NetworkResult {
        // 1. Calculate Expected Time (te) and Variance (v)
        const tasksWithStats = tasksInput.map(t => {
            let te = t.duration;
            let v = 0;
            
            // If PERT values exist
            if (t.optimistic !== undefined && t.mostLikely !== undefined && t.pessimistic !== undefined) {
                // te = (a + 4m + b) / 6
                te = (t.optimistic + 4 * t.mostLikely + t.pessimistic) / 6;
                // v = ((b - a) / 6)^2
                v = Math.pow((t.pessimistic - t.optimistic) / 6, 2);
            }

            return {
                ...t,
                expectedTime: te,
                variance: v
            };
        });

        // 2. Topological Sort / Leveling (Simple approach for AON)
        // We need to process Forward pass in dependency order
        // Create a map for easy lookup
        const calcMap = new Map<string, NetworkCalculation>();
        
        // Initialize
        tasksWithStats.forEach(t => {
            calcMap.set(t.id, {
                id: t.id,
                es: 0, ef: 0, ls: Infinity, lf: Infinity,
                slack: 0, isCritical: false,
                expectedTime: t.expectedTime,
                variance: t.variance
            });
        });

        // --- FORWARD PASS (Calculate ES, EF) ---
        // Iterate enough times to propagate dependencies (or use Kahn's algo). 
        // Simple bubble propagation for small graphs is sufficient and robust against slight ordering issues.
        let changes = true;
        let loops = 0;
        while(changes && loops < tasksWithStats.length + 2) {
            changes = false;
            tasksWithStats.forEach(task => {
                const current = calcMap.get(task.id)!;
                let maxPredEF = 0;
                
                // Find max EF of all predecessors
                task.predecessors.forEach(predId => {
                    const pred = calcMap.get(predId);
                    if (pred && pred.ef > maxPredEF) {
                        maxPredEF = pred.ef;
                    }
                });

                if (current.es !== maxPredEF) {
                    current.es = maxPredEF;
                    current.ef = current.es + current.expectedTime;
                    changes = true;
                }
                // Determine EF based on possibly updated ES
                if (current.ef !== current.es + current.expectedTime) {
                    current.ef = current.es + current.expectedTime;
                }
            });
            loops++;
        }

        const projectDuration = Math.max(...Array.from(calcMap.values()).map(c => c.ef));

        // --- BACKWARD PASS (Calculate LS, LF) ---
        // Initialize LF of end tasks to Project Duration
        tasksWithStats.forEach(t => {
            const node = calcMap.get(t.id)!;
            // Check if this task is a predecessor to ANY other task. If not, it's an end node.
            const isPredecessorToSomeone = tasksWithStats.some(other => other.predecessors.includes(t.id));
            if (!isPredecessorToSomeone) {
                node.lf = projectDuration;
                node.ls = node.lf - node.expectedTime;
            }
        });

        // Propagate backwards
        changes = true;
        loops = 0;
        while(changes && loops < tasksWithStats.length + 2) {
            changes = false;
            // We iterate in reverse roughly
            for (let i = tasksWithStats.length - 1; i >= 0; i--) {
                const task = tasksWithStats[i];
                const current = calcMap.get(task.id)!;
                
                // Find all tasks that have 'current' as a predecessor (Successors)
                const successors = tasksWithStats.filter(t => t.predecessors.includes(task.id));
                
                if (successors.length > 0) {
                    const minSuccLS = Math.min(...successors.map(s => calcMap.get(s.id)!.ls));
                    if (current.lf !== minSuccLS && isFinite(minSuccLS)) {
                         current.lf = minSuccLS;
                         current.ls = current.lf - current.expectedTime;
                         changes = true;
                    }
                }
            }
            loops++;
        }

        // --- CALCULATE SLACK & CRITICAL PATH ---
        const criticalPathIds: string[] = [];
        let projectVariance = 0;

        calcMap.forEach(node => {
            // Float/Slack
            node.slack = node.ls - node.es;
            // Floating point tolerance
            if (Math.abs(node.slack) < 0.0001) {
                node.slack = 0;
                node.isCritical = true;
                criticalPathIds.push(node.id);
                projectVariance += node.variance;
            } else {
                node.isCritical = false;
            }
        });

        return {
            tasks: Array.from(calcMap.values()),
            projectDuration,
            criticalPath: criticalPathIds,
            projectVariance,
            standardDeviation: Math.sqrt(projectVariance)
        };
    }

    // Helper: Calculate Z-Score Probability
    public static calculateProbability(targetTime: number, result: NetworkResult): number {
        if (result.standardDeviation === 0) return result.projectDuration <= targetTime ? 100 : 0;
        
        const z = (targetTime - result.projectDuration) / result.standardDeviation;
        
        // Approximation of CDF for Standard Normal Distribution
        const t = 1 / (1 + 0.2316419 * Math.abs(z));
        const d = 0.3989423 * Math.exp(-z * z / 2);
        let prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
        
        if (z > 0) prob = 1 - prob;
        
        return prob * 100;
    }
}
