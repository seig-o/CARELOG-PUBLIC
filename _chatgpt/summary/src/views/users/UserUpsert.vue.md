## src/views/users/UserUpsert.vue

```vue
<script setup lang="ts">
import { ref, computed, onMounted, nextTick, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fromCare } from '@/lib/supabase'
import { TABLE } from '@/lib/contracts'
import { useImeGuard, pushUniqueTag } from '@/lib/utils'
import { useMessage } from 'naive-ui'
import type { InputInst } from 'naive-ui'

type UserForm = {
  id?: string
  name: string
  kana?: string | null
  birthdate?: string | null
  sex?: string | null
  phone?: string | null
  address?: string | null
  emergency_contact_name?: string | null
  emergency_contact_relation?: string | null
  emergency_contact_phone?: string | null
  allergies?: string[]
  diagnoses?: string[]
  medications?: string | null
  care_level?: string | null
  care_insurance_id?: string | null
  physician_name?: string | null
  physician_clinic?: string | null
  physician_phone?: string | null
  diet?: string | null
  swallowing_caution?: string | null
  fall_risk?: boolean | null
  dementia_stage?: string | null
  mobility?: string | null
  adl_notes?: string | null
  preferences?: string | null
  communication_notes?: string | null
  photo_url?: string | null
}

const route = useRoute()
const router = useRouter()
const message = useMessage()
const id = route.params.id as string | undefined
const isEdit = computed(() => !!id)

const formRef = ref()
const submitting = ref(false)
const form = ref<UserForm>({
  name: '',
  kana: '',
  birthdate: '',
  sex: '',
  phone: '',
  address: '',
  emergency_contact_name: '',
  emergency_contact_relation: '',
  emergency_contact_phone: '',
  allergies: [],
  diagnoses: [],
  medications: '',
  care_level: '',
  care_insurance_id: '',
  physician_name: '',
  physician_clinic: '',
  physician_phone: '',
  diet: '',
  swallowing_caution: '',
  fall_risk: null,
  dementia_stage: '',
  mobility: '',
  adl_notes: '',
  preferences: '',
  communication_notes: '',
  photo_url: ''
})

/** ▼ 所属拠点（複数選択） */
const branchOptions = ref<{ label: string; value: string }[]>([])
const selectedBranchIds = ref<string[]>([])
let originalBranchIds: string[] = []

async function loadBranchOptions () {
  const { data, error } = await fromCare(TABLE.branches)
    .select('id, name')
    .order('name', { ascending: true })
  if (error) {
    console.warn('[UserUpsert] loadBranchOptions error:', error)
    return
  }
  branchOptions.value = (data ?? []).map((b: any) => ({
    label: b?.name ?? b?.id,
    value: b?.id
  }))
}

const sexOptions = [
  { label: '男性', value: 'male' },
  { label: '女性', value: 'female' },
  { label: 'その他', value: 'other' },
  { label: '不明', value: 'unknown' }
]
const dietOptions = [
  { label: '常食', value: 'normal' },
  { label: '軟菜', value: 'soft' },
  { label: 'きざみ', value: 'minced' },
  { label: 'ミキサー', value: 'pureed' }
]

const rules = {
  name: { required: true, message: '氏名は必須です', trigger: ['blur', 'input'] }
}

/** ▼ タグ入力（IME二度押しガード） */
const newAllergyTag   = ref<string>('')
const newDiagnosisTag = ref<string>('')
const { onCompStart, onCompEnd, onEnter, onBlur } = useImeGuard({ doubleEnterWindowMs: 800 })
const allergyInputRef   = ref<InputInst | null>(null)
const diagnosisInputRef = ref<InputInst | null>(null)
function addAllergy() {
  form.value.allergies = pushUniqueTag(form.value.allergies, newAllergyTag.value)
  newAllergyTag.value = ''
}
function addDiagnosis() {
  form.value.diagnoses = pushUniqueTag(form.value.diagnoses, newDiagnosisTag.value)
  newDiagnosisTag.value = ''
}
let removeAllergyListeners: (() => void) | null = null
let removeDiagnosisListeners: (() => void) | null = null

onMounted(async () => {
  await loadBranchOptions()
  await loadExisting()

  // ネイティブイベントを直接バインド（Enter二度押し）
  await nextTick()
  const bind = (inst: InputInst | null, addFn: () => void) => {
    const el = inst?.inputElRef
    if (!el) return () => {}
    const handleKeyDown  = (evt: KeyboardEvent) => { if (evt.key === 'Enter') onEnter(addFn)(evt) }
    const handleCompStart = () => onCompStart()
    const handleCompEnd   = () => onCompEnd()
    const handleBlur_     = () => onBlur()
    el.addEventListener('keydown', handleKeyDown)
    el.addEventListener('compositionstart', handleCompStart as any)
    el.addEventListener('compositionend', handleCompEnd as any)
    el.addEventListener('blur', handleBlur_ as any)
    return () => {
      el.removeEventListener('keydown', handleKeyDown)
      el.removeEventListener('compositionstart', handleCompStart as any)
      el.removeEventListener('compositionend', handleCompEnd as any)
      el.removeEventListener('blur', handleBlur_ as any)
    }
  }
  removeAllergyListeners   = bind(allergyInputRef.value,   addAllergy)
  removeDiagnosisListeners = bind(diagnosisInputRef.value, addDiagnosis)
})

onBeforeUnmount(() => {
  removeAllergyListeners?.()
  removeDiagnosisListeners?.()
  removeAllergyListeners = removeDiagnosisListeners = null
})

/** ▼ 既存値の読込（所属拠点も） */
async function loadExisting () {
  if (!isEdit.value) return
  const { data, error } = await fromCare(TABLE.users)
    .select(`
      id, name, kana, birthdate, sex,
      phone, address,
      emergency_contact_name, emergency_contact_relation, emergency_contact_phone,
      allergies, diagnoses, medications,
      care_level, care_insurance_id,
      physician_name, physician_clinic, physician_phone,
      diet, swallowing_caution,
      fall_risk, dementia_stage,
      mobility, adl_notes,
      preferences, communication_notes,
      photo_url
    `)
    .eq('id', id!)
    .single()
  if (error) throw error

  form.value = {
    ...(data as any),
    allergies: Array.isArray((data as any).allergies) ? (data as any).allergies : [],
    diagnoses: Array.isArray((data as any).diagnoses) ? (data as any).diagnoses : []
  }

  // 所属拠点の取得
  const { data: memb, error: mErr } = await fromCare(TABLE.userBranchMemberships)
    .select('branch_id')
    .eq('user_id', id!)
  if (!mErr) {
    originalBranchIds = (memb ?? []).map((m: any) => m.branch_id)
    selectedBranchIds.value = originalBranchIds.slice()
  }
}

/** ▼ 所属拠点の差分保存 */
async function saveMembershipDiff(userId: string, nextBranchIds: string[]) {
  const prev = new Set(originalBranchIds)
  const next = new Set(nextBranchIds)

  const toAdd: string[] = []
  const toRemove: string[] = []

  next.forEach(bid => { if (!prev.has(bid)) toAdd.push(bid) })
  prev.forEach(bid => { if (!next.has(bid)) toRemove.push(bid) })

  if (toAdd.length > 0) {
    const rows = toAdd.map(bid => ({ user_id: userId, branch_id: bid }))
    const { error } = await fromCare(TABLE.userBranchMemberships).insert(rows)
    if (error) throw error
  }
  if (toRemove.length > 0) {
    const { error } = await fromCare(TABLE.userBranchMemberships)
      .delete()
      .eq('user_id', userId)
      .in('branch_id', toRemove)
    if (error) throw error
  }

  // 保存後、基準を更新
  originalBranchIds = nextBranchIds.slice()
}

async function save () {
  try {
    await formRef.value?.validate()
    submitting.value = true

    // 1) users 本体
    if (isEdit.value) {
      const { error } = await fromCare(TABLE.users).update({ ...form.value }).eq('id', form.value.id!)
      if (error) throw error

      // 2) 所属拠点の差分
      await saveMembershipDiff(form.value.id!, selectedBranchIds.value)

      message.success('更新しました')
    } else {
      // 新規 → ID を返してもらって memberships を作る
      const { data, error } = await fromCare(TABLE.users)
        .insert({ ...form.value })
        .select('id')
        .single()
      if (error) throw error
      const newId = (data as any)?.id as string
      if (newId) {
        await saveMembershipDiff(newId, selectedBranchIds.value)
      }
      message.success('追加しました')
    }

    router.push({ name: 'user-list' })
  } catch (e: any) {
    console.error(e)
    message.error(e?.message ?? '保存に失敗しました')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="max-w-4xl">
    <n-card>
      <div class="flex items-center justify-between mb-2">
        <h1 class="text-lg font-semibold">利用者{{ isEdit ? '編集' : '新規登録' }}</h1>
        <n-button tertiary @click="$router.push({ name: 'user-list' })">一覧へ</n-button>
      </div>

      <n-form ref="formRef" :model="form" :rules="rules" label-placement="top">
        <!-- 基本情報 -->
        <n-divider>基本情報</n-divider>
        <n-form-item label="氏名" path="name">
          <n-input v-model:value="form.name" clearable />
        </n-form-item>
        <n-form-item label="カナ" path="kana">
          <n-input v-model:value="form.kana" clearable />
        </n-form-item>
        <n-form-item label="生年月日 (YYYY-MM-DD)" path="birthdate">
          <n-input v-model:value="form.birthdate" placeholder="例: 1940-01-23" clearable />
        </n-form-item>
        <n-form-item label="性別" path="sex">
          <n-select v-model:value="form.sex" :options="sexOptions" clearable />
        </n-form-item>

        <!-- 所属拠点（複数選択） -->
        <n-form-item label="所属拠点" path="branches">
          <n-select
            v-model:value="selectedBranchIds"
            :options="branchOptions"
            multiple
            clearable
            filterable
            placeholder="所属する拠点を選択（複数可）"
            style="max-width: 520px"
          />
        </n-form-item>

        <!-- 連絡先 -->
        <n-divider>連絡先</n-divider>
        <n-form-item label="電話" path="phone">
          <n-input v-model:value="form.phone" clearable />
        </n-form-item>
        <n-form-item label="住所" path="address">
          <n-input v-model:value="form.address" type="textarea" :autosize="{ minRows: 2, maxRows: 4 }" />
        </n-form-item>

        <!-- 緊急連絡先 -->
        <n-divider>緊急連絡先</n-divider>
        <n-form-item label="氏名" path="emergency_contact_name">
          <n-input v-model:value="form.emergency_contact_name" clearable />
        </n-form-item>
        <n-form-item label="続柄" path="emergency_contact_relation">
          <n-input v-model:value="form.emergency_contact_relation" clearable />
        </n-form-item>
        <n-form-item label="電話" path="emergency_contact_phone">
          <n-input v-model:value="form.emergency_contact_phone" clearable />
        </n-form-item>

        <!-- 医療情報 -->
        <n-divider>医療情報</n-divider>
        <n-form-item label="アレルギー（タグ）" path="allergies">
          <n-dynamic-tags v-model:value="form.allergies" />
          <div class="mt-2 flex items-center gap-2">
            <n-input
              ref="allergyInputRef"
              size="small"
              v-model:value="newAllergyTag"
              placeholder="タグを入力（日本語可）"
              class="max-w-[240px]"
            />
            <n-button size="small" @click="addAllergy">追加</n-button>
          </div>
        </n-form-item>
        <n-form-item label="既往・診断名（タグ）" path="diagnoses">
          <n-dynamic-tags v-model:value="form.diagnoses" />
          <div class="mt-2 flex items-center gap-2">
            <n-input
              ref="diagnosisInputRef"
              size="small"
              v-model:value="newDiagnosisTag"
              placeholder="タグを入力（日本語可）"
              class="max-w-[240px]"
            />
            <n-button size="small" @click="addDiagnosis">追加</n-button>
          </div>
        </n-form-item>
        <n-form-item label="内服・処方" path="medications">
          <n-input v-model:value="form.medications" type="textarea" :autosize="{ minRows: 2, maxRows: 6 }" />
        </n-form-item>

        <!-- 介護保険 -->
        <n-divider>介護保険</n-divider>
        <n-form-item label="要介護区分" path="care_level">
          <n-input v-model:value="form.care_level" placeholder="例: 要介護2" />
        </n-form-item>
        <n-form-item label="被保険者番号" path="care_insurance_id">
          <n-input v-model:value="form.care_insurance_id" />
        </n-form-item>

        <!-- 主治医 -->
        <n-divider>主治医</n-divider>
        <n-form-item label="氏名" path="physician_name">
          <n-input v-model:value="form.physician_name" />
        </n-form-item>
        <n-form-item label="医療機関" path="physician_clinic">
          <n-input v-model:value="form.physician_clinic" />
        </n-form-item>
        <n-form-item label="電話" path="physician_phone">
          <n-input v-model:value="form.physician_phone" />
        </n-form-item>

        <!-- 食事・嚥下 -->
        <n-divider>食事・嚥下</n-divider>
        <n-form-item label="食形態" path="diet">
          <n-select v-model:value="form.diet" :options="dietOptions" clearable />
        </n-form-item>
        <n-form-item label="嚥下注意点" path="swallowing_caution">
          <n-input v-model:value="form.swallowing_caution" type="textarea" :autosize="{ minRows: 2, maxRows: 4 }" />
        </n-form-item>

        <!-- リスク・認知 -->
        <n-divider>リスク・認知</n-divider>
        <n-form-item label="転倒リスク" path="fall_risk">
          <n-switch v-model:value="form.fall_risk">
            <template #checked>あり</template>
            <template #unchecked>なし</template>
          </n-switch>
        </n-form-item>
        <n-form-item label="認知症ステージ" path="dementia_stage">
          <n-input v-model:value="form.dementia_stage" />
        </n-form-item>

        <!-- 生活・ADL -->
        <n-divider>生活・ADL</n-divider>
        <n-form-item label="移動・補助具など" path="mobility">
          <n-input v-model:value="form.mobility" type="textarea" :autosize="{ minRows: 2, maxRows: 4 }" />
        </n-form-item>
        <n-form-item label="ADLメモ" path="adl_notes">
          <n-input v-model:value="form.adl_notes" type="textarea" :autosize="{ minRows: 2, maxRows: 4 }" />
        </n-form-item>

        <!-- 好み・配慮 -->
        <n-divider>好み・配慮</n-divider>
        <n-form-item label="好み・NG" path="preferences">
          <n-input v-model:value="form.preferences" type="textarea" :autosize="{ minRows: 2, maxRows: 4 }" />
        </n-form-item>
        <n-form-item label="伝達・配慮事項" path="communication_notes">
          <n-input v-model:value="form.communication_notes" type="textarea" :autosize="{ minRows: 2, maxRows: 4 }" />
        </n-form-item>

        <div class="flex justify-end gap-2 pt-2">
          <n-button ghost @click="$router.push({ name: 'user-list' })">キャンセル</n-button>
          <n-button type="primary" :loading="submitting" @click="save">保存</n-button>
        </div>
      </n-form>
    </n-card>
  </div>
</template>```

