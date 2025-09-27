<!-- src/components/AppHeader.vue -->
<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { NButton } from 'naive-ui'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()

// ユーザ情報はストアから読む
const userEmail = computed(() => auth.session?.user?.email ?? '未ログイン')

// ログアウト処理はストアに任せる
async function onLogout() {
  await auth.logout()   // ← auth.ts 側に logout 実装
  if (router.currentRoute.value.name !== 'login') {
    router.push({ name: 'login' }).catch(() => {})
  }
}
</script>

<template>
  <header class="flex items-center justify-between px-4 py-3 border-b bg-white">
    <div class="flex items-center gap-3">
      <strong class="text-lg">CareLog</strong>
    </div>
    <div class="flex items-center gap-3">
      <span class="text-sm text-gray-500">{{ userEmail }}</span>
      <NButton size="small" @click="onLogout">ログアウト</NButton>
    </div>
  </header>
</template>