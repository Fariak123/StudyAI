export interface Exercise {
  id: string;
  question: string;
  type: 'mcq' | 'open' | 'true_false';
  options?: string[];        // for mcq only
  answer: string;
  explanation: string;
}

export interface Concept {
  title: string;
  definition: string;
  whyItMatters: string;
  example: string;
}

export interface Chapter {
  id: string;
  title: string;
  summary: string;
  concepts: Concept[];
  keyPoints: string[];
  exercises: Exercise[];
  progress: number;          // 0-100
  weakArea: boolean;
}

export interface Book {
  id: string;
  title: string;
  fileName: string;
  chapters: Chapter[];
  createdAt: string;
  totalProgress: number;
}