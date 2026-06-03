<script setup lang="ts">
import { ref } from 'vue';

const selectedPages = ref([1, 2, 5]);
const splitMode = ref('selected');
const pageRange = ref('1, 2, 5');
const filenamePattern = ref('research-archive-{n}.pdf');
const totalPages = 24;
const selectedCount = 2;
</script>

<template>
  <div class="flex-1 flex flex-col overflow-hidden">
    <div class="flex-1 overflow-auto">
      <div class="flex items-end justify-between mb-6">
        <div>
          <div class="text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-1">Source file</div>
          <h1 class="text-2xl font-semibold tracking-tight text-zinc-900">research-archive.pdf</h1>
          <p class="text-sm text-zinc-500 mt-1 font-mono">3.2 MB · {{ totalPages }} pages</p>
        </div>
        <button class="text-xs text-zinc-600 hover:text-zinc-900 underline underline-offset-2">Replace file</button>
      </div>
      <div class="flex items-center gap-2 mb-4">
        <span class="text-xs text-zinc-500">Select pages to extract:</span>
        <button class="text-xs text-zinc-600 hover:text-zinc-900 underline underline-offset-2">All</button>
        <span class="text-xs text-zinc-300">·</span>
        <button class="text-xs text-zinc-600 hover:text-zinc-900 underline underline-offset-2">Odd</button>
        <span class="text-xs text-zinc-300">·</span>
        <button class="text-xs text-zinc-600 hover:text-zinc-900 underline underline-offset-2">Even</button>
        <span class="text-xs text-zinc-300">·</span>
        <button class="text-xs text-zinc-600 hover:text-zinc-900 underline underline-offset-2">None</button>
      </div>
      <div class="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-12 gap-2">
        <div
          v-for="i in totalPages"
          :key="i"
          class="aspect-[3/4] rounded-sm flex flex-col items-center justify-center text-xs font-mono relative"
          :class="selectedPages.includes(i) ? 'border-2 border-zinc-900 bg-white text-zinc-900' : 'border border-zinc-200 bg-zinc-50 text-zinc-400'"
        >
          <span>{{ String(i).padStart(2, '0') }}</span>
        </div>
      </div>
      <p class="mt-3 text-xs text-zinc-500 font-mono">Showing first 12 of {{ totalPages }} pages · {{ selectedCount }} selected</p>
    </div>
    <div class="shrink-0 border-t border-zinc-200 bg-white/80 backdrop-blur-md">
      <div class="px-8 py-5">
        <div class="flex items-center justify-between mb-4">
          <div>
            <div class="text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-1">Split settings</div>
            <h2 class="text-base font-semibold tracking-tight text-zinc-900">Configure output</h2>
          </div>
          <div class="text-xs text-zinc-500 font-mono">{{ selectedCount }} files will be created</div>
        </div>
        <div class="mb-4">
          <label class="block text-xs text-zinc-600 mb-2">Split mode</label>
          <div class="grid grid-cols-3 gap-2">
            <label class="flex items-center gap-2 px-3 py-2 border border-zinc-200 rounded-md cursor-pointer hover:bg-zinc-50 has-[:checked]:border-zinc-900 has-[:checked]:bg-zinc-50">
              <input type="radio" v-model="splitMode" value="selected" class="text-black focus:ring-black" />
              <div>
                <div class="text-sm font-medium">Selected pages</div>
                <div class="text-[10px] text-zinc-500">{{ selectedCount }} pages → 1 file</div>
              </div>
            </label>
            <label class="flex items-center gap-2 px-3 py-2 border border-zinc-200 rounded-md cursor-pointer hover:bg-zinc-50 has-[:checked]:border-zinc-900 has-[:checked]:bg-zinc-50">
              <input type="radio" v-model="splitMode" value="range" class="text-black focus:ring-black" />
              <div>
                <div class="text-sm font-medium">By range</div>
                <div class="text-[10px] text-zinc-500">1–5, 6–10, 11–15</div>
              </div>
            </label>
            <label class="flex items-center gap-2 px-3 py-2 border border-zinc-200 rounded-md cursor-pointer hover:bg-zinc-50 has-[:checked]:border-zinc-900 has-[:checked]:bg-zinc-50">
              <input type="radio" v-model="splitMode" value="every" class="text-black focus:ring-black" />
              <div>
                <div class="text-sm font-medium">Every N pages</div>
                <div class="text-[10px] text-zinc-500">Split into chunks</div>
              </div>
            </label>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-3 mb-5">
          <div>
            <label class="block text-xs text-zinc-600 mb-1.5">Page range (comma-separated)</label>
            <input type="text" v-model="pageRange" class="w-full px-3 py-2 text-sm border border-zinc-200 rounded-md font-mono focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-zinc-400" />
          </div>
          <div>
            <label class="block text-xs text-zinc-600 mb-1.5">Filename pattern</label>
            <input type="text" v-model="filenamePattern" class="w-full px-3 py-2 text-sm border border-zinc-200 rounded-md font-mono focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-zinc-400" />
          </div>
        </div>
        <div class="flex items-center justify-end gap-2">
          <button class="px-4 py-2 text-sm border border-zinc-200 rounded-md hover:bg-zinc-50">Cancel</button>
          <button class="px-4 py-2 text-sm bg-black text-white rounded-md hover:bg-zinc-800 flex items-center gap-2">
            Split into 1 file
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M5 12h14M13 5l7 7-7 7"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>