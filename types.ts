
export enum OptimizationType {
  MAXIMIZE = 'MAXIMIZE',
  MINIMIZE = 'MINIMIZE'
}

export enum ConstraintSign {
  LESS_EQ = '<=',
  GREATER_EQ = '>=',
  EQ = '='
}

/* --- APP STATE TYPES --- */
export type UserPersona = 'student' | 'business';

export type UserRole = 'learner' | 'business';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  companyName?: string;
  isPremium: boolean;
  avatarInitials: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'info' | 'success' | 'warning' | 'error';
}

/* --- AI LEARNING TYPES --- */
export type LearningLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

export interface LearningTopic {
    id: string;
    title: string;
    level: LearningLevel;
    shortDesc: string;
    description: string; // Detailed Markdown
    visualType: 'NEURON' | 'NETWORK' | 'GRADIENT' | 'ATTENTION'; // Maps to internal visualizers
    traditionalView: string; // How it was done before
    modernView: string; // How it is done now (Deep Learning)
}

export interface GeneratedVideo {
    uri: string;
    prompt: string;
    expiresAt: number;
}

/* --- NEURAL NETWORK TYPES --- */
export type LayerType = 'DENSE' | 'DROPOUT' | 'CONV2D' | 'LSTM' | 'OUTPUT';
export type ActivationFunction = 'relu' | 'sigmoid' | 'tanh' | 'softmax' | 'linear';

export interface NeuralLayer {
    id: string;
    type: LayerType;
    neurons: number;
    activation?: ActivationFunction;
    rate?: number; // For Dropout
    isPremium?: boolean; // Premium lock
}

export interface NeuralModelConfig {
    name: string;
    description: string;
    problemType: 'REGRESSION' | 'CLASSIFICATION';
    inputFeatures: number;
    layers: NeuralLayer[];
    optimizer: 'adam' | 'sgd' | 'rmsprop';
    learningRate: number;
    loss: string;
}

export interface Variable {
  id: string;
  coefficient: number;
}

export interface Constraint {
  id: string;
  coefficients: number[]; // Index corresponds to variable index
  sign: ConstraintSign;
  rhs: number; // Right hand side value
}

export interface LPProblem {
  type: OptimizationType;
  variables: string[]; // Names of variables (e.g., x1, x2)
  objectiveCoefficients: number[];
  constraints: Constraint[];
  nonNegative?: boolean; // Defaults to true. If false, variables are unrestricted (can be negative).
}

/* --- BUSINESS LAYER TYPES --- */
export interface BusinessProduct {
  id: string;
  name: string;
  profit: number; // Objective Coefficient
}

export interface BusinessResource {
  id: string;
  name: string;
  available: number; // RHS
}

export interface BusinessModel {
  products: BusinessProduct[];
  resources: BusinessResource[];
  // Matrix: consumption[resourceId][productId] = amount used
  consumption: Record<string, Record<string, number>>; 
}
/* ---------------------------- */

/* --- NETWORK ANALYSIS (PERT/CPM) TYPES --- */
export interface NetworkTask {
  id: string;
  name: string;
  predecessors: string[]; // Array of IDs
  // CPM
  duration: number;
  // PERT
  optimistic?: number;  // a
  mostLikely?: number;  // m
  pessimistic?: number; // b
}

export interface NetworkCalculation {
  id: string;
  es: number; // Early Start
  ef: number; // Early Finish
  ls: number; // Late Start
  lf: number; // Late Finish
  slack: number;
  isCritical: boolean;
  expectedTime: number; // te
  variance: number;     // sigma^2
}

export interface NetworkResult {
  tasks: NetworkCalculation[];
  projectDuration: number;
  criticalPath: string[]; // List of Task IDs
  projectVariance: number;
  standardDeviation: number;
}
/* ----------------------------------------- */

/* --- TRANSPORTATION MODEL TYPES --- */
export interface TransportationInput {
  sources: { id: string, name: string, supply: number }[];
  destinations: { id: string, name: string, demand: number }[];
  costs: number[][]; // costs[sourceIndex][destIndex]
}

export interface TransportationAllocation {
  sourceIndex: number;
  destIndex: number;
  quantity: number;
  costPerUnit: number;
}

export interface TransportationResult {
  method: 'NWCR' | 'LCM' | 'VAM';
  allocations: TransportationAllocation[];
  totalCost: number;
  steps: string[]; // Log of steps taken
  isBalanced: boolean;
}
/* -------------------------------------- */

/* --- ASSIGNMENT MODEL TYPES --- */
export interface AssignmentInput {
  rows: { id: string, name: string }[]; // Workers/Machines
  cols: { id: string, name: string }[]; // Jobs/Tasks
  matrix: number[][];
  type: OptimizationType; // Maximize (Profit) or Minimize (Cost/Time)
}

export interface AssignmentResult {
  assignments: { rowIdx: number, colIdx: number, value: number }[];
  totalValue: number;
  steps: string[];
  finalMatrix: number[][]; // The reduced matrix
  isBalanced: boolean;
  matrixSize: number; // N x N
}
/* -------------------------------------- */

/* --- QUEUING THEORY TYPES --- */
export interface QueuingInput {
  arrivalRate: number; // Lambda
  serviceRate: number; // Mu
  timeUnit: string;    // e.g., "Hour", "Minute"
}

