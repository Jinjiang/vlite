<script setup lang="ts">
import { ref } from 'vue'
import logo from './logo.svg'
const count = ref(0)
</script>

<template>
  <div>
    <img alt="Vue logo" :src="logo" />
    <button
      @click="count++"
      :class="[
        $style.button,
        foo.button
      ]"
    >
      count is: {{ count }}
    </button>
  </div>
</template>

<style>
button {
  color: red;
}
</style>

<style scoped>
button {
  color: blue;
}
</style>

<style module>
.button {
  color: green;
}
</style>

<style module="foo">
.button {
  color: yellow;
}
</style>
