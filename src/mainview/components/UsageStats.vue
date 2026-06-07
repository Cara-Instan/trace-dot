<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useElectroView } from '../composables/useRPC.js';
import { getRelativeTime } from '../utils/format';

const { electroview } = useElectroView();

const counts = ref<{ total: number; merges: number; splits: number }>({ total: 0, merges: 0, splits: 0 });
const lastOpTime = ref<string | null>(null);

onMounted(async () => {
  try {
    const result = await electroview.rpc?.request('historyCount', {});
    if (result) counts.value = result;
  } catch {
    // RPC not ready
  }
  try {
    const recent = await electroview.rpc?.request('historyList', { limit: 1 });
    if (recent && recent.length > 0) lastOpTime.value = recent[0].created_at;
  } catch {
    // RPC not ready
  }
});

const lastOperation = computed(() => {
  if (!lastOpTime.value) return '—';
  return getRelativeTime(lastOpTime.value);
});

const stats = computed(() => [
  { label: 'Total ops', value: String(counts.value.total) },
  { label: 'Merges', value: String(counts.value.merges) },
  { label: 'Splits', value: String(counts.value.splits) },
  { label: 'Last op', value: lastOperation.value },
]);
</script>

<template>
  <div>
    <div class="text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-3">Usage</div>
    <div class="grid grid-cols-4 gap-3">
      <div
        v-for="stat in stats"
        :key="stat.label"
        class="border border-zinc-200 rounded-lg px-4 py-3"
      >
        <div class="text-[10px] font-mono uppercase tracking-wider text-zinc-400">{{ stat.label }}</div>
        <div class="text-lg font-semibold text-zinc-900 mt-1">{{ stat.value }}</div>
      </div>
    </div>
  </div>
</template>
