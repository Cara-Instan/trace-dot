<script setup lang="ts">
import Sidebar from './Sidebar.vue';

</script>

<template>
  <div class="w-full h-screen bg-white border border-zinc-200 shadow-xl overflow-hidden flex flex-col">
    <div class="flex-1 flex overflow-hidden">
      <Sidebar />
      <main class="flex-1 overflow-auto p-8">
        <router-view />
      </main>
    </div>
  </div>
</template>