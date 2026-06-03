<script setup lang="ts">
defineEmits<{
  (e: 'drop', files: FileList): void;
}>();
</script>

<template>
  <div class="dropzone border-2 border-dashed border-zinc-300 rounded-lg p-16 text-center hover:border-zinc-400 hover:bg-zinc-50/50">
    <div class="w-12 h-12 mx-auto mb-4 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-500">
      <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
        <path d="M12 3v12M7 8l5-5 5 5M5 21h14" />
      </svg>
    </div>
    <div class="text-sm font-medium text-zinc-900">Drag & drop PDFs here</div>
    <div class="text-xs text-zinc-500 mt-1">or <button class="text-zinc-900 underline underline-offset-2 hover:text-black">browse files</button> · multi-select supported</div>
  </div>
</template>