<template>
  <div>
    <n-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-placement="top"
      require-mark-placement="right-hanging"
    >
      <n-form-item label="氏名" path="name">
        <n-input v-model:value="form.name" placeholder="例）田中 太郎" clearable />
      </n-form-item>

      <n-form-item label="フリガナ" path="kana">
        <n-input v-model:value="form.kana" placeholder="例）タナカ タロウ" clearable />
      </n-form-item>

      <n-form-item label="メールアドレス" path="email">
        <n-input v-model:value="form.email" placeholder="例）taro@example.com" clearable />
      </n-form-item>

      <n-form-item label="役割" path="role">
        <n-select
          v-model:value="form.role"
          :options="roleOptions"
          placeholder="選択してください"
          clearable
        />
      </n-form-item>

      <n-form-item label="所属拠点" path="branches">
        <n-select
          v-model:value="form.branches"
          multiple
          :options="branchOptions"
          placeholder="選択してください"
          clearable
        />
      </n-form-item>

      <n-space justify="end">
        <n-button ghost @click="goList">キャンセル</n-button>
        <n-button type="primary" :loading="submitting" @click="onSubmit">保存</n-button>
      </n-space>
    </n-form>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NForm, NFormItem, NInput, NSelect, NSpace, NButton, useMessage } from 'naive-ui'
import { supabase } from '@/lib/supabase'

const route = useRoute()
const router = useRouter()
const message = useMessage()

const formRef = ref()
const form = ref({
  id: null,
  name: '',
  kana: '',
  email: '',
  role: '',
  branches: [] as string[]
})
const submitting = ref(false)

const roleOptions = [
  { label: 'スタッフ', value: 'staff' },
  { label: '管理者', value: 'manager' },
  { label: '施設長', value: 'admin' }
]

const branchOptions = ref<any[]>([])

const rules = {
  name: { required: true, message: '氏名は必須です', trigger: 'blur' },
  role: { required: true, message: '役割は必須です', trigger: 'change' }
}

async function fetchBranches () {
  const { data, error } = await supabase.from('branches').select('id, name').order('name')
  if (error) {
    console.error('拠点一覧の取得エラー:', error)
  } else {
    branchOptions.value = (data || []).map((b) => ({ label: b.name, value: b.id }))
  }
}

async function fetchStaff (id: string) {
  const { data, error } = await supabase
    .from('v_staff_with_branches')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) {
    console.error('スタッフ情報の取得エラー:', error)
  } else if (data) {
    form.value = {
      id: data.id,
      name: data.name,
      kana: data.kana,
      email: data.email,
      role: data.role,
      branches: (data.branches_json || []).map((b: any) => b.id)
    }
  }
}

async function onSubmit () {
  submitting.value = true
  try {
    const { id, branches, ...staffData } = form.value

    let upsertRes
    if (id) {
      upsertRes = await supabase.from('staffs').update(staffData).eq('id', id).select('id').single()
    } else {
      upsertRes = await supabase.from('staffs').insert(staffData).select('id').single()
    }

    if (upsertRes.error) throw upsertRes.error
    const staffId = upsertRes.data.id

    // 所属拠点の更新
    await supabase.from('staff_branch_memberships').delete().eq('staff_id', staffId)
    if (branches.length > 0) {
      const memberships = branches.map((branchId: string) => ({ staff_id: staffId, branch_id: branchId }))
      await supabase.from('staff_branch_memberships').insert(memberships)
    }

    // Auth 同期
    const { error: fnErr } = await supabase.functions.invoke('admin-sync-auth', {
      body: { staff_id: staffId }
    })
    if (fnErr) throw fnErr

    message.success('保存しました')
    router.push({ name: 'staff-list' })
  } catch (e: any) {
    console.error('保存エラー:', e)
    message.error('保存に失敗しました')
  } finally {
    submitting.value = false
  }
}

function goList () {
  router.push({ name: 'staff-list' })
}

onMounted(() => {
  fetchBranches()
  if (route.params.id) fetchStaff(route.params.id as string)
})
</script>