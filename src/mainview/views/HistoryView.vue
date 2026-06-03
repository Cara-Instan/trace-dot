<script setup lang="ts">
import { ref } from 'vue';

const searchQuery = ref('');
const activeFilter = ref('All');

const historyItems = [
  { filename: 'merged-handbook-and-3.pdf', sources: '4 sources', operation: 'Merge', pages: '62', size: '9.4 MB', when: '2 min ago', status: 'done' },
  { filename: 'research-archive-01.pdf', sources: 'From research-archive.pdf', operation: 'Split', pages: '2', size: '410 KB', when: '14 min ago', status: 'done' },
  { filename: 'combined-proposal-v3.pdf', sources: '3 sources', operation: 'Merge', pages: '28', size: '3.1 MB', when: '1 hr ago', status: 'processing' },
  { filename: 'design-spec-pages-1-8.pdf', sources: 'From design-spec.pdf', operation: 'Split', pages: '8', size: '2.8 MB', when: 'Yesterday', status: 'done' },
  { filename: 'encrypted-bundle.pdf', sources: 'Password-protected', operation: 'Merge', pages: '—', size: '—', when: '2 days ago', status: 'failed' },
];

const filters = ['All', 'Merges', 'Splits', 'Failed'];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'done': return 'bg-green-100 text-green-800';
    case 'processing': return 'bg-amber-100 text-amber-800';
    case 'failed': return 'bg-red-100 text-red-800';
    default: return '';
  }
};
</script>

<template>
  <div class="flex flex-col h-full">
    <div class="flex items-end justify-between mb-6">
      <div>
        <div class="text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-1">Activity</div>
        <h1 class="text-2xl font-semibold tracking-tight text-zinc-900">History</h1>
        <p class="text-sm text-zinc-500 mt-1">42 operations · 8 this week</p>
      </div>
      <button class="text-xs text-zinc-600 hover:text-zinc-900 underline underline-offset-2">Clear history</button>
    </div>
    <div class="flex items-center gap-3 mb-4">
      <div class="relative flex-1 max-w-md">
        <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
          <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.3-4.3"/>
        </svg>
        <input type="text" v-model="searchQuery" placeholder="Search by filename…" class="w-full pl-9 pr-3 py-2 text-sm border border-zinc-200 rounded-md focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-zinc-400" />
      </div>
      <div class="flex border border-zinc-200 rounded-md overflow-hidden">
        <button
          v-for="filter in filters"
          :key="filter"
          class="px-3 py-2 text-xs"
          :class="activeFilter === filter ? 'bg-zinc-100 text-zinc-900 font-medium' : 'text-zinc-600 hover:bg-zinc-50'"
          @click="activeFilter = filter"
        >
          {{ filter }}
        </button>
      </div>
    </div>
    <div class="border border-zinc-200 rounded-lg overflow-hidden flex-1">
      <table class="w-full text-sm">
        <thead class="bg-zinc-50 border-b border-zinc-200">
          <tr class="text-left text-[10px] font-mono uppercase tracking-wider text-zinc-500">
            <th class="px-4 py-2.5 font-medium">Filename</th>
            <th class="px-4 py-2.5 font-medium">Operation</th>
            <th class="px-4 py-2.5 font-medium">Pages</th>
            <th class="px-4 py-2.5 font-medium">Size</th>
            <th class="px-4 py-2.5 font-medium">When</th>
            <th class="px-4 py-2.5 font-medium">Status</th>
            <th class="px-4 py-2.5 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-zinc-200">
          <tr v-for="item in historyItems" :key="item.filename" class="hover:bg-zinc-50/50">
            <td class="px-4 py-3">
              <div class="text-sm font-medium text-zinc-900 truncate max-w-[220px]">{{ item.filename }}</div>
              <div class="text-[10px] text-zinc-500 font-mono">{{ item.sources }}</div>
            </td>
            <td class="px-4 py-3 text-zinc-600">{{ item.operation }}</td>
            <td class="px-4 py-3 text-zinc-600 font-mono text-xs">{{ item.pages }}</td>
            <td class="px-4 py-3 text-zinc-600 font-mono text-xs">{{ item.size }}</td>
            <td class="px-4 py-3 text-zinc-500 text-xs">{{ item.when }}</td>
            <td class="px-4 py-3">
              <span
                class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-mono uppercase tracking-wider"
                :class="getStatusColor(item.status)"
              >
                <span class="w-1.5 h-1.5 rounded-full" :class="item.status === 'done' ? 'bg-green-600' : item.status === 'processing' ? 'bg-amber-600' : 'bg-red-600'"></span>
                {{ item.status === 'done' ? 'Done' : item.status === 'processing' ? 'Processing' : 'Failed' }}
              </span>
            </td>
            <td class="px-4 py-3 text-right">
              <button class="text-xs text-zinc-600 hover:text-zinc-900 underline underline-offset-2">
                {{ item.status === 'failed' ? 'Retry' : item.status === 'processing' ? 'View' : 'Open' }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="flex items-center justify-between mt-4 text-xs text-zinc-500">
      <div>Showing 6 of 42</div>
      <div class="flex gap-1">
        <button class="px-2 py-1 border border-zinc-200 rounded hover:bg-zinc-50">Previous</button>
        <button class="px-2 py-1 border border-zinc-200 rounded hover:bg-zinc-50">Next</button>
      </div>
    </div>
  </div>
</template>