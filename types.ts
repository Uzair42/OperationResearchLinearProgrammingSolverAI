export enum OptimizationType {
  MAXIMIZE = 'MAXIMIZE',
  MINIMIZE = 'MINIMIZE'
}

export enum ConstraintSign {
  LESS_EQ = '<=',
  GREATER_EQ = '>=',
  EQ = '='
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
}

export interface TableauRow {
  basicVar: string;
  coefficients: number[];
  rhs: number;
  ratio?: number | null;
}

export type SolverStatus = 'IN_PROGRESS' | 'OPTIMAL' | 'UNBOUNDED' | 'INFEASIBLE' | 'ALTERNATIVE_SOLUTION';

export interface SolverStep {
  stepIndex: number;
  description: string;
  tableau: TableauRow[];
  headers: string[]; // Column headers (x1, x2, s1, a1, etc.)
  zRow: number[]; // The objective function row in the tableau
  pivotRowIdx?: number;
  pivotColIdx?: number;
  enteringVar?: string;
  leavingVar?: string;
  isOptimal: boolean;
  status: SolverStatus;
  solution?: Record<string, number>;
  zValue?: number;
  highlightCols?: number[]; // For visual explanations
  highlightRows?: number[]; // For visual explanations
}

export enum SolverMethod {
  SIMPLEX = 'Simplex',
  BIG_M = 'Big M',
  TWO_PHASE = 'Two Phase'
}