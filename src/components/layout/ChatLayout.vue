<template>
  <div class="chat-layout">
    <Sidebar />
    <ChatView />
  </div>
</template>

<script setup lang="ts">
import Sidebar from "~/components/ui/ChatSidebar.vue";
import ChatView from "~/components/ui/ChatView.vue";
</script>

<style scoped>
.chat-layout {
  display: flex;
  height: 100vh;
}
.main-chat {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}
</style>
