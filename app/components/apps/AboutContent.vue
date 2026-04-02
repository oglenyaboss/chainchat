<script setup lang="ts">
import { useWindowManagerStore } from '~/stores/window-manager'

const wmStore = useWindowManagerStore()

function close(): void {
  wmStore.closeWindow('about')
}
</script>

<template>
  <div class="about">
    <div class="about__body">
      <div class="about__icon">
        &#9939;
      </div>
      <div class="about__text">
        <p class="about__title">
          ChainChat v1.0
        </p>
        <p>Decentralized P2P Blockchain Messenger</p>
        <p class="about__detail">
          Every message is a transaction.
        </p>
        <p class="about__detail">
          Every browser mines blocks.
        </p>
        <p class="about__detail">
          Zero servers. Pure P2P.
        </p>
        <Win95Divider />
        <p class="about__detail">
          WebRTC Mesh &bull; AES-256 &bull; Proof of Work
        </p>
      </div>
    </div>
    <div class="about__footer">
      <Win95Button variant="primary" @click="close">
        OK
      </Win95Button>
    </div>
  </div>
</template>

<style scoped>
.about__body {
  display: flex;
  gap: 12px;
  padding: 12px;
}

.about__icon {
  font-size: 40px;
  flex-shrink: 0;
}

.about__text {
  font-family: var(--win95-font-ui);
  font-size: 12px;
  line-height: 1.6;
}

.about__title {
  font-weight: 700;
  font-size: 14px;
  margin-bottom: 4px;
}

.about__detail {
  color: var(--win95-dark-shadow);
}

.about__footer {
  display: flex;
  justify-content: center;
  padding: 8px 12px 12px;
}
</style>
