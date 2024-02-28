<script setup lang="ts">
import { ref } from 'vue'
const count = ref(0)
</script>

<template>
  <button
    @click="count++"
    :class="[
      $style.button,
      foo.button
    ]"
  >
    count is: {{ count }}
  </button>
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
