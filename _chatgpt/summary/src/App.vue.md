## src/App.vue

```vue
<!-- src/App.vue -->
<template>
  <!-- Naive UI providers（テンプレは kebab-case！） -->
  <n-config-provider :class="routeClass">
    <n-dialog-provider>
      <n-message-provider>
        <!-- ログインページではヘッダー非表示 -->
        <AppHeader v-if="!isLogin" class="app-header" />

        <!-- 画面全体のラッパ：ログイン時は中央寄せ、通常時は余白つきコンテナ -->
        <main :class="isLogin ? 'center' : 'page-container'">
          <router-view />
        </main>
      </n-message-provider>
    </n-dialog-provider>
  </n-config-provider>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'

const route = useRoute()
// /login（名前 or パス）判定。将来 /login/callback 等にも耐性を持たせるなら startsWith を併用
const isLogin = computed(() => route.name === 'login' || String(route.path).startsWith('/login'))

// route.name をベースにした class を返す
const routeClass = computed(() => {
  if (!route.name) return ''
  return `page-${route.name}`
})
</script>

<style scoped>
/* 全ページ共通の背景＆最小高さ */
.app-root {
  min-height: 100vh;
  background: #f7f7f8; /* 薄いグレーで窮屈感を軽減 */
}

/* 通常ページ用のコンテナ：中央寄せ & 余白 */
.page-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
}

/* ログインページ用：カード等を中央に置きやすいキャンバス */
.center {
  min-height: 100vh;           /* ヘッダー非表示なので全高でOK */
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;               /* スマホでの端詰まり防止 */
}
</style>```

