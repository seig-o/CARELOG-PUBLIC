## src/views/LoginView.vue

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMessage, NForm, NFormItem, NInput, NButton, NCard } from 'naive-ui'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const message = useMessage()
const auth = useAuthStore()

const email = ref('manager@boiler.xsrv.jp')
const password = ref('ui9JkDkMbfQBzl6F39Jb')
const loading = ref(false)
const showPassword = ref(false)

const redirect = (route.query.redirect as string) || '/'

onMounted(async () => {
  const { data: { session } } = await supabase.auth.getSession()
  if (session) {
    await auth.setSession(session).catch(() => {})
    router.replace(redirect).catch(() => {})
  }
})

async function onSubmit() {
  if (!email.value || !password.value) {
    message.warning('メールアドレスとパスワードを入力してください')
    return
  }

  loading.value = true
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.value.trim(),
      password: password.value,
    })
    if (error) throw error

    await auth.setSession(data.session ?? null).catch(() => {})

    message.success('サインインしました')
    router.replace(redirect).catch(() => {})
  } catch (e: any) {
    console.error('[login] signInWithPassword error:', e)
    message.error(e?.message ?? 'サインインに失敗しました')
  } finally {
    loading.value = false
  }
}
</script>

<!-- src/views/LoginView.vue -->
<template>
  <div id="logindialog">
    <n-card style="width: 360px" title="CareLog ログイン" size="medium" bordered>
      <n-form @submit.prevent="onSubmit" label-placement="top">
        <n-form-item label="メールアドレス">
          <n-input v-model:value="email" placeholder="you@example.com" :input-props="{ autocomplete: 'username' }" />
        </n-form-item>
        <n-form-item label="パスワード">
          <n-input v-model:value="password" :type="showPassword ? 'text' : 'password'" placeholder="********"
                   :input-props="{ autocomplete: 'current-password' }">
            <template #suffix>
              <n-button text @click="showPassword = !showPassword">{{ showPassword ? '隠す' : '表示' }}</n-button>
            </template>
          </n-input>
        </n-form-item>
        <n-button type="primary" :loading="loading" block class="mt-2" @click="onSubmit">サインイン</n-button>
      </n-form>
    </n-card>
  </div>
</template>

<style scoped>
#logindialog {
  display: flex;
  justify-content: center;
  align-items: start;
  height: 100vh;
  background-color: #f0f2f5;
}
#logindialog > * {
  position: relative;
  top: 15vh;
}
</style>
```

