## src/main.ts

```ts
// src/main.ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'

import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'

// ★ Naive UI: 使うものだけ個別 import → create() でプラグイン化
import { create, NConfigProvider, NDialogProvider, NMessageProvider,
  NForm, NFormItem, NInput, NButton, NCard } from 'naive-ui'

// 必要なコンポーネントだけ登録（足りなければ随時追加）
const naive = create({
  components: [
    NConfigProvider,
    NDialogProvider,
    NMessageProvider,
    NForm,
    NFormItem,
    NInput,
    NButton,
    NCard
  ]
})

async function bootstrap() {
  const app = createApp(App)
  const pinia = createPinia()
  app.use(pinia)
  app.use(router)
  app.use(naive) // ← ここが重要（providers や NInput/NButton などが解決される）

  // --- Auth 初期化（v2 仕様）--------------------------
  const auth = useAuthStore()

  // セッション取得 → store 反映
  {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) console.error('[init auth] getSession error:', error)
    auth.setSession(session ?? null)
  }

  // 変化監視
  supabase.auth.onAuthStateChange((event, session) => {
    auth.setSession(session ?? null)
    if (event === 'SIGNED_OUT' && router.currentRoute.value.name !== 'login') {
      router.push({ name: 'login' }).catch(() => {})
    }
  })
  // ----------------------------------------------------

  await router.isReady()
  app.mount('#app')
}

bootstrap().catch((e) => {
  console.error('[bootstrap] unhandled error:', e)
})```

