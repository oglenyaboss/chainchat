<script setup lang="ts">
defineProps<{
  channels: { id: string, label: string }[]
  activeChannel: string
}>()

defineEmits<{
  select: [channelId: string]
}>()
</script>

<template>
  <div class="channel-list">
    <div
      v-for="channel in channels"
      :key="channel.id"
      class="channel-list__item"
      :class="{ 'channel-list__item--active': channel.id === activeChannel }"
      @click="$emit('select', channel.id)"
    >
      <span class="channel-list__icon">{{ channel.id === 'broadcast' ? '&#128266;' : '&#128274;' }}</span>
      <span class="channel-list__label">{{ channel.label }}</span>
    </div>
  </div>
</template>

<style scoped>
.channel-list__item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 2px 4px;
  font-family: var(--win95-font-ui);
  font-size: 12px;
  cursor: pointer;
}

.channel-list__item:hover {
  background: var(--win95-selected);
  color: var(--win95-selected-text);
}

.channel-list__item--active {
  background: var(--win95-selected);
  color: var(--win95-selected-text);
}

.channel-list__icon {
  font-size: 11px;
  width: 16px;
  text-align: center;
}
</style>
