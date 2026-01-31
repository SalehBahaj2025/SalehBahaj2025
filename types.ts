
export enum Language {
  AR = 'ar',
  EN = 'en'
}

export enum QuestionType {
  MULTIPLE_CHOICE = 'multiple_choice',
  TRUE_FALSE = 'true_false',
  FILL_BLANK = 'fill_blank',
  ESSAY = 'essay',
  MATCHING = 'matching'
}

export interface QuestionOption {
  id: string;
  text: { [key in Language]: string };
  isCorrect: boolean;
}

export interface MatchingPair {
  id: string;
  left: { [key in Language]: string };
  right: { [key in Language]: string };
}

export interface Question {
  id: string;
  type: QuestionType;
  text: { [key in Language]: string };
  points: number;
  timeLimit?: number; // in seconds, per question
  options?: QuestionOption[];
  matchingPairs?: MatchingPair[];
  correctAnswer?: string; // For fill_blank or TF
}

export interface Test {
  id: string;
  category?: 'quiz' | 'final' | 'practice' | 'cert';
  subject: { [key in Language]: string }; // New field for Subject
  title: { [key in Language]: string };
  description: { [key in Language]: string };
  timeLimit: number; // in minutes (total exam time)
  scheduledStartTime?: string; // ISO string format
  scheduledEndTime?: string; // ISO string format
  passingScore: number;
  questions: Question[];
  status: 'draft' | 'published';
  createdAt: string;
}

export interface TestAttempt {
  id: string;
  testId: string;
  testTitle: { [key in Language]: string };
  startTime: string;
  endTime?: string;
  answers: Record<string, any>;
  score: number;
  totalPoints: number;
  status: 'in_progress' | 'completed';
}

export type Role = 'admin' | 'creator' | 'student';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  lang: Language;
}
