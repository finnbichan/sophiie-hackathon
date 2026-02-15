// src/types/analysis.d.ts
export interface Action {
  type: 'action';
  description: string;
  // Add other relevant fields for actions, e.g., 'assignee', 'due_date'
}

export interface Question {
  type: 'question';
  text: string;
}

export interface NullAnalysis {
  type: 'null';
}

export type AnalysisResult = Action | Question | NullAnalysis;
