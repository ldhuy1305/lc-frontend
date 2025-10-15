<template>
  <div class="chat-root">
    <Conversations />
    <main class="chat-main">
      <Chats />
    </main>
  </div>
</template>

<script setup>
definePageMeta({
  middleware: "auth",
});

import Conversations from "~/components/conversations.vue";
import Chats from "~/components/chats.vue";

// Thiết lập tiêu đề trang
useHead({
  title: "Trò chuyện - Law Consultant",
  meta: [
    {
      name: "description",
      content:
        "Trò chuyện với AI Law Consultant - Hỗ trợ tư vấn pháp lý thông minh",
    },
    {
      name: "keywords",
      content: "law consultant, tư vấn pháp lý, AI, trò chuyện, legal advice",
    },
  ],
});
</script>

<style scoped>
.chat-root {
  display: flex;
  height: 100vh;
  background: #f5f6f8;
}
.chat-main {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}
/* chats.vue tự lo phần nội dung */
</style>
