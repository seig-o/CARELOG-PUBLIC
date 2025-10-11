## src/views/branches/BranchUpsert.vue

```vue
<template>
  <div class="p-4">
    <n-card :title="isEdit ? '拠点を編集' : '拠点を追加'">
      <!-- 編集時だけ読み取りメタを表示 -->
      <template v-if="isEdit && meta">
        <n-descriptions bordered label-placement="left" :column="2" class="mb-4">
          <n-descriptions-item label="ID">
            <code>{{ meta.id }}</code>
          </n-descriptions-item>
          <n-descriptions-item label="会社ID">
            <code v-if="form.company_id">{{ form.company_id }}</code>
            <span v-else>—</span>
          </n-descriptions-item>
          <n-descriptions-item label="作成日時">
            {{ formatTs(meta.created_at) }}
          </n-descriptions-item>
          <n-descriptions-item label="更新日時">
            {{ formatTs(meta.updated_at) }}
          </n-descriptions-item>
        </n-descriptions>
      </template>

      <n-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-placement="top"
        require-mark-placement="right-hanging"
        size="large"
      >
        <n-form-item label="拠点名" path="name">
          <n-input v-model:value="form.name" placeholder="例）カモミールハウス松本" clearable />
        </n-form-item>

        <n-form-item label="会社ID（任意）" path="company_id">
          <n-input v-model:value="form.company_id" placeholder="会社を区別する UUID 等（未設定可）" clearable />
        </n-form-item>

        <n-form-item label="状態" path="status">
          <n-select v-model:value="form.status" :options="statusOptions" placeholder="選択してください" clearable />
        </n-form-item>

        <n-form-item label="電話番号" path="phone">
          <n-input v-model:value="form.phone" placeholder="例）0263-xx-xxxx" clearable />
        </n-form-item>

        <n-form-item label="住所" path="address">
          <n-input v-model:value="form.address" placeholder="例）長野県松本市〜" clearable />
        </n-form-item>

        <n-form-item label="メモ" path="note">
          <n-input
            v-model:value="form.note"
            type="textarea"
            placeholder="備考やメモを入力"
            clearable
            :autosize="{ minRows: 3 }"
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
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import { supabase } from '@/lib/supabase'
import { TABLE, ROUTE } from '@/lib/contracts'

type BranchForm = {
  id?: string
  name: string
  company_id: string | null
  status: string | null
  phone: string | null
  address: string | null
  note: string | null
}

type BranchMeta = {
  id: string
  created_at: string | null
  updated_at: string | null
}

const route = useRoute()
const router = useRouter()
const message = useMessage()

const formRef = ref()
const submitting = ref(false)
const isEdit = computed(() => !!route.params.id)

const form = ref<BranchForm>({
  name: '',
  company_id: null,
  status: 'active',
  phone: null,
  address: null,
  note: null
})

const meta = ref<BranchMeta | null>(null)

const statusOptions = [
  { label: 'active（有効）', value: 'active' },
  { label: 'inactive（一時停止）', value: 'inactive' },
  { label: 'disabled（無効化）', value: 'disabled' }
]

const rules = {
  name: { required: true, message: '拠点名は必須です', trigger: ['blur', 'input'] },
  status: { required: true, message: '状態を選択してください', trigger: ['change', 'blur'] }
}

function formatTs(iso?: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

async function fetchBranch(id: string) {
  const { data, error } = await supabase
    .from(TABLE.branches)
    .select('id,name,company_id,status,phone,address,note,created_at,updated_at')
    .eq('id', id)
    .maybeSingle()

  if (error) {
    console.error('[BranchUpsert] fetch error:', error)
    message.error(error.message ?? '拠点の取得に失敗しました')
    return
  }
  if (!data) {
    message.warning('拠点が見つかりませんでした')
    return
  }

  form.value = {
    id: data.id,
    name: data.name ?? '',
    company_id: data.company_id ?? null,
    status: data.status ?? 'active',
    phone: data.phone ?? null,
    address: data.address ?? null,
    note: data.note ?? null
  }
  meta.value = {
    id: data.id,
    created_at: data.created_at ?? null,
    updated_at: data.updated_at ?? null
  }
}

async function save() {
  try {
    await formRef.value?.validate()
    submitting.value = true

    const payload = {
      name: form.value.name,
      company_id: form.value.company_id,
      status: form.value.status,
      phone: form.value.phone,
      address: form.value.address,
      note: form.value.note
    }

    if (isEdit.value && form.value.id) {
      const { error } = await supabase.from(TABLE.branches).update(payload).eq('id', form.value.id)
      if (error) throw error
      message.success('更新しました')
    } else {
      const { error } = await supabase.from(TABLE.branches).insert(payload)
      if (error) throw error
      message.success('追加しました')
    }

    goList()
  } catch (e: any) {
    console.error('[BranchUpsert] save error:', e)
    message.error(e?.message ?? '保存に失敗しました')
  } finally {
    submitting.value = false
  }
}

function goList() {
  router.push({ name: ROUTE.branches.name.list })
}

onMounted(() => {
  if (isEdit.value && typeof route.params.id === 'string') {
    fetchBranch(route.params.id)
  }
})
</script>

<style scoped>
.p-4 {
  padding: 1rem;
}
.mb-4 {
  margin-bottom: 1rem;
}
</style>```

