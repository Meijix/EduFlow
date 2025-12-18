
export enum StudyStatus {
  PENDING = 'PENDING',      // Por aprender
  IN_PROGRESS = 'IN_PROGRESS', // En proceso
  REVIEWING = 'REVIEWING',     // Repasando
  COMPLETED = 'COMPLETED'      // Dominado
}

export type ResourceType = 'link' | 'video' | 'book' | 'pdf' | 'other';

export interface Resource {
  id: string;
  type: ResourceType;
  title: string;
  url: string;
  description?: string;
  watched?: boolean;
  videoNotes?: string;
}

export interface Topic {
  id: string;
  title: string;
  description: string;
  status: StudyStatus;
  notes: string;
  resources: Resource[];
  timeSpent: number; // In seconds
  lastStudied?: string;
  reviewLevel: number; // 0 to 6
  nextReviewAt?: string; // ISO string
}

export interface StudyLog {
  date: string; // YYYY-MM-DD
  count: number; // Number of sessions or minutes
}

export interface StudyArea {
  id: string;
  name: string;
  description: string;
  icon: string;
  topics: Topic[];
  createdAt: string;
}

export interface StudyPlanResponse {
  areaName: string;
  description: string;
  recommendedTopics: {
    title: string;
    description: string;
  }[];
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswerIndex: number;
}
