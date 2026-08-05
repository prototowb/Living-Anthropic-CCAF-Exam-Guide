import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import ScenarioView from '../views/ScenarioView.vue'
import DomainsView from '../views/DomainsView.vue'
import DrillView from '../views/DrillView.vue'
import AboutView from '../views/AboutView.vue'

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/scenario/:id', name: 'scenario', component: ScenarioView, props: true },
    { path: '/domains', name: 'domains', component: DomainsView },
    { path: '/drill', name: 'drill', component: DrillView },
    { path: '/about', name: 'about', component: AboutView },
  ],
  scrollBehavior() {
    return { top: 0 }
  },
})
