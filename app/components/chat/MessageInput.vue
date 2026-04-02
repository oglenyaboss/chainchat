<script setup lang="ts">
const emit = defineEmits<{
  send: [message: string]
}>()

const text = ref('')

function send() {
  if (text.value.trim()) {
    emit('send', text.value.trim())
    text.value = ''
  }
}
</script>

<template>
  <form class="msg-input" @submit.prevent="send">
    <Win95Input
      v-model="text"
      placeholder="Type a message..."
      class="msg-input__field"
    />
    <Win95Button type="submit" :disabled="!text.trim()">
      Send
    </Win95Button>
  </form>
</template>

<style scoped>
.msg-input {
  display: flex;
  gap: 4px;
  padding: 4px;
  border-top: 2px solid var(--win95-shadow);
}

.msg-input__field {
  flex: 1;
}
</style>
