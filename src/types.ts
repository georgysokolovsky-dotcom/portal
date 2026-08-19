/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'student' | 'mentor' | 'admin';
export type UserLevel = 'beginner' | 'practicing';

export interface User {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  level?: UserLevel;
  field?: string;
  createdAt: number;
}

export type ProjectStatus = 'new' | 'in-progress' | 'waiting-for-student' | 'sent-to-mentor' | 'needs-work' | 'approved' | 'completed';

export interface Project {
  id: string;
  userId: string;
  name: string;
  status: ProjectStatus;
  currentStep: number;
  progress: number;
  createdAt: number;
  updatedAt: number;
}

export interface Step {
  projectId: string;
  stepNumber: number;
  data: Record<string, any>;
  aiFeedback?: string;
  mentorComments?: MentorComment[];
  updatedAt: number;
}

export interface MentorComment {
  id: string;
  text: string;
  createdAt: number;
  authorId: string;
  authorName: string;
}

export interface Offer {
  projectId: string;
  options: string[];
  selectedOption?: number;
  createdAt: number;
}

export interface Longread {
  projectId: string;
  content: string;
  createdAt: number;
}

export const STEPS_COUNT = 8;

export const STEPS_LABELS = [
  'Распаковка личности и экспертности',
  'Выбор рабочей темы',
  'Анализ целевой аудитории',
  'Выявление боли и ожидания',
  'История клиента',
  'История автора',
  'Создание оффера',
  'Готовый лонгрид'
];
