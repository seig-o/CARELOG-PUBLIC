<template>
  <div class="p-4">
    <n-card :title="isEdit ? '利用者編集' : '利用者追加'">
      <n-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-placement="top"
        require-mark-placement="right-hanging"
      >
        <n-form-item label="氏名" path="name">
          <n-input v-model:value="form.name" placeholder="例）山田 花子" clearable />
        </n-form-item>

        <n-form-item label="メールアドレス" path="email">
          <n-input v-model:value="form.email" placeholder="example@example.com" clearable />
        </n-form-item>

        <n-form-item label="ロール" path="role">
          <n-select
            v-model:value="form.role"
            :options="roleOptions"
            placeholder="選択してください"
            clearable
          />
        </n-form-item>

        <n-space justify="end">
          <n-button ghost @click="goList">キャンセル</n-button>
          <n-button type="primary" :loading="submitting" @click="save">保存</n-button>
        </n-space>
      </n-form>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'

import { supabase } from '@/lib/supabase'
import { TABLE, ROUTE } from '@/lib/contracts'

const route = useRoute()
const router = useRouter()
const message = useMessage()

const formRef = ref()
const form = ref<any>({
  name: '',
  email: '',
  role: null
})
const submitting = ref(false)

const roleOptions = [
  { label: '利用者', value: 'user' },
  { label: '管理者', value: 'admin' },
]

const rules = {
  name: { required: true, message: '氏名を入力してください', trigger: 'blur' },
  email: { type: 'email', message: 'メールアドレスの形式が不正です', trigger: 'blur' },
}

const isEdit = ref(false)
const id = ref<string | null>(null)

async function load() {
  if (!route.params.id) return
  isEdit.value = true
  id.value = route.params.id as string

  const { data, error } = await supabase
    .from(TABLE.users)
    .select('id, name, email, role')
    .eq('id', id.value)
    .single()
  if (error) {
    message.error(error.message)
    return
  }
  form.value = data
}

async function save() {
  submitting.value = true
  try {
    if (isEdit.value) {
      const { error } = await supabase
        .from(TABLE.users)
        .update({
          name: form.value.name,
          email: form.value.email,
          role: form.value.role
        })
        .eq('id', id.value!)
      if (error) throw error
      message.success('更新しました')
    } else {
      const { error } = await supabase
        .from(TABLE.users)
        .insert([form.value])
      if (error) throw error
      message.success('追加しました')
    }
    router.push({ name: ROUTE.user.list })
  } catch (e: any) {
    message.error(e?.message ?? '保存に失敗しました')
  } finally {
    submitting.value = false
  }
}

function goList() {
  router.push({ name: ROUTE.user.list })
}

onMounted(load)
</script>

<style scoped>
.p-4 { padding: 1rem; }
</style>