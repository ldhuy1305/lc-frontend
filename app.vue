<script lang="ts" setup>
import Header from '~/components/layout/Header'
import Footer from '~/components/layout/Footer'
</script>


<!-- app.vue trong Nuxt -->
<template>
  <Header />
  <v-app>
      <NuxtPage />
    </v-app>
  <Footer />
</template>

<style>
/* CSS đã được xử lý trong global.css */
</style>


