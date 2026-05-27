import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  { path: '/', name: 'home', component: () => import('@/views/HomeView.vue') },
  { path: '/quiz', name: 'quiz', component: () => import('@/views/QuizIndexView.vue') },
  {
    path: '/quiz/:section',
    name: 'quiz-section',
    component: () => import('@/views/QuizSectionView.vue'),
    props: true,
  },
  {
    path: '/quiz/:section/:qid',
    name: 'quiz-question',
    component: () => import('@/views/QuizQuestionView.vue'),
    props: true,
  },
  { path: '/domains', name: 'domains', component: () => import('@/views/DomainsIndexView.vue') },
  {
    path: '/domains/:id',
    name: 'domain',
    component: () => import('@/views/DomainView.vue'),
    props: true,
  },
  { path: '/tutor', name: 'tutor', component: () => import('@/views/TutorView.vue') },
  {
    path: '/mock-exam',
    name: 'mock-exam',
    component: () => import('@/views/MockExamStartView.vue'),
  },
  {
    path: '/mock-exam/run',
    name: 'mock-exam-run',
    component: () => import('@/views/MockExamRunView.vue'),
  },
  {
    path: '/mock-exam/result/:id',
    name: 'mock-exam-result',
    component: () => import('@/views/MockExamResultView.vue'),
    props: true,
  },
  {
    path: '/mock-exam/review/:id',
    name: 'mock-exam-review',
    component: () => import('@/views/MockExamReviewView.vue'),
    props: true,
  },
  {
    path: '/atlas',
    name: 'atlas',
    component: () => import('@/views/AtlasView.vue'),
  },
  {
    path: '/atlas/:flowId',
    name: 'flow',
    component: () => import('@/views/FlowWalkthroughView.vue'),
    props: true,
  },
  {
    path: '/patterns',
    name: 'patterns',
    component: () => import('@/views/PatternsIndexView.vue'),
  },
  {
    path: '/patterns/:id',
    name: 'pattern',
    component: () => import('@/views/PatternView.vue'),
    props: true,
  },
  { path: '/lessons', name: 'lessons', component: () => import('@/views/LessonsIndexView.vue') },
  {
    path: '/lessons/:id',
    name: 'lesson',
    component: () => import('@/views/LessonView.vue'),
    props: true,
  },
  {
    path: '/practice',
    name: 'practice',
    component: () => import('@/views/WeakSpotsView.vue'),
  },
  {
    path: '/glossary',
    name: 'glossary',
    component: () => import('@/views/GlossaryView.vue'),
  },
  { path: '/:pathMatch(.*)*', redirect: '/' },
];

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 };
  },
});