export interface QueuingResult {
  rho: number; // Traffic Intensity / Utilization
  Lq: number;  // Avg number in queue
  Ls: number;  // Avg number in system
  Wq: number;  // Avg time in queue
  Ws: number;  // Avg time in system
  P0: number;  // Probability of 0 customers
  Pn?: number[]; // Probability distribution for first few n
  isStable: boolean;
}
/* -------------------------------------- */

/* --- GAME THEORY TYPES --- */
export interface GameTheoryInput {
  playerAStrategies: string[]; // Row Player
  playerBStrategies: string[]; // Col Player
  matrix: number[][]; // payoff[row][col]
}

export interface GameTheoryResult {
  hasSaddlePoint: boolean;
  saddlePoint?: { row: number, col: number, value: number };
  value: number;
  optimalStrategiesA: number[]; // Probabilities
  optimalStrategiesB: number[]; // Probabilities
  reducedMatrix?: number[][];
  reductionSteps: string[];
  methodUsed: 'SADDLE_POINT' | 'DOMINANCE' | 'MIXED_2X2' | 'LP';
}
/* -------------------------------------- */

/* --- SHORTEST PATH (DIJKSTRA) TYPES --- */
export interface ShortestPathInput {
    nodes: string[];
    edges: { from: string, to: string, weight: number }[];
    startNode: string;
    endNode: string;
}

export interface ShortestPathStep {
    stepIndex: number;
    visitedNode: string;
    distances: Record<string, number>;
    description: string;
}

export interface ShortestPathResult {
    path: string[];
    totalDistance: number;
    steps: ShortestPathStep[];
}
/* -------------------------------------- */

/* --- MINIMAX / ALPHA-BETA TYPES --- */
export interface GameTreeNode {
    id: string;
    value: number | null; // Null for internal nodes initially
    children: GameTreeNode[];
    isMaximizing: boolean;
    name?: string; // For business context labels
}

export interface MinimaxStep {
    stepIndex: number;
    nodeId: string;
    action: 'VISIT' | 'EVALUATE' | 'UPDATE' | 'PRUNE';
    currentValue: number | null;
    alpha: number;
    beta: number;
    description: string;
    prunedNodeId?: string; // If action is PRUNE
}

export interface MinimaxResult {
    root: GameTreeNode;
    optimalValue: number;
    steps: MinimaxStep[];
    algorithm: 'MINIMAX' | 'ALPHA_BETA';
}
/* -------------------------------------- */

/* --- AI RESPONSE TYPES --- */
export type ProblemCategory = 'LINEAR_PROGRAMMING' | 'NETWORK' | 'TRANSPORTATION' | 'ASSIGNMENT' | 'QUEUING' | 'GAME_THEORY' | 'SHORTEST_PATH' | 'MINIMAX';

export interface UniversalProblemResult {
  category: ProblemCategory;
  lp?: LPProblem;
  network?: NetworkTask[];
  transportation?: TransportationInput;
  assignment?: AssignmentInput;
  queuing?: QueuingInput;
  gameTheory?: GameTheoryInput;
  shortestPath?: ShortestPathInput;
}
/* -------------------------------------- */

export interface HistoryItem {
  id: string;
  timestamp: number;
  problem?: LPProblem;
  network?: { tasks: NetworkTask[], result: NetworkResult }; 
  transportation?: { input: TransportationInput, result: TransportationResult };
  assignment?: { input: AssignmentInput, result: AssignmentResult };
  queuing?: { input: QueuingInput, result: QueuingResult };
  gameTheory?: { input: GameTheoryInput, result: GameTheoryResult };
  shortestPath?: { input: ShortestPathInput, result: ShortestPathResult };
  minimax?: { result: MinimaxResult };
  method: SolverMethod | 'PERT/CPM' | 'Transportation' | 'Hungarian' | 'M/M/1' | 'Game Theory' | 'Dijkstra' | 'Alpha-Beta';
}

export interface TableauRow {
  basicVar: string;
  basicVarCost: number; // Cb
  coefficients: number[];
  rhs: number;
  ratio?: number | null;
}

export type SolverStatus = 'IN_PROGRESS' | 'OPTIMAL' | 'UNBOUNDED' | 'INFEASIBLE' | 'ALTERNATIVE_SOLUTION';

export interface SolverStep {
  stepIndex: number;
  phase?: 1 | 2; // For Two-Phase method
  description: string;
  operations?: string[]; // Matrix operations performed to reach this step
  tableau: TableauRow[];
  headers: string[]; // Column headers (x1, x2, s1, a1, etc.)
  cjRow: number[]; // The original objective function coefficients (Top row)
  zjRow: number[]; // Zj row (Sum of Cb * aij)
  netEvaluationRow: number[]; // Cj - Zj row
  pivotRowIdx?: number;
  pivotColIdx?: number;
  enteringVar?: string;
  leavingVar?: string;
  isOptimal: boolean;
  status: SolverStatus;
  solution?: Record<string, number>;
  zValue?: number;
  standardFormEquations?: string[];
  shadowPrices?: Record<string, number>; // Marginal value of constraints
}

export enum SolverMethod {
  SIMPLEX = 'Simplex',
  BIG_M = 'Big M',
  TWO_PHASE = 'Two Phase'
}
