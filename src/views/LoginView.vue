<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase, fromCare } from '@/lib/supabase'
import { TABLE } from '@/lib/contracts'
import { useMessage } from 'naive-ui'

import LOGO_CARELOG from '@/assets/LOGO_CARELOG.png'

const isDev = import.meta.env.DEV
const DEV_EMAIL = (import.meta.env.VITE_DEV_EMAIL as string | undefined) ?? ''
const DEV_PASSWORD = (import.meta.env.VITE_DEV_PASSWORD as string | undefined) ?? ''

const email = ref(isDev ? DEV_EMAIL : '')
const password = ref(isDev ? DEV_PASSWORD : '')
const loading = ref(false)
const message = useMessage()
const router = useRouter()

// LoginView.vue 内：routeToRoleTop を差し替え
async function routeToRoleTop() {
  const { data: { user } } = await supabase.auth.getUser()
  const uid = user?.id
  if (!uid) {
    router.replace({ name: 'care-log-list' })
    return
  }

  // ヘルパ
  const go = (name: string, path: string) => {
    if (router.hasRoute(name)) router.replace({ name })
    else router.replace(path)
  }

  // 1) superadmin を最優先で判定（← 引数なし RPC に修正）
  try {
    const { data, error } = await supabase.rpc('fn_is_superadmin')
    if (!error && data === true) {
      go('top-superadmin', '/top/superadmin')
      return
    }
  } catch {
    // noop（失敗しても下の通常ロール判定へ）
  }

  // 2) staffs.role（admin / manager など）
  try {
    const { data: staff } = await fromCare(TABLE.staffs)
      .select('role')
      .eq('auth_user_id', uid)
      .maybeSingle()

    const role = (staff as any)?.role ?? 'manager'
    if (role === 'admin') {
      go('top-admin', '/top/admin')
      return
    }
    // manager or 未設定 → manager 扱い
    go('top-manager', '/top/manager')
    return
  } catch {
    // 3) フォールバック
    go('care-log-list', '/care-log/list')
  }
}

async function login() {
  try {
    loading.value = true
    const { error } = await supabase.auth.signInWithPassword({
      email: email.value,
      password: password.value
    })
    if (error) throw error
    await routeToRoleTop()
  } catch (e: any) {
    console.error(e)
    message.error(e?.message ?? 'ログインに失敗しました')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="max-w-sm mx-auto py-12">
    <n-card>
      <h1 id="logintitle" class="mb-2">
        <img src="@/assets/LOGO_CARELOG.png">
        <span>for ADMIN</span>
      </h1>
      <n-space vertical :size="12">
        <n-input v-model:value="email" placeholder="メールアドレス" type="text" />
        <n-input v-model:value="password" placeholder="パスワード" type="password" />
        <n-button type="primary" :loading="loading" @click="login">ログイン</n-button>

        <div v-if="isDev" class="text-xs text-gray-500">
          開発モード: .env の VITE_DEV_EMAIL / VITE_DEV_PASSWORD を初期値に使用中
        </div>
      </n-space>
    </n-card>
  </div>
</template>