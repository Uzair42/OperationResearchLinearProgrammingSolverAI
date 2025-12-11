
import { GameTreeNode, MinimaxResult, MinimaxStep } from "../types";

export class MinimaxEngine {

    // Helper to generate a random game tree
    public static generateTree(depth: number, branchingFactor: number): GameTreeNode {
        let nodeIdCounter = 0;

        const createNode = (currentDepth: number, isMaximizing: boolean): GameTreeNode => {
            const id = `node-${nodeIdCounter++}`;
            const node: GameTreeNode = {
                id,
                value: null,
                children: [],
                isMaximizing
            };

            if (currentDepth === depth) {
                // Leaf node - assign random value between -10 and 10
                node.value = Math.floor(Math.random() * 21) - 10;
            } else {
                for (let i = 0; i < branchingFactor; i++) {
                    node.children.push(createNode(currentDepth + 1, !isMaximizing));
                }
            }
            return node;
        };

        return createNode(0, true);
    }

    public static solve(root: GameTreeNode, algorithm: 'MINIMAX' | 'ALPHA_BETA'): MinimaxResult {
        const steps: MinimaxStep[] = [];
        let stepCount = 0;

        // Clone tree to avoid mutating original structure references if used elsewhere
        const treeCopy = JSON.parse(JSON.stringify(root));

        const logStep = (nodeId: string, action: MinimaxStep['action'], val: number | null, alpha: number, beta: number, desc: string, prunedId?: string) => {
            stepCount++;
            steps.push({
                stepIndex: stepCount,
                nodeId,
                action,
                currentValue: val,
                alpha,
                beta,
                description: desc,
                prunedNodeId: prunedId
            });
        };

        const minimax = (node: GameTreeNode): number => {
            logStep(node.id, 'VISIT', node.value, -Infinity, Infinity, `Visiting ${node.isMaximizing ? 'Maximizer' : 'Minimizer'} Node.`);

            if (node.children.length === 0) {
                // Leaf
                logStep(node.id, 'EVALUATE', node.value, -Infinity, Infinity, `Leaf Node evaluated: ${node.value}`);
                return node.value!;
            }

            if (node.isMaximizing) {
                let maxEval = -Infinity;
                for (const child of node.children) {
                    const evalVal = minimax(child);
                    if (evalVal > maxEval) {
                        maxEval = evalVal;
                        logStep(node.id, 'UPDATE', maxEval, -Infinity, Infinity, `Maximizer updates best value to ${maxEval}`);
                    }
                }
                node.value = maxEval;
                return maxEval;
            } else {
                let minEval = Infinity;
                for (const child of node.children) {
                    const evalVal = minimax(child);
                    if (evalVal < minEval) {
                        minEval = evalVal;
                        logStep(node.id, 'UPDATE', minEval, -Infinity, Infinity, `Minimizer updates best value to ${minEval}`);
                    }
                }
                node.value = minEval;
                return minEval;
            }
        };

        const alphaBeta = (node: GameTreeNode, alpha: number, beta: number): number => {
            logStep(node.id, 'VISIT', node.value, alpha, beta, `Visiting ${node.isMaximizing ? 'Maximizer' : 'Minimizer'} Node.`);

            if (node.children.length === 0) {
                logStep(node.id, 'EVALUATE', node.value, alpha, beta, `Leaf Node evaluated: ${node.value}`);
                return node.value!;
            }

            if (node.isMaximizing) {
                let maxEval = -Infinity;
                for (let i = 0; i < node.children.length; i++) {
                    const child = node.children[i];
                    const evalVal = alphaBeta(child, alpha, beta);
                    
                    if (evalVal > maxEval) {
                        maxEval = evalVal;
                        logStep(node.id, 'UPDATE', maxEval, alpha, beta, `Maximizer found better move: ${maxEval}`);
                    }
                    
                    if (evalVal > alpha) {
                        alpha = evalVal;
                        logStep(node.id, 'UPDATE', maxEval, alpha, beta, `Alpha updated to ${alpha}`);
                    }

                    if (beta <= alpha) {
                        // Prune remaining children
                        for(let j = i+1; j < node.children.length; j++) {
                            logStep(node.id, 'PRUNE', maxEval, alpha, beta, `Beta (${beta}) <= Alpha (${alpha}). Pruning branch.`, node.children[j].id);
                        }
                        break;
                    }
                }
                node.value = maxEval;
                return maxEval;
            } else {
                let minEval = Infinity;
                for (let i = 0; i < node.children.length; i++) {
                    const child = node.children[i];
                    const evalVal = alphaBeta(child, alpha, beta);
                    
                    if (evalVal < minEval) {
                        minEval = evalVal;
                        logStep(node.id, 'UPDATE', minEval, alpha, beta, `Minimizer found better move: ${minEval}`);
                    }

                    if (evalVal < beta) {
                        beta = evalVal;
                        logStep(node.id, 'UPDATE', minEval, alpha, beta, `Beta updated to ${beta}`);
                    }

                    if (beta <= alpha) {
                        for(let j = i+1; j < node.children.length; j++) {
                            logStep(node.id, 'PRUNE', minEval, alpha, beta, `Beta (${beta}) <= Alpha (${alpha}). Pruning branch.`, node.children[j].id);
                        }
                        break;
                    }
                }
                node.value = minEval;
                return minEval;
            }
        };

        let optimalValue: number;
        if (algorithm === 'MINIMAX') {
            optimalValue = minimax(treeCopy);
        } else {
            optimalValue = alphaBeta(treeCopy, -Infinity, Infinity);
        }

        return {
            root: treeCopy,
            optimalValue,
            steps,
            algorithm
        };
    }
}
