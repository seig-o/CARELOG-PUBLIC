<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fromCare } from '@/lib/supabase'
import { TABLE } from '@/lib/contracts'
import {
  NCard, NSpace, NButton, NDivider, NDescriptions, NDescriptionsItem, NAlert, useMessage
} from 'naive-ui'

type CareLog = {
  id: string
  date: string | null
  user_id: string | null
  staff_id: string | null
  branch_id: string | null
  title: string | null
  content: string | null
  created_at: string | null
}

const route = useRoute()
const router = useRouter()
const message = useMessage()

const id = route.params.id as string
const loading = ref(false)
const item = ref<CareLog | null>(null)

// 付随情報（名前表示用・簡易）
const userName   = ref<string | null>(null)
const staffName  = ref<string | null>(null)
const branchName = ref<string | null>(null)

const notFound = computed(() => !loading.value && !item.value)

async function loadNames (userId: string | null, staffId: string | null, branchId: string | null) {
  try {
    if (userId) {
      const { data } = await fromCare(TABLE.users).select('name').eq('id', userId).maybeSingle()
      userName.value = (data as any)?.name ?? userId
    }
    if (staffId) {
      const { data } = await fromCare(TABLE.staffs).select('name').eq('id', staffId).maybeSingle()
      staffName.value = (data as any)?.name ?? staffId
    }
    if (branchId) {
      const { data } = await fromCare(TABLE.branches).select('name').eq('id', branchId).maybeSingle()
      branchName.value = (data as any)?.name ?? branchId
    }
  } catch {
    // 名前解決はベストエフォート
  }
}

async function fetchOne () {
  loading.value = true
  try {
    const { data, error } = await fromCare(TABLE.careLogs)
      .select('id, date, user_id, staff_id, branch_id, title, content, created_at')
      .eq('id', id)
      .single()
    if (error) throw error
    item.value = data as CareLog
    await loadNames(item.value.user_id, item.value.staff_id, item.value.branch_id)
  } catch (e: any) {
    console.error(e)
    message.error(e?.message ?? 'ケアログの取得に失敗しました')
    item.value = null
  } finally {
    loading.value = false
  }
}

function goList () { router.push({ name: 'carelog-list' }) }
function goEdit () { router.push({ name: 'carelog-edit', params: { id } }) }

onMounted(fetchOne)
</script>

<template>
  <div class="p-4">
    <n-card>
      <div class="flex items-center justify-between mb-2">
        <h1 class="text-lg font-semibold">ケアログ詳細</h1>
        <n-space>
          <n-button tertiary @click="goList">一覧へ</n-button>
          <n-button type="primary" @click="goEdit">編集</n-button>
        </n-space>
      </div>

      <n-divider style="margin:8px 0 16px;" />

      <n-alert v-if="notFound" type="warning" class="mb-3">
        データが見つかりませんでした。
      </n-alert>

      <template v-else>
        <n-descriptions
          label-placement="left"
          :column="1"
          bordered
          size="small"
        >
          <n-descriptions-item label="ID">
            {{ item?.id }}
          </n-descriptions-item>

          <n-descriptions-item label="日付">
            {{ item?.date || '—' }}
          </n-descriptions-item>

          <n-descriptions-item label="利用者">
            {{ userName ?? item?.user_id ?? '—' }}
          </n-descriptions-item>

          <n-descriptions-item label="担当">
            {{ staffName ?? item?.staff_id ?? '—' }}
          </n-descriptions-item>

          <n-descriptions-item label="拠点">
            {{ branchName ?? item?.branch_id ?? '—' }}
          </n-descriptions-item>

          <n-descriptions-item label="タイトル">
            {{ item?.title || '—' }}
          </n-descriptions-item>

          <n-descriptions-item label="本文">
            <div style="white-space:pre-wrap">{{ item?.content || '—' }}</div>
          </n-descriptions-item>

          <n-descriptions-item label="作成日時">
            {{ item?.created_at || '—' }}
          </n-descriptions-item>
        </n-descriptions>
      </template>
    </n-card>
  </div>
</template>