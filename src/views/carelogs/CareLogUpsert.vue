<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fromCare } from '@/lib/supabase'
import { TABLE } from '@/lib/contracts'
import {
  NCard, NForm, NFormItem, NInput, NInputNumber, NButton, NDatePicker,
  NSelect, NSpace, NAlert, useMessage
} from 'naive-ui'

type CareLogForm = {
  id?: string
  date: string | null
  user_id: string | null
  staff_id: string | null
  branch_id: string | null
  title: string | null
  content: string | null
}

const route = useRoute()
const router = useRouter()
const message = useMessage()

const id = route.params.id as string | undefined
const isEdit = computed(() => !!id)

const formRef = ref()
const submitting = ref(false)
const form = ref<CareLogForm>({
  date: null,
  user_id: null,
  staff_id: null,
  branch_id: null,
  title: '',
  content: ''
})

// NDatePicker は number(unix ms) を扱うため、string(YYYY-MM-DD) と相互変換
const dateValue = ref<number | null>(null)
function ymdStringToMs (ymd: string | null): number | null {
  if (!ymd) return null
  const ms = Date.parse(ymd + 'T00:00:00Z')
  return Number.isFinite(ms) ? ms : null
}
function msToYmdString (ms: number | null): string | null {
  if (!ms) return null
  const d = new Date(ms)
  const yyyy = d.getUTCFullYear()
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(d.getUTCDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

// 選択肢
const branchOptions = ref<{ label: string; value: string }[]>([])
const staffOptions  = ref<{ label: string; value: string }[]>([])
const userOptions   = ref<{ label: string; value: string }[]>([])

async function loadOptions () {
  const [branches, staffs, users] = await Promise.all([
    fromCare(TABLE.branches).select('id, name').order('name', { ascending: true }),
    fromCare(TABLE.staffs).select('id, name').order('id', { ascending: true }),
    fromCare(TABLE.users).select('id, name').order('id', { ascending: true })
  ])
  if (!branches.error) branchOptions.value = (branches.data ?? []).map(b => ({ label: (b as any).name, value: (b as any).id }))
  if (!staffs.error)   staffOptions.value  = (staffs.data ?? []).map(s => ({ label: (s as any).name ?? (s as any).id, value: (s as any).id }))
  if (!users.error)    userOptions.value   = (users.data ?? []).map(u => ({ label: (u as any).name ?? (u as any).id, value: (u as any).id }))
}

async function loadExisting () {
  if (!isEdit.value) return
  const { data, error } = await fromCare(TABLE.careLogs)
    .select('id, date, user_id, staff_id, branch_id, title, content')
    .eq('id', id!)
    .single()
  if (error) throw error
  form.value = {
    id: data!.id as string,
    date: (data as any).date ?? null,
    user_id: (data as any).user_id ?? null,
    staff_id: (data as any).staff_id ?? null,
    branch_id: (data as any).branch_id ?? null,
    title: (data as any).title ?? '',
    content: (data as any).content ?? ''
  }
  dateValue.value = ymdStringToMs(form.value.date)
}

onMounted(async () => {
  try {
    await loadOptions()
    await loadExisting()
  } catch (e: any) {
    message.error(e?.message ?? '初期化に失敗しました')
  }
})

const rules = {
  date: { required: true, type: 'string', message: '日付は必須です', trigger: ['blur', 'change'] },
  user_id: { required: true, message: '利用者は必須です', trigger: ['blur', 'change'] },
  staff_id: { required: true, message: '担当は必須です', trigger: ['blur', 'change'] },
  branch_id: { required: true, message: '拠点は必須です', trigger: ['blur', 'change'] },
  title: { required: true, message: 'タイトルは必須です', trigger: ['blur', 'input'] },
  content: { required: true, message: '本文は必須です', trigger: ['blur', 'input'] }
}

async function save () {
  try {
    // dateValue(number) → form.date(YYYY-MM-DD)
    form.value.date = msToYmdString(dateValue.value)

    // Naive UI の NForm を通すため、model は form.value のまま検証
    await formRef.value?.validate()

    submitting.value = true
    const payload = {
      date: form.value.date,
      user_id: form.value.user_id,
      staff_id: form.value.staff_id,
      branch_id: form.value.branch_id,
      title: form.value.title,
      content: form.value.content
    }

    if (isEdit.value) {
      const { error } = await fromCare(TABLE.careLogs)
        .update(payload)
        .eq('id', form.value.id!)
      if (error) throw error
      message.success('更新しました')
    } else {
      const { error } = await fromCare(TABLE.careLogs).insert(payload)
      if (error) throw error
      message.success('追加しました')
    }

    router.push({ name: 'carelog-list' })
  } catch (e: any) {
    console.error(e)
    message.error(e?.message ?? '保存に失敗しました')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="max-w-3xl">
    <n-card>
      <div class="flex items-center justify-between mb-2">
        <h1 class="text-lg font-semibold">ケアログ{{ isEdit ? '編集' : '新規作成' }}</h1>
        <n-button tertiary @click="$router.push({ name: 'carelog-list' })">一覧へ</n-button>
      </div>

      <n-form ref="formRef" :model="form" :rules="rules" label-placement="top" size="large">
        <n-space vertical :size="18">
          <n-form-item label="日付" path="date">
            <n-date-picker
              v-model:value="dateValue"
              type="date"
              clearable
              style="width: 220px"
              @update:value="(v:number|null)=>{ dateValue=v; form.date = msToYmdString(v) }"
            />
          </n-form-item>

          <n-form-item label="利用者" path="user_id">
            <n-select
              v-model:value="form.user_id"
              :options="userOptions"
              filterable
              clearable
              placeholder="利用者を選択"
              style="max-width: 360px"
            />
          </n-form-item>

          <n-form-item label="担当" path="staff_id">
            <n-select
              v-model:value="form.staff_id"
              :options="staffOptions"
              filterable
              clearable
              placeholder="担当を選択"
              style="max-width: 360px"
            />
          </n-form-item>

          <n-form-item label="拠点" path="branch_id">
            <n-select
              v-model:value="form.branch_id"
              :options="branchOptions"
              filterable
              clearable
              placeholder="拠点を選択"
              style="max-width: 360px"
            />
          </n-form-item>

          <n-form-item label="タイトル" path="title">
            <n-input
              v-model:value="form.title"
              placeholder="短い見出し"
              clearable
              maxlength="120"
              show-count
            />
          </n-form-item>

          <n-form-item label="本文" path="content">
            <n-input
              v-model:value="form.content"
              type="textarea"
              placeholder="本文を入力"
              :autosize="{ minRows: 6, maxRows: 18 }"
            />
          </n-form-item>

          <div class="flex justify-end gap-2 pt-2">
            <n-button ghost @click="$router.push({ name: 'carelog-list' })">キャンセル</n-button>
            <n-button type="primary" :loading="submitting" @click="save">保存</n-button>
          </div>
        </n-space>
      </n-form>
    </n-card>
  </div>
</template>