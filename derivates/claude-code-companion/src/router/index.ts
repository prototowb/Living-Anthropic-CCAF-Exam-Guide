import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  { path: '/', name: 'home', component: () => import('@/views/HomeView.vue') },
  { path: '/learn', name: 'stage-index', component: () => import('@/views/StageIndexView.vue') },
  { path: '/learn/:id', name: 'stage', component: () => import('@/views/StageView.vue'), props: true },
  { path: '/quiz', name: 'quiz-index', component: () => import('@/views/QuizIndexView.vue') },
  { path: '/quiz/:section', name: 'quiz-section', component: () => import('@/views/QuizSectionView.vue'), props: true },
  { path: '/quiz/:section/:qid', name: 'quiz-question', component: () => import('@/views/QuizQuestionView.vue'), props: true },
  { path: '/lessons', name: 'lessons-index', component: () => import('@/views/LessonsIndexView.vue') },
  { path: '/lessons/:id', name: 'lesson', component: () => import('@/views/LessonView.vue'), props: true },
  { path: '/sandboxes', name: 'sandboxes-index', component: () => import('@/views/SandboxesIndexView.vue') },
  { path: '/sandboxes/:id', name: 'sandbox', component: () => import('@/views/SandboxView.vue'), props: true },
  { path: '/tutor', name: 'tutor', component: () => import('@/views/TutorView.vue') },
  { path: '/under-the-hood', name: 'under-the-hood', component: () => import('@/views/UnderTheHoodView.vue') },
  // Scenario 5 v0.4 task 9 — annotated CI review prompt teaching artefact.
  { path: '/prompt-dissection', name: 'prompt-dissection', component: () => import('@/views/PromptDissectionView.vue') },
  // Dev-only — Scenario 3 v0.3 task 9 regression harness.
  { path: '/debug', name: 'debug', component: () => import('@/views/DebugView.vue') },
  { path: '/:catchAll(.*)', redirect: '/' },
];

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 };
  },
});
