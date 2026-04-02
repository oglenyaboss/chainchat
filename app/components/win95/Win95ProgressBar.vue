<template>
  <div class="win95-progress">
    <div class="win95-progress__track">
      <div
        v-for="i in filledSegments"
        :key="i"
        class="win95-progress__segment"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  value: number
  max?: number
}>(), {
  max: 100,
})

const totalSegments = 20

const filledSegments = computed(() => {
  const ratio = Math.min(props.value / props.max, 1)
  return Math.round(ratio * totalSegments)
})
</script>

<style scoped>
.win95-progress {
  height: 20px;
}

.win95-progress__track {
  height: 100%;
  border-top: 2px solid var(--win95-shadow);
  border-left: 2px solid var(--win95-shadow);
  border-right: 2px solid var(--win95-highlight);
  border-bottom: 2px solid var(--win95-highlight);
  display: flex;
  align-items: center;
  padding: 2px;
  gap: 1px;
}

.win95-progress__segment {
  width: calc(100% / 20);
  height: 100%;
  background: var(--win95-selected);
}
</style>
