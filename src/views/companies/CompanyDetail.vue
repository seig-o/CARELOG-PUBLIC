<!-- src/views/companies/CompanyDetail.vue -->
<template>
  <div class="p-4">
    <n-card :title="title">
      <template #header-extra>
        <n-space>
          <n-button quaternary @click="goList">一覧へ戻る</n-button>
          <n-button type="primary" @click="goEdit" :disabled="!companyId">編集</n-button>
        </n-space>
      </template>

      <n-descriptions
        v-if="row"
        label-placement="left"
        :column="1"
        bordered
        size="small"
      >
        <n-descriptions-item label="ID">
          <code class="break-all">{{ row.id }}</code>
        </n-descriptions-item>
        <n-descriptions-item label="会社名">
          {{ row.name || '—' }}
        </n-descriptions-item>
        <n-descriptions-item label="カナ">
          {{ row.kana || '—' }}
        </n-descriptions-item>
        <n-descriptions-item label="代表者">
          {{ row.daihyo || '—' }}
        </n-descriptions-item>
        <n-descriptions-item label="所在地">
          {{ row.addr || '—' }}
        </n-descriptions-item>
        <n-descriptions-item label="電話">
          {{ row.tel || '—' }}
        </n-descriptions-item>
        <n-descriptions-item label="作成日時">
          {{ formatDateTime(row.created_at) }}
        </n-descriptions-item>
      </n-descriptions>

      <div v-else class="py-6 text-center text-gray-500">
        データが見つかりませんでした
      </div>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMessage, NCard, NSpace, NButton, NDescriptions, NDescriptionsItem } from 'naive-ui'
import { supabase } from '@/lib/supabase'
import { TABLE, ROUTE } from '@/lib/contracts'

const route = useRoute()
const router = useRouter()
const message = useMessage()

const companyId = computed(() => route.params.companyId as string | undefined)
const title = computed(() => '会社詳細')

type CompanyRow = {
  id: string
  name: string | null
  kana: string | null
  daihyo: string | null
  addr: string | null
  tel: string | null
  created_at: string | null
}

const row = ref<CompanyRow | null>(null)

function formatDateTime(v?: string | null) {
  if (!v) return '—'
  // 表示簡易化（ローカル時刻）
  try {
    const d = new Date(v)
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    const hh = String(d.getHours()).padStart(2, '0')
    const mi = String(d.getMinutes()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd} ${hh}:${mi}`
  } catch {
    return v
  }
}

async function load() {
  if (!companyId.value) return
  const { data, error } = await supabase
    .from(TABLE.companies)
    .select('id, name, kana, daihyo, addr, tel, created_at')
    .eq('id', companyId.value)
    .maybeSingle()

  if (error) {
    console.error('[CompanyDetail] fetch error:', error)
    message.error('会社情報の取得に失敗しました')
    return
  }
  row.value = (data as CompanyRow) ?? null
}

function goList() {
  router.push({ name: ROUTE.companies.name.list })
}
function goEdit() {
  if (!companyId.value) return
  router.push({ name: ROUTE.companies.name.edit, params: { companyId: companyId.value } })
}

onMounted(load)
</script>

<style scoped>
.p-4 { padding: 1rem; }
.break-all { word-break: break-all; }
.py-6 { padding-top: 1.5rem; padding-bottom: 1.5rem; }
.text-center { text-align: center; }
.text-gray-500 { color: #6b7280; }
</style>