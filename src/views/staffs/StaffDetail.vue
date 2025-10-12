<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fromCare } from '@/lib/supabase'
import { TABLE } from '@/lib/contracts'
// useMessage は自動化が不安定な環境があるため明示
import { useMessage } from 'naive-ui'

type Staff = {
  id: string
  name: string | null
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
  qualification_tags?: string[] | null
  skill_tags?: string[] | null
  emergency_contact_name?: string | null
  emergency_contact_relation?: string | null
  emergency_contact_phone?: string | null
  availability_notes?: string | null
  training_notes?: string | null
  memo?: string | null
  photo_url?: string | null
  created_at?: string
  updated_at?: string
}

const route = useRoute()
const router = useRouter()
const message = useMessage()

const loading = ref(false)
const staff = ref<Staff | null>(null)
const isLoaded = computed(() => !!staff.value)

onMounted(fetchDetail)

async function fetchDetail () {
  loading.value = true
  try {
    const id = String(route.params.id)
    const { data, error } = await fromCare(TABLE.staffs)
      .select(`
        id, name, kana, birthdate, sex,
        phone, email, address,
        employment_type, hire_date, retire_date,
        department, title,
        qualification_tags, skill_tags,
        emergency_contact_name, emergency_contact_relation, emergency_contact_phone,
        availability_notes, training_notes, memo,
        photo_url,
        created_at, updated_at
      `)
      .eq('id', id)
      .single()
    if (error) throw error
    staff.value = data as Staff
  } catch (e:any) {
    console.error(e)
    message.error(e?.message ?? '読み込みに失敗しました')
  } finally {
    loading.value = false
  }
}

function goEdit () {
  if (!staff.value?.id) return
  router.push({ name: 'staff-edit', params: { id: staff.value.id } })
}
</script>

<template>
  <div class="max-w-4xl">
    <n-card>
      <div class="flex items-center justify-between mb-2">
        <h1 class="text-lg font-semibold">スタッフ詳細</h1>
        <n-space>
          <n-button tertiary @click="$router.push({ name: 'staff-list' })">一覧へ</n-button>
          <n-button type="primary" :disabled="!isLoaded" @click="goEdit">編集</n-button>
        </n-space>
      </div>

      <n-spin :show="loading">
        <template v-if="staff">
          <div class="mb-4">
            <n-image
              v-if="staff.photo_url"
              :src="staff.photo_url"
              width="120" height="120"
              class="rounded-xl object-cover"
            />
          </div>

          <n-divider>基本情報</n-divider>
          <n-descriptions label-placement="left" bordered :column="2">
            <n-descriptions-item label="氏名">{{ staff.name || '—' }}</n-descriptions-item>
            <n-descriptions-item label="カナ">{{ staff.kana || '—' }}</n-descriptions-item>
            <n-descriptions-item label="生年月日">{{ staff.birthdate || '—' }}</n-descriptions-item>
            <n-descriptions-item label="性別">{{ staff.sex || '—' }}</n-descriptions-item>
          </n-descriptions>

          <n-divider>連絡先</n-divider>
          <n-descriptions label-placement="left" bordered :column="2">
            <n-descriptions-item label="電話">{{ staff.phone || '—' }}</n-descriptions-item>
            <n-descriptions-item label="メール">{{ staff.email || '—' }}</n-descriptions-item>
            <n-descriptions-item label="住所"><div class="whitespace-pre-wrap">{{ staff.address || '—' }}</div></n-descriptions-item>
          </n-descriptions>

          <n-divider>雇用・所属</n-divider>
          <n-descriptions label-placement="left" bordered :column="2">
            <n-descriptions-item label="雇用形態">{{ staff.employment_type || '—' }}</n-descriptions-item>
            <n-descriptions-item label="入社日">{{ staff.hire_date || '—' }}</n-descriptions-item>
            <n-descriptions-item label="退職日">{{ staff.retire_date || '—' }}</n-descriptions-item>
            <n-descriptions-item label="部署">{{ staff.department || '—' }}</n-descriptions-item>
            <n-descriptions-item label="役職">{{ staff.title || '—' }}</n-descriptions-item>
          </n-descriptions>

          <n-divider>資格・スキル</n-divider>
          <n-descriptions label-placement="left" bordered :column="1">
            <n-descriptions-item label="資格">
              <div v-if="(staff.qualification_tags?.length ?? 0) > 0" class="flex flex-wrap gap-2">
                <n-tag v-for="(t,i) in staff.qualification_tags" :key="i" round>{{ t }}</n-tag>
              </div>
              <n-empty v-else size="small" description="未登録" />
            </n-descriptions-item>
            <n-descriptions-item label="スキル">
              <div v-if="(staff.skill_tags?.length ?? 0) > 0" class="flex flex-wrap gap-2">
                <n-tag v-for="(t,i) in staff.skill_tags" :key="i" round>{{ t }}</n-tag>
              </div>
              <n-empty v-else size="small" description="未登録" />
            </n-descriptions-item>
          </n-descriptions>

          <n-divider>緊急連絡先</n-divider>
          <n-descriptions label-placement="left" bordered :column="2">
            <n-descriptions-item label="氏名">{{ staff.emergency_contact_name || '—' }}</n-descriptions-item>
            <n-descriptions-item label="続柄">{{ staff.emergency_contact_relation || '—' }}</n-descriptions-item>
            <n-descriptions-item label="電話">{{ staff.emergency_contact_phone || '—' }}</n-descriptions-item>
          </n-descriptions>

          <n-divider>勤務・研修・メモ</n-divider>
          <n-descriptions label-placement="left" bordered :column="1">
            <n-descriptions-item label="出勤可能・希望">
              <div class="whitespace-pre-wrap">{{ staff.availability_notes || '—' }}</div>
            </n-descriptions-item>
            <n-descriptions-item label="研修履歴・資格更新">
              <div class="whitespace-pre-wrap">{{ staff.training_notes || '—' }}</div>
            </n-descriptions-item>
            <n-descriptions-item label="メモ">
              <div class="whitespace-pre-wrap">{{ staff.memo || '—' }}</div>
            </n-descriptions-item>
          </n-descriptions>

          <n-divider>システム</n-divider>
          <n-descriptions label-placement="left" bordered :column="2">
            <n-descriptions-item label="作成日時">{{ staff.created_at || '—' }}</n-descriptions-item>
            <n-descriptions-item label="更新日時">{{ staff.updated_at || '—' }}</n-descriptions-item>
            <n-descriptions-item label="ID">{{ staff.id }}</n-descriptions-item>
          </n-descriptions>
        </template>

        <n-empty v-else description="データが見つかりません" class="py-8" />
      </n-spin>
    </n-card>
  </div>
</template>