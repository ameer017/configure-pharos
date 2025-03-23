<script setup>
import { RouterLink, RouterView } from 'vue-router'
import HelloWorld from './components/HelloWorld.vue'
</script>

<template>
  <div class="container">
    <h1>🚀 Welcome to Your Vue.js App</h1>
    <p>This is a simple UI styled with Vanilla CSS.</p>
  </div>
</template>

<style scoped>
.container {
  text-align: center;
  padding: 50px;
  font-family: Arial, sans-serif;
  min-height: 87vh;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
}

h1 {
  color: #007bff;
}

p {
  font-size: 1.2em;
  color: #333;
}
</style>