<script setup lang="ts">
import { ref, onMounted } from 'vue';
import QuickAccess from '../components/QuickAccess.vue';
import UsageStats from '../components/UsageStats.vue';
import HistoryTable from '../components/HistoryTable.vue';
import { useElectroView } from '../composables/useRPC.js';
import type { HistoryItem } from '../types/history';

const { electroview } = useElectroView();

const recentHistory = ref<HistoryItem[]>([]);

onMounted(async () => {
  try {
    const result = await electroview.rpc?.request('historyList', { limit: 5 });
    if (result) recentHistory.value = result;
  } catch {
    // RPC not ready or no history
  }
});
</script>

<template>
  <div class="flex flex-col gap-10 max-w-4xl">
    <QuickAccess />
    <UsageStats />
    <div>
      <div class="text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-3">Recent Activity</div>
      <HistoryTable :items="recentHistory" compact />
    </div>
  </div>
</template>
