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
        foo.button,
        bar.button
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

<style src="./style.css"></style>

<style scoped src="./style-scoped.css"></style>

<style module src="./style-m.css"></style>

<style module="bar" src="./style-m-bar.css"></style>
