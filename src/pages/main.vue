<script lang="ts" setup>
import { ref, onMounted } from "vue";
import Header from "~/components/layout/Header";
import Footer from "~/components/layout/Footer";

// Thiết lập tiêu đề trang
useHead({
  title: "Trang chính - Law Consultant",
  meta: [
    { name: "description", content: "Trang chính của hệ thống Law Consultant" },
    {
      name: "keywords",
      content: "trang chính, main, law consultant, dashboard",
    },
  ],
});

const username = ref("");
const pass = ref("");

// Lấy username từ localStorage khi component được mount
onMounted(() => {
  username.value = localStorage.getItem("username") || "tên";
  pass.value = localStorage.getItem("pass") || "mk";
});
</script>

<template>
  <Header />
  <h1>Đây là main</h1>
  <h2>{{ username }}</h2>
  <h2>{{ pass }}</h2>
  <Footer />
</template>
