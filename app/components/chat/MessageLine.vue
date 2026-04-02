<script setup lang="ts">
import type { ChatMessage } from '~/stores/chat'

defineProps<{
  message: ChatMessage
  isOwn: boolean
}>()

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <div class="msg-line" :class="{ 'msg-line--own': isOwn, 'msg-line--system': message.fromNickname === 'SYSTEM' }">
    <span class="msg-line__time">{{ formatTime(message.timestamp) }}</span>
    <span class="msg-line__nick" :class="{ 'msg-line__nick--own': isOwn }">&lt;{{ message.fromNickname }}&gt;</span>
    <span class="msg-line__text">{{ message.content }}</span>
    <span v-if="message.blockIndex !== null" class="msg-line__confirmed" title="Confirmed in block">[&#10003;#{{ message.blockIndex }}]</span>
    <span v-else class="msg-line__pending" title="Pending">[...]</span>
  </div>
</template>

<style scoped>
.msg-line {
  font-family: var(--win95-font-mono);
  font-size: 11px;
  line-height: 1.5;
  padding: 0 4px;
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.msg-line__time {
  color: var(--win95-shadow);
}

.msg-line__nick {
  color: var(--win95-selected);
  font-weight: 700;
}

.msg-line__nick--own {
  color: var(--win95-danger);
}

.msg-line__text {
  color: var(--win95-text);
  word-break: break-word;
}

.msg-line__confirmed {
  color: var(--win95-success);
  font-size: 10px;
}

.msg-line__pending {
  color: var(--win95-shadow);
  font-size: 10px;
}

.msg-line--system {
  font-style: italic;
}

.msg-line--system .msg-line__nick {
  color: var(--win95-shadow);
}
</style>
