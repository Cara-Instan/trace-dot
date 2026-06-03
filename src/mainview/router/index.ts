import { createRouter, createWebHashHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';
import MergeView from '../views/MergeView.vue';
import SplitView from '../views/SplitView.vue';
import HistoryView from '../views/HistoryView.vue';
import SettingsView from '../views/SettingsView.vue';

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/merge', name: 'merge', component: MergeView },
    { path: '/split', name: 'split', component: SplitView },
    { path: '/history', name: 'history', component: HistoryView },
    { path: '/settings', name: 'settings', component: SettingsView },
  ],
});

export default router;