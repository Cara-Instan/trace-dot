<script setup lang="ts">
import { ref } from 'vue';
import ToggleSwitch from './ToggleSwitch.vue';

const outputFilename = ref('merged-output.pdf');
const savePath = ref('~/Documents/Pinch');
const outputFormat = ref('pdf');
</script>

<template>
  <div class="shrink-0 border-t border-zinc-200 bg-white/80 backdrop-blur-md">
    <div class="px-8 py-5">
      <div class="flex items-center justify-between mb-4">
        <div>
          <div class="text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-1">Step 2 of 2</div>
          <h2 class="text-base font-semibold tracking-tight text-zinc-900">Configure merge</h2>
        </div>
        <div class="text-xs text-zinc-500 font-mono">drag to reorder</div>
      </div>
      <div class="border border-zinc-200 rounded-lg divide-y divide-zinc-200 mb-4 bg-white">
        <div class="flex items-center gap-3 px-3 py-2.5">
          <svg class="grip w-4 h-4 text-zinc-400" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="9" cy="6" r="1.25"/><circle cx="15" cy="6" r="1.25"/><circle cx="9" cy="12" r="1.25"/><circle cx="15" cy="12" r="1.25"/><circle cx="9" cy="18" r="1.25"/><circle cx="15" cy="18" r="1.25"/>
          </svg>
          <div class="flex-1 min-w-0">
            <div class="text-sm truncate text-zinc-900">handbook-2026.pdf</div>
          </div>
          <div class="flex items-center gap-1.5 text-xs text-zinc-500">
            <span>pages</span>
            <input type="text" value="1–12" class="w-16 px-2 py-1 text-xs font-mono border border-zinc-200 rounded-md focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-zinc-400" />
          </div>
          <span class="text-xs text-zinc-500 font-mono w-14 text-right">2.4 MB</span>
          <button class="text-zinc-400 hover:text-zinc-700 p-1" aria-label="Remove">
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <div class="flex items-center gap-3 px-3 py-2.5">
          <svg class="grip w-4 h-4 text-zinc-400" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="9" cy="6" r="1.25"/><circle cx="15" cy="6" r="1.25"/><circle cx="9" cy="12" r="1.25"/><circle cx="15" cy="12" r="1.25"/><circle cx="9" cy="18" r="1.25"/><circle cx="15" cy="18" r="1.25"/>
          </svg>
          <div class="flex-1 min-w-0">
            <div class="text-sm truncate text-zinc-900">q4-financial-report.pdf</div>
          </div>
          <div class="flex items-center gap-1.5 text-xs text-zinc-500">
            <span>pages</span>
            <input type="text" value="1–30" class="w-16 px-2 py-1 text-xs font-mono border border-zinc-200 rounded-md focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-zinc-400" />
          </div>
          <span class="text-xs text-zinc-500 font-mono w-14 text-right">1.8 MB</span>
          <button class="text-zinc-400 hover:text-zinc-700 p-1" aria-label="Remove">
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>
      <div class="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label class="block text-xs text-zinc-600 mb-1.5">Output filename</label>
          <input type="text" v-model="outputFilename" class="w-full px-3 py-2 text-sm border border-zinc-200 rounded-md font-mono focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-zinc-400" />
        </div>
        <div>
          <label class="block text-xs text-zinc-600 mb-1.5">Save to</label>
          <div class="flex">
            <input type="text" v-model="savePath" class="flex-1 px-3 py-2 text-sm border border-zinc-200 rounded-l-md font-mono focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-zinc-400" />
            <button class="px-3 py-2 text-xs border border-l-0 border-zinc-200 rounded-r-md hover:bg-zinc-50">Pick…</button>
          </div>
        </div>
      </div>
      <div class="mb-5">
        <label class="block text-xs text-zinc-600 mb-2">Output format</label>
        <div class="flex gap-2">
          <label class="flex-1 flex items-center gap-2 px-3 py-2 border border-zinc-200 rounded-md cursor-pointer hover:bg-zinc-50 has-[:checked]:border-zinc-900 has-[:checked]:bg-zinc-50">
            <input type="radio" v-model="outputFormat" value="pdf" class="text-black focus:ring-black" />
            <div>
              <div class="text-sm font-medium">PDF</div>
              <div class="text-[10px] text-zinc-500">Standard</div>
            </div>
          </label>
          <label class="flex-1 flex items-center gap-2 px-3 py-2 border border-zinc-200 rounded-md cursor-pointer hover:bg-zinc-50 has-[:checked]:border-zinc-900 has-[:checked]:bg-zinc-50">
            <input type="radio" v-model="outputFormat" value="pdfa" class="text-black focus:ring-black" />
            <div>
              <div class="text-sm font-medium">PDF/A</div>
              <div class="text-[10px] text-zinc-500">Archival</div>
            </div>
          </label>
          <label class="flex-1 flex items-center gap-2 px-3 py-2 border border-zinc-200 rounded-md cursor-pointer hover:bg-zinc-50 has-[:checked]:border-zinc-900 has-[:checked]:bg-zinc-50">
            <input type="radio" v-model="outputFormat" value="image" class="text-black focus:ring-black" />
            <div>
              <div class="text-sm font-medium">Single image</div>
              <div class="text-[10px] text-zinc-500">PNG · 1 file</div>
            </div>
          </label>
        </div>
      </div>
      <div class="flex items-center justify-end gap-2">
        <button class="px-4 py-2 text-sm border border-zinc-200 rounded-md hover:bg-zinc-50">Cancel</button>
        <button class="px-4 py-2 text-sm bg-black text-white rounded-md hover:bg-zinc-800 flex items-center gap-2">
          Merge 2 files
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M5 12h14M13 5l7 7-7 7"/>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>