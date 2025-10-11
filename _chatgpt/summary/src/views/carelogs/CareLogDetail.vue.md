## src/views/carelogs/CareLogDetail.vue

```vue
<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fromCare } from '@/lib/supabase'
import { TABLE } from '@/lib/contracts'
import {
  NCard, NDescriptions, NDescriptionsItem, NTag, NEmpty, NSpin,
  NButton, NSpace, NDivider
} from 'naive-ui'

type CareLog = {
  id: string
  date: string | null
  user_id: string | null
  staff_id: string | null
  branch_id: string | null
  title: string | null
  content: string | null
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
  tags?: string[]
  created_at?: string
  updated_at?: string
}

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const log = ref<CareLog | null>(null)

const userName   = ref<string>('')
const staffName  = ref<string>('')
const branchName = ref<string>('')

const isLoaded = computed(() => !!log.value)

onMounted(async () => {
  await fetchDetail()
})

async function fetchDetail () {
  loading.value = true
  try {
    const id = String(route.params.id)
    // care_logs 本体
    const { data, error } = await fromCare(TABLE.careLogs)
      .select(`
        id, date, user_id, staff_id, branch_id,
        title, content, summary, details,
        vitals_bp_systolic, vitals_bp_diastolic, vitals_hr, vitals_temp,
        meal, medication_given, medication_notes,
        toileting, mobility, mood,
        incident_flag, incident_notes,
        next_actions,
        tags,
        created_at, updated_at
      `)
      .eq('id', id)
      .single()
    if (error) throw error
    log.value = data as CareLog

    // 関連の名前解決（RLS範囲内で取得）
    const [u, s, b] = await Promise.all([
      log.value?.user_id
        ? fromCare(TABLE.users).select('id, name').eq('id', log.value.user_id).maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      log.value?.staff_id
        ? fromCare(TABLE.staffs).select('id, name').eq('id', log.value.staff_id).maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      log.value?.branch_id
        ? fromCare(TABLE.branches).select('id, name').eq('id', log.value.branch_id).maybeSingle()
        : Promise.resolve({ data: null, error: null })
    ])

    userName.value   = (u as any)?.data?.name   ?? (log.value?.user_id   ?? '')
    staffName.value  = (s as any)?.data?.name   ?? (log.value?.staff_id  ?? '')
    branchName.value = (b as any)?.data?.name   ?? (log.value?.branch_id ?? '')
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

function goEdit () {
  if (!log.value?.id) return
  router.push({ name: 'care-log-edit', params: { id: log.value.id } })
}
</script>

<template>
  <div class="max-w-4xl">
    <n-card>
      <div class="flex items-center justify-between mb-2">
        <h1 class="text-lg font-semibold">ケアログ詳細</h1>
        <n-space>
          <n-button tertiary @click="$router.push({ name: 'care-log-list' })">一覧へ</n-button>
          <n-button type="primary" :disabled="!isLoaded" @click="goEdit">編集</n-button>
        </n-space>
      </div>

      <n-spin :show="loading">
        <n-descriptions
          v-if="log"
          label-placement="left"
          bordered
          :column="1"
        >
          <!-- 基本情報 -->
          <n-descriptions-item label="日付">
            {{ log.date || '—' }}
          </n-descriptions-item>
          <n-descriptions-item label="利用者">
            {{ userName || '—' }}
          </n-descriptions-item>
          <n-descriptions-item label="担当スタッフ">
            {{ staffName || '—' }}
          </n-descriptions-item>
          <n-descriptions-item label="拠点">
            {{ branchName || '—' }}
          </n-descriptions-item>

          <n-descriptions-item label="タイトル">
            {{ log.title || '—' }}
          </n-descriptions-item>
          <n-descriptions-item label="本文">
            <div class="whitespace-pre-wrap break-words">{{ log.content || '—' }}</div>
          </n-descriptions-item>

          <!-- まとめ/詳細 -->
          <n-descriptions-item label="サマリー">
            <div class="whitespace-pre-wrap break-words">{{ log.summary || '—' }}</div>
          </n-descriptions-item>
          <n-descriptions-item label="詳細メモ">
            <div class="whitespace-pre-wrap break-words">{{ log.details || '—' }}</div>
          </n-descriptions-item>

          <!-- バイタル -->
          <n-descriptions-item label="体温 (℃)">
            {{ (log.vitals_temp ?? '') !== '' && log.vitals_temp !== null ? log.vitals_temp : '—' }}
          </n-descriptions-item>
          <n-descriptions-item label="血圧 (mmHg)">
            <span v-if="(log.vitals_bp_systolic ?? null) !== null || (log.vitals_bp_diastolic ?? null) !== null">
              {{ log.vitals_bp_systolic ?? '—' }} / {{ log.vitals_bp_diastolic ?? '—' }}
            </span>
            <span v-else>—</span>
          </n-descriptions-item>
          <n-descriptions-item label="心拍数 (bpm)">
            {{ (log.vitals_hr ?? '') !== '' && log.vitals_hr !== null ? log.vitals_hr : '—' }}
          </n-descriptions-item>

          <!-- 生活系 -->
          <n-descriptions-item label="食事">
            <div class="whitespace-pre-wrap break-words">{{ log.meal || '—' }}</div>
          </n-descriptions-item>
          <n-descriptions-item label="投薬">
            <div class="flex flex-col gap-1">
              <div>実施: {{ log.medication_given ? 'あり' : 'なし' }}</div>
              <div v-if="log.medication_given">
                <div class="whitespace-pre-wrap break-words">
                  {{ log.medication_notes || '（記載なし）' }}
                </div>
              </div>
            </div>
          </n-descriptions-item>
          <n-descriptions-item label="排泄状況">
            <div class="whitespace-pre-wrap break-words">{{ log.toileting || '—' }}</div>
          </n-descriptions-item>
          <n-descriptions-item label="移動・ADL">
            <div class="whitespace-pre-wrap break-words">{{ log.mobility || '—' }}</div>
          </n-descriptions-item>
          <n-descriptions-item label="機嫌・様子">
            <div class="whitespace-pre-wrap break-words">{{ log.mood || '—' }}</div>
          </n-descriptions-item>

          <!-- インシデント -->
          <n-descriptions-item label="インシデント">
            <div class="flex flex-col gap-1">
              <div>発生: {{ log.incident_flag ? 'あり' : 'なし' }}</div>
              <div v-if="log.incident_flag">
                <div class="whitespace-pre-wrap break-words">
                  {{ log.incident_notes || '（記載なし）' }}
                </div>
              </div>
            </div>
          </n-descriptions-item>

          <!-- 次アクション -->
          <n-descriptions-item label="次アクション">
            <div class="whitespace-pre-wrap break-words">{{ log.next_actions || '—' }}</div>
          </n-descriptions-item>

          <!-- タグ -->
          <n-descriptions-item label="タグ">
            <div v-if="(log.tags?.length ?? 0) > 0" class="flex flex-wrap gap-2">
              <n-tag v-for="(t, i) in log.tags" :key="i" round>{{ t }}</n-tag>
            </div>
            <n-empty v-else description="タグなし" size="small" />
          </n-descriptions-item>

          <!-- システム -->
          <n-descriptions-item label="作成日時">
            {{ log.created_at || '—' }}
          </n-descriptions-item>
          <n-descriptions-item label="更新日時">
            {{ log.updated_at || '—' }}
          </n-descriptions-item>
          <n-descriptions-item label="ID">
            {{ log.id }}
          </n-descriptions-item>
        </n-descriptions>

        <n-empty v-else description="データが見つかりません" class="py-8" />
      </n-spin>
    </n-card>
  </div>
</template>

<style scoped>
/* 追加の見た目微調整があればここに */
</style>```

