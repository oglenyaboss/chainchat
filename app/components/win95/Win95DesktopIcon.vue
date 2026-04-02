<template>
  <div
    class="win95-desktop-icon"
    :class="{ 'win95-desktop-icon--selected': isSelected }"
    @click.stop="handleClick"
    @dblclick.stop="handleDblClick"
  >
    <div class="win95-desktop-icon__img">
      <Win95Icon :name="icon" :size="32" />
    </div>
    <span class="win95-desktop-icon__label">{{ label }}</span>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  icon: string
  label: string
  windowId: string
}>()

const emit = defineEmits<{
  open: [id: string]
}>()

const selectedIcon = inject<Ref<string | null>>('desktopSelectedIcon', ref(null))

const isSelected = computed(() => selectedIcon.value === props.windowId)

function handleClick(): void {
  selectedIcon.value = props.windowId
}

function handleDblClick(): void {
  emit('open', props.windowId)
}
</script>

<style scoped>
.win95-desktop-icon {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  width: 80px;
  padding: 4px;
  cursor: default;
  user-select: none;
}

.win95-desktop-icon__img {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #FFFFFF;
  image-rendering: pixelated;
}

.win95-desktop-icon__label {
  font-family: var(--win95-font-ui);
  font-size: 11px;
  color: #FFFFFF;
  text-align: center;
  text-shadow: 1px 1px 1px rgba(0, 0, 0, 0.8);
  word-break: break-word;
  line-height: 1.2;
  padding: 1px 2px;
}

/* Selected state: blue highlight on text, tinted icon */
.win95-desktop-icon--selected .win95-desktop-icon__label {
  background: var(--win95-selected);
  color: var(--win95-selected-text);
  text-shadow: none;
}

.win95-desktop-icon--selected .win95-desktop-icon__img {
  filter: brightness(0.7) sepia(1) hue-rotate(200deg) saturate(3);
}

/* Hover subtle highlight */
.win95-desktop-icon:hover:not(.win95-desktop-icon--selected) .win95-desktop-icon__label {
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.9), 0 0 4px rgba(255, 255, 255, 0.15);
}
</style>
