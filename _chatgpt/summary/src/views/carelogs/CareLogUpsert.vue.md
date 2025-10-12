## src/views/carelogs/CareLogUpsert.vue

```vue
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase, fromCare } from '@/lib/supabase'
import { TABLE } from '@/lib/contracts'
import { ymdStringToMs, msToYmdString } from '@/lib/date'
import { useImeGuard, pushUniqueTag } from '@/lib/utils'
import {
  NCard, NForm, NFormItem, NInput, NButton, NDatePicker,
  NSelect, NSpace, useMessage, NDynamicTags, NInputNumber, NSwitch
} from 'naive-ui'

// 追加の import
import { nextTick, onBeforeUnmount } from 'vue'
import type { InputInst } from 'naive-ui'

// 追記：NInput のインスタンス参照
const tagInputRef = ref<InputInst | null>(null)

// 追記：リスナーを保持して cleanup できるように
let removeTagInputListeners: (() => void) | null = null


type CareLogForm = {
  id?: string
  date: string | null
  user_id: string | null
  staff_id: string | null
  branch_id: string | null
  title: string | null
  content: string | null

  // 拡張フィールド
  summary?: string | null
  details?: string | null

  vitals_bp_systolic?: number | null
  vitals_bp_diastolic?: number | null
  vitals_hr?: number | null
  vitals_temp?: number | null

  meal?: string | null
  medication_given?: boolean
  medication_notes?: string | null
  toileting?: string | null
  mobility?: string | null
  mood?: string | null

  incident_flag?: boolean
  incident_notes?: string | null

  next_actions?: string | null

  // タグ
  tags?: string[]
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
  content: '',

  summary: '',
  details: '',

  vitals_bp_systolic: null,
  vitals_bp_diastolic: null,
  vitals_hr: null,
  vitals_temp: null,

  meal: '',
  medication_given: false,
  medication_notes: '',

  toileting: '',
  mobility: '',
  mood: '',

  incident_flag: false,
  incident_notes: '',

  next_actions: '',

  tags: [] // ★ 初期化
})

const newTag = ref<string>('') // 追加入力欄
// const { onCompStart, onCompEnd, onEnter } = useImeGuard()
const { onCompStart, onCompEnd, onEnter, onBlur } = useImeGuard({ doubleEnterWindowMs: 800 })

function addTag () {
  form.value.tags = pushUniqueTag(form.value.tags ?? [], newTag.value)
  newTag.value = ''
}

// NDatePicker は number(unix ms) を扱うため、共通ユーティリティで相互変換（ローカル基準）
const dateValue = ref<number | null>(null)

// 選択肢
const branchOptions = ref<{ label: string; value: string }[]>([])
const staffOptions  = ref<{ label: string; value: string }[]>([])
const userOptions   = ref<{ label: string; value: string }[]>([])

async function loadOptions () {
  const [branches, staffs, users] = await Promise.all([
    fromCare(TABLE.branches).select('id, name'),
    fromCare(TABLE.staffs).select('id, name').order('id', { ascending: true }),
    fromCare(TABLE.users).select('id, name').order('id', { ascending: true })
  ])
  if (!branches.error) {
    branchOptions.value = (branches.data ?? [])
      .map(b => ({ label: (b as any).name ?? (b as any).id, value: (b as any).id }))
      .sort((a, b) => a.label.localeCompare(b.label, 'ja'))
  }
  if (!staffs.error) {
    staffOptions.value  = (staffs.data ?? [])
      .map(s => ({ label: (s as any).name ?? (s as any).id, value: (s as any).id }))
      .sort((a, b) => a.label.localeCompare(b.label, 'ja'))
  }
  if (!users.error) {
    userOptions.value   = (users.data ?? [])
      .map(u => ({ label: (u as any).name ?? (u as any).id, value: (u as any).id }))
      .sort((a, b) => a.label.localeCompare(b.label, 'ja'))
  }
}

async function loadExisting () {
  if (!isEdit.value) return
  const { data, error } = await fromCare(TABLE.careLogs)
    .select(`
      id, date, user_id, staff_id, branch_id, title, content,
      summary, details,
      vitals_bp_systolic, vitals_bp_diastolic, vitals_hr, vitals_temp,
      meal, medication_given, medication_notes,
      toileting, mobility, mood,
      incident_flag, incident_notes,
      next_actions,
      tags
    `)
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
    content: (data as any).content ?? '',

    summary: (data as any).summary ?? '',
    details: (data as any).details ?? '',

    vitals_bp_systolic:  (data as any).vitals_bp_systolic ?? null,
    vitals_bp_diastolic: (data as any).vitals_bp_diastolic ?? null,
    vitals_hr:           (data as any).vitals_hr ?? null,
    vitals_temp:         (data as any).vitals_temp ?? null,

    meal: (data as any).meal ?? '',
    medication_given: (data as any).medication_given ?? false,
    medication_notes: (data as any).medication_notes ?? '',

    toileting: (data as any).toileting ?? '',
    mobility:  (data as any).mobility ?? '',
    mood:      (data as any).mood ?? '',

    incident_flag:  (data as any).incident_flag ?? false,
    incident_notes: (data as any).incident_notes ?? '',

    next_actions: (data as any).next_actions ?? '',

    tags: Array.isArray((data as any).tags) ? (data as any).tags : []
  }
  dateValue.value = ymdStringToMs(form.value.date)
}

// 認証ユーザーの staff を自動紐付け（存在する場合のみ）
async function setMyStaffIfExists () {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) {
    console.warn('[CareLogUpsert] getUser failed:', error)
    return
  }
  const myAuthUid = user?.id ?? null
  if (!myAuthUid) return

  const { data: s } = await fromCare(TABLE.staffs)
    .select('id, role')
    .eq('auth_user_id', myAuthUid)
    .maybeSingle()
  if (s?.id) {
    form.value.staff_id = s.id as string
  }
}

onMounted(async () => {
  try {
    await loadOptions()
    await setMyStaffIfExists()
    await loadExisting()
  } catch (e: any) {
    message.error(e?.message ?? '初期化に失敗しました')
  } finally {
    // ▼ ここから：内部 input 要素にネイティブでイベントを付与
    await nextTick()
    const el = tagInputRef.value?.inputElRef // ← Naive UI の内部 input要素
    if (el) {
      const handleKeyDown = (evt: KeyboardEvent) => {
        if (evt.key === 'Enter') onEnter(addTag)(evt) // utils のガードを通す
      }
      const handleCompStart = () => onCompStart()
      const handleCompEnd = () => onCompEnd()
      const handleBlur = () => onBlur()

      el.addEventListener('keydown', handleKeyDown)
      el.addEventListener('compositionstart', handleCompStart as any)
      el.addEventListener('compositionend', handleCompEnd as any)
      el.addEventListener('blur', handleBlur as any)

      removeTagInputListeners = () => {
        el.removeEventListener('keydown', handleKeyDown)
        el.removeEventListener('compositionstart', handleCompStart as any)
        el.removeEventListener('compositionend', handleCompEnd as any)
        el.removeEventListener('blur', handleBlur as any)
      }
    }
  }
})

// アンマウント時に後始末
onBeforeUnmount(() => {
  removeTagInputListeners?.()
  removeTagInputListeners = null
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

    // 追加ガード（すり抜け防止）
    if (!form.value.user_id) { message.error('利用者を選択してください'); return }
    if (!form.value.staff_id) { message.error('担当スタッフを選択してください'); return }
    if (!form.value.branch_id) { message.error('拠点を選択してください'); return }

    // Naive UI の NForm でも検証
    await formRef.value?.validate()

    // ▼ tags を送信直前に正規化（IME確定の端数・空白などを除去）
    const normalizedTags: string[] = Array.isArray(form.value.tags)
      ? form.value.tags.map(t => String(t).trim()).filter(Boolean)
      : []

    submitting.value = true
    const payload = {
      date: form.value.date,
      user_id: form.value.user_id,
      staff_id: form.value.staff_id,
      branch_id: form.value.branch_id,
      title: form.value.title,
      content: form.value.content,
      summary: form.value.summary,
      details: form.value.details,

      vitals_bp_systolic:  form.value.vitals_bp_systolic,
      vitals_bp_diastolic: form.value.vitals_bp_diastolic,
      vitals_hr:           form.value.vitals_hr,
      vitals_temp:         form.value.vitals_temp,
      meal:                form.value.meal,
      medication_given:    form.value.medication_given,
      medication_notes:    form.value.medication_notes,
      toileting:           form.value.toileting,
      mobility:            form.value.mobility,
      mood:                form.value.mood,
      incident_flag:       form.value.incident_flag,
      incident_notes:      form.value.incident_notes,
      next_actions:        form.value.next_actions,

      // ★ 正規化済み tags を保存
      tags: normalizedTags
    }

    if (isEdit.value) {
      // ▼ 直後SELECTでDBに入ったtagsを取得して確認
      const { data, error } = await fromCare(TABLE.careLogs)
        .update(payload)
        .eq('id', form.value.id!)
        .select('id, tags')
        .single()

      if (error) throw error
      console.debug('[care_logs updated]', data)
      message.success(`更新しました（tags: ${data?.tags?.length ?? 0}件）`)
    } else {
      const { data, error } = await fromCare(TABLE.careLogs)
        .insert(payload)
        .select('id, tags')
        .single()

      if (error) throw error
      console.debug('[care_logs inserted]', data)
      message.success(`追加しました（tags: ${data?.tags?.length ?? 0}件）`)
    }

    router.push({ name: 'care-log-list' })
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
        <n-button tertiary @click="$router.push({ name: 'care-log-list' })">一覧へ</n-button>
      </div>

      <n-form ref="formRef" :model="form" :rules="rules" label-placement="top" size="large">
        <n-space vertical :size="18">

          <!-- タグ（IME対策付き） -->
          <n-form-item label="タグ" path="tags">
            <n-dynamic-tags
              v-model:value="form.tags"
              :separator="[' ', ',', '　', '、', '，']"
              placeholder="スペース/読点/カンマで確定"
            />
            <div class="mt-2 flex items-center gap-2">
              <n-input
                ref="tagInputRef"
                size="small"
                v-model:value="newTag"
                placeholder="タグを入力（日本語可）"
                class="max-w-[220px]"
              />
              <n-button size="small" @click="addTag">追加</n-button>
            </div>
          </n-form-item>

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

          <n-form-item label="体温 (℃)" path="vitals_temp">
            <n-input-number v-model:value="form.vitals_temp" :precision="1" :step="0.1" min="30" max="45" placeholder="例: 36.8" />
          </n-form-item>

          <n-form-item label="血圧 (収縮期/拡張期 mmHg)" path="vitals_bp">
            <div class="flex gap-2">
              <n-input-number v-model:value="form.vitals_bp_systolic" :min="50" :max="250" placeholder="収縮期" />
              <n-input-number v-model:value="form.vitals_bp_diastolic" :min="30" :max="150" placeholder="拡張期" />
            </div>
          </n-form-item>

          <n-form-item label="心拍数 (bpm)" path="vitals_hr">
            <n-input-number v-model:value="form.vitals_hr" :min="20" :max="220" placeholder="例: 72" />
          </n-form-item>

          <n-form-item label="食事内容" path="meal">
            <n-input
              v-model:value="form.meal"
              type="textarea"
              placeholder="例: 朝食完食、昼食半分残し"
              clearable
            />
          </n-form-item>

          <n-form-item label="投薬" path="medication">
            <div class="flex flex-col gap-2">
              <n-switch v-model:value="form.medication_given">
                <template #checked>実施</template>
                <template #unchecked>なし</template>
              </n-switch>
              <n-input
                v-if="form.medication_given"
                v-model:value="form.medication_notes"
                placeholder="薬名・用量・副作用など"
                type="textarea"
              />
            </div>
          </n-form-item>

          <n-form-item label="排泄状況" path="toileting">
            <n-input
              v-model:value="form.toileting"
              placeholder="例: 便1回、尿4回、失禁なし"
              type="textarea"
            />
          </n-form-item>

          <n-form-item label="移動・ADL" path="mobility">
            <n-input
              v-model:value="form.mobility"
              placeholder="例: 自立歩行、移乗に介助要"
              type="textarea"
            />
          </n-form-item>

          <n-form-item label="機嫌・様子" path="mood">
            <n-input
              v-model:value="form.mood"
              placeholder="例: 機嫌良好、笑顔多い"
              type="textarea"
            />
          </n-form-item>

          <n-form-item label="インシデント（事故・ヒヤリ）" path="incident_flag">
            <div class="flex flex-col gap-2">
              <n-switch v-model:value="form.incident_flag">
                <template #checked>あり</template>
                <template #unchecked>なし</template>
              </n-switch>
              <n-input
                v-if="form.incident_flag"
                v-model:value="form.incident_notes"
                type="textarea"
                placeholder="内容を記載（例：トイレで軽い転倒。打撲なし、見守り強化）"
              />
            </div>
          </n-form-item>

          <div class="flex justify-end gap-2 pt-2">
            <n-button ghost @click="$router.push({ name: 'care-log-list' })">キャンセル</n-button>
            <n-button
              type="primary"
              :loading="submitting"
              :disabled="!form.user_id || !form.staff_id || !form.branch_id || !form.title || !form.content || !dateValue"
              @click="save"
            >
              保存
            </n-button>
          </div>
        </n-space>
      </n-form>
    </n-card>
  </div>
</template>```

