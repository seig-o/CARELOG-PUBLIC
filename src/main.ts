// src/main.ts
import '@/assets/style.css'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
// if (import.meta.env.DEV) {
//   // @ts-ignore
//   (window as any).router = router
// }
import App from './App.vue'

import { supabase } from '@/lib/supabase'
if (import.meta.env.DEV) {
  // @ts-ignore
  (window as any).supabase = supabase
}
import { useAuthStore } from '@/stores/auth'

// ★ Naive UI: 使うものだけ個別 import → create() でプラグイン化
import {
  create,
  NConfigProvider,
  NDialogProvider,
  NMessageProvider,
  NForm,
  NFormItem,
  NInput,
  NButton,
  NCard,
  NDataTable,
  NTag,
  NSelect,
  NDatePicker,
  // ▼ 追加（エラー解消）
  NSpace,
  // ▼ 予防（AppHeader の n-layout-header を安定化）
  NLayout,
  NLayoutHeader,
  NSpin,
  NDescriptions,
  NDescriptionsItem,
  NEmpty,
  NPopconfirm,
  NInputNumber,
  NSwitch,
  NDynamicTags
} from 'naive-ui'

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
    NCard,
    NDataTable,
    NTag,
    NSelect,
    NDatePicker,
    // ▼ 追加
    NSpace,
    // ▼ 予防
    NLayout,
    NLayoutHeader,
    NSpin,
    NDescriptions,
    NDescriptionsItem,
    NEmpty,
    NPopconfirm,
    NInputNumber,
    NSwitch,
    NDynamicTags
  ]
})

async function bootstrap() {
  const app = createApp(App)
  const pinia = createPinia()
  app.use(pinia)
  app.use(router)
  app.use(naive) // ← ここが重要（providers や各 Naive コンポーネントが解決される）

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
})