## src/views/staffs/StaffUpsert.vue

```vue
<script setup lang="ts">
import { ref, computed, onMounted, nextTick, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fromCare } from '@/lib/supabase'
import { TABLE } from '@/lib/contracts'
import { useImeGuard, pushUniqueTag } from '@/lib/utils'
import { useMessage } from 'naive-ui'
import type { InputInst } from 'naive-ui'

type StaffForm = {
  id?: string
  name: string
  kana?: string | null
  birthdate?: string | null
  sex?: string | null
  phone?: string | null
  email?: string | null
  address?: string | null
  employment_type?: string | null
  hire_date?: string | null
  retire_date?: string | null
  department?: string | null
  title?: string | null
  qualification_tags?: string[]
  skill_tags?: string[]
  emergency_contact_name?: string | null
  emergency_contact_relation?: string | null
  emergency_contact_phone?: string | null
  availability_notes?: string | null
  training_notes?: string | null
  memo?: string | null
  photo_url?: string | null
}

const route = useRoute()
const router = useRouter()
const message = useMessage()

const id = route.params.id as string | undefined
const isEdit = computed(() => !!id)

const formRef = ref()
const submitting = ref(false)
const form = ref<StaffForm>({
  name: '',
  kana: '',
  birthdate: '',
  sex: '',
  phone: '',
  email: '',
  address: '',
  employment_type: '',
  hire_date: '',
  retire_date: '',
  department: '',
  title: '',
  qualification_tags: [],
  skill_tags: [],
  emergency_contact_name: '',
  emergency_contact_relation: '',
  emergency_contact_phone: '',
  availability_notes: '',
  training_notes: '',
  memo: '',
  photo_url: ''
})

const rules = {
  name: { required: true, message: '氏名は必須です', trigger: ['blur', 'input'] }
}

/* ------------ 所属拠点（multiple） -------------- */
type Option = { label: string; value: string }
const branchOptions = ref<Option[]>([])
const selectedBranchIds = ref<string[]>([])

async function loadBranchOptions () {
  const { data, error } = await fromCare(TABLE.branches)
    .select('id, name')
    .order('name', { ascending: true })
  if (error) throw error
  branchOptions.value = (data ?? []).map((b: any) => ({
    label: b?.name ?? b?.id,
    value: b?.id
  }))
}

/* --------- IMEガード（2回Enterで追加：資格/スキル用） --------- */
const { onCompStart, onCompEnd, onEnter, onBlur } = useImeGuard({ doubleEnterWindowMs: 800, suppressAfterCompMs: 60 })
const qInputRef = ref<InputInst | null>(null)  // 資格
const sInputRef = ref<InputInst | null>(null)  // スキル
const newQTag = ref('')
const newSTag = ref('')
let removeQListeners: (() => void) | null = null
let removeSListeners: (() => void) | null = null

function addQual () {
  form.value.qualification_tags = pushUniqueTag(form.value.qualification_tags, newQTag.value)
  newQTag.value = ''
}
function addSkill () {
  form.value.skill_tags = pushUniqueTag(form.value.skill_tags, newSTag.value)
  newSTag.value = ''
}

async function bindNative () {
  await nextTick()
  const bind = (inst: InputInst | null, addFn: () => void) => {
    const el = inst?.inputElRef
    if (!el) return () => {}

    const handleKeyDown   = (evt: KeyboardEvent) => { if (evt.key === 'Enter') onEnter(addFn)(evt) }
    const handleCompStart = () => onCompStart()
    const handleCompEnd   = () => onCompEnd()
    const handleBlurEv    = () => onBlur()

    el.addEventListener('keydown', handleKeyDown)
    el.addEventListener('compositionstart', handleCompStart as any)
    el.addEventListener('compositionend', handleCompEnd as any)
    el.addEventListener('blur', handleBlurEv as any)

    return () => {
      el.removeEventListener('keydown', handleKeyDown)
      el.removeEventListener('compositionstart', handleCompStart as any)
      el.removeEventListener('compositionend', handleCompEnd as any)
      el.removeEventListener('blur', handleBlurEv as any)
    }
  }
  removeQListeners = bind(qInputRef.value, addQual)
  removeSListeners = bind(sInputRef.value, addSkill)
}

onBeforeUnmount(() => {
  removeQListeners?.()
  removeSListeners?.()
  removeQListeners = removeSListeners = null
})

/* -------------- 初期読み込み --------------- */
onMounted(async () => {
  try {
    // 拠点選択肢 → スタッフ本体/所属
    await loadBranchOptions()
    await loadExisting()
    await bindNative()
  } catch (e:any) {
    console.error(e)
    message.error(e?.message ?? '初期化に失敗しました')
  }
})

async function loadExisting () {
  if (!isEdit.value) return
  try {
    // スタッフ本体
    const { data, error } = await fromCare(TABLE.staffs)
      .select(`
        id, name, kana, birthdate, sex,
        phone, email, address,
        employment_type, hire_date, retire_date,
        department, title,
        qualification_tags, skill_tags,
        emergency_contact_name, emergency_contact_relation, emergency_contact_phone,
        availability_notes, training_notes, memo,
        photo_url
      `)
      .eq('id', id!)
      .single()
    if (error) throw error
    form.value = {
      ...(data as any),
      qualification_tags: Array.isArray((data as any).qualification_tags) ? (data as any).qualification_tags : [],
      skill_tags: Array.isArray((data as any).skill_tags) ? (data as any).skill_tags : []
    }

    // 所属拠点（membership）
    const { data: mems, error: mErr } = await fromCare(TABLE.staffBranchMemberships)
      .select('branch_id')
      .eq('staff_id', id!)
    if (mErr) throw mErr
    selectedBranchIds.value = (mems ?? []).map((m: any) => m.branch_id).filter(Boolean)
  } catch (e:any) {
    throw e
  }
}

/* ---------------- 保存処理（差分同期） ---------------- */
async function save () {
  try {
    await formRef.value?.validate()
    submitting.value = true

    // 本体ペイロード正規化
    const payload: StaffForm = {
      ...form.value,
      qualification_tags: (form.value.qualification_tags ?? []).map(t => String(t).trim()).filter(Boolean),
      skill_tags: (form.value.skill_tags ?? []).map(t => String(t).trim()).filter(Boolean)
    }

    // 1) 本体 INSERT/UPDATE
    let staffId = form.value.id as string | undefined
    if (isEdit.value) {
      const { error } = await fromCare(TABLE.staffs).update(payload).eq('id', staffId!)
      if (error) throw error
    } else {
      const { data, error } = await fromCare(TABLE.staffs)
        .insert(payload)
        .select('id')
        .single()
      if (error) throw error
      staffId = (data as any)?.id
      form.value.id = staffId
    }

    if (!staffId) {
      throw new Error('スタッフIDの解決に失敗しました')
    }

    // 2) 既存 membership を取得
    const { data: currentMems, error: curErr } = await fromCare(TABLE.staffBranchMemberships)
      .select('branch_id')
      .eq('staff_id', staffId)
    if (curErr) throw curErr
    const currentIds = new Set<string>((currentMems ?? []).map((m:any) => m.branch_id))

    // 3) 差分算出
    const nextIds = new Set<string>(selectedBranchIds.value ?? [])
    const toAdd: string[] = []
    const toRemove: string[] = []
    nextIds.forEach(id => { if (!currentIds.has(id)) toAdd.push(id) })
    currentIds.forEach(id => { if (!nextIds.has(id)) toRemove.push(id) })

    // 4) 追加
    if (toAdd.length > 0) {
      const rows = toAdd.map(bid => ({ staff_id: staffId!, branch_id: bid }))
      const { error: addErr } = await fromCare(TABLE.staffBranchMemberships).insert(rows)
      if (addErr) throw addErr
    }

    // 5) 削除
    if (toRemove.length > 0) {
      const { error: delErr } = await fromCare(TABLE.staffBranchMemberships)
        .delete()
        .eq('staff_id', staffId)
        .in('branch_id', toRemove)
      if (delErr) throw delErr
    }

    message.success(isEdit.value ? '更新しました' : '追加しました')
    router.push({ name: 'staff-list' })
  } catch (e:any) {
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
        <h1 class="text-lg font-semibold">スタッフ{{ isEdit ? '編集' : '新規登録' }}</h1>
        <n-button tertiary @click="$router.push({ name: 'staff-list' })">一覧へ</n-button>
      </div>

      <n-form ref="formRef" :model="form" :rules="rules" label-placement="top">
        <n-divider>基本情報</n-divider>
        <n-form-item label="氏名" path="name"><n-input v-model:value="form.name" clearable /></n-form-item>
        <n-form-item label="カナ" path="kana"><n-input v-model:value="form.kana" clearable /></n-form-item>
        <n-form-item label="生年月日 (YYYY-MM-DD)" path="birthdate"><n-input v-model:value="form.birthdate" clearable /></n-form-item>
        <n-form-item label="性別" path="sex"><n-input v-model:value="form.sex" placeholder="例: male/female/other" /></n-form-item>

        <n-divider>連絡先</n-divider>
        <n-form-item label="電話" path="phone"><n-input v-model:value="form.phone" clearable /></n-form-item>
        <n-form-item label="メール" path="email"><n-input v-model:value="form.email" clearable /></n-form-item>
        <n-form-item label="住所" path="address"><n-input v-model:value="form.address" type="textarea" :autosize="{minRows:2, maxRows:4}" /></n-form-item>

        <n-divider>雇用・所属</n-divider>
        <n-form-item label="雇用形態" path="employment_type"><n-input v-model:value="form.employment_type" placeholder="例: 常勤/非常勤 など" /></n-form-item>
        <n-form-item label="入社日" path="hire_date"><n-input v-model:value="form.hire_date" placeholder="YYYY-MM-DD" /></n-form-item>
        <n-form-item label="退職日" path="retire_date"><n-input v-model:value="form.retire_date" placeholder="YYYY-MM-DD" /></n-form-item>
        <n-form-item label="部署" path="department"><n-input v-model:value="form.department" /></n-form-item>
        <n-form-item label="役職" path="title"><n-input v-model:value="form.title" /></n-form-item>

        <!-- 所属拠点（複数選択） -->
        <n-form-item label="所属拠点" path="branches">
          <n-select
            v-model:value="selectedBranchIds"
            :options="branchOptions"
            multiple
            placeholder="所属する拠点を選択"
            clearable
            filterable
            style="max-width: 520px"
          />
        </n-form-item>

        <n-divider>資格・スキル</n-divider>
        <n-form-item label="資格（タグ）" path="qualification_tags">
          <n-dynamic-tags v-model:value="form.qualification_tags" />
          <div class="mt-2 flex items-center gap-2">
            <n-input ref="qInputRef" size="small" v-model:value="newQTag" placeholder="例: 介護福祉士 / 看護師" class="max-w-[260px]" />
            <n-button size="small" @click="addQual">追加</n-button>
          </div>
        </n-form-item>
        <n-form-item label="スキル（タグ）" path="skill_tags">
          <n-dynamic-tags v-model:value="form.skill_tags" />
          <div class="mt-2 flex items-center gap-2">
            <n-input ref="sInputRef" size="small" v-model:value="newSTag" placeholder="例: 認知症ケア / 送迎" class="max-w-[260px]" />
            <n-button size="small" @click="addSkill">追加</n-button>
          </div>
        </n-form-item>

        <n-divider>緊急連絡先</n-divider>
        <n-form-item label="氏名" path="emergency_contact_name"><n-input v-model:value="form.emergency_contact_name" /></n-form-item>
        <n-form-item label="続柄" path="emergency_contact_relation"><n-input v-model:value="form.emergency_contact_relation" /></n-form-item>
        <n-form-item label="電話" path="emergency_contact_phone"><n-input v-model:value="form.emergency_contact_phone" /></n-form-item>

        <n-divider>勤務・研修・メモ</n-divider>
        <n-form-item label="出勤可能・希望" path="availability_notes"><n-input v-model:value="form.availability_notes" type="textarea" :autosize="{minRows:2, maxRows:4}" /></n-form-item>
        <n-form-item label="研修履歴・資格更新" path="training_notes"><n-input v-model:value="form.training_notes" type="textarea" :autosize="{minRows:2, maxRows:4}" /></n-form-item>
        <n-form-item label="メモ" path="memo"><n-input v-model:value="form.memo" type="textarea" :autosize="{minRows:2, maxRows:6}" /></n-form-item>

        <div class="flex justify-end gap-2 pt-2">
          <n-button ghost @click="$router.push({ name: 'staff-list' })">キャンセル</n-button>
          <n-button type="primary" :loading="submitting" @click="save">保存</n-button>
        </div>
      </n-form>
    </n-card>
  </div>
</template>```

