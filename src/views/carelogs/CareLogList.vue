<script setup lang="ts">
import { ref, onMounted, h, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fromCare } from '@/lib/supabase'
import { TABLE } from '@/lib/contracts'
import { NButton, NTag, NDataTable, NSpin } from 'naive-ui'

type Row = {
  id: string
  date: string
  title?: string
  summary?: string
  tags?: string[]
  branch_id?: string | null
  branch?: {
    id: string
    name?: string | null
    company?: {
      id: string
      name?: string | null
    } | null
  } | null
}

const route = useRoute()
const router = useRouter()

// /branch/:branchId/care-logs or ?branchId=... からの絞り込みに対応
const branchId = computed<string | undefined>(() => {
  return (route.params.branchId as string) || (route.query.branchId as string) || undefined
})

const loading = ref(false)
const rows = ref<Row[]>([])

async function fetchList () {
  loading.value = true
  try {
    // ネストで branch / company 名まで取得
    let q = fromCare(TABLE.careLogs)
      .select(`
        id,
        date,
        title,
        summary,
        tags,
        branch_id,
        branch:branches (
          id,
          name,
          company:companies (
            id,
            name
          )
        )
      `)
      .order('date', { ascending: false })

    if (branchId.value) {
      q = q.eq('branch_id', branchId.value)
    }

    const { data, error } = await q
    if (error) throw error
    rows.value = (data ?? []) as Row[]
  } finally {
    loading.value = false
  }
}

onMounted(fetchList)

// 先頭3件＋ "+n" 表示
function renderTags (row: Row) {
  const tags = Array.isArray(row.tags) ? row.tags : []
  if (tags.length === 0) return h('span', { style: 'color:#999' }, '—')

  const pills = tags.slice(0, 3).map((t, i) =>
    h(NTag, { round: true, key: i, style: 'margin-right:6px' }, { default: () => t })
  )
  const rest = tags.length - 3
  if (rest > 0) {
    pills.push(h(NTag, { round: true, bordered: false }, { default: () => `+${rest}` }))
  }
  return h('div', null, pills)
}

const columns = [
  { title: '日付', key: 'date', width: 120 },
  { title: 'タイトル', key: 'title', ellipsis: { tooltip: true }, minWidth: 200 },
  { title: '概要', key: 'summary', ellipsis: { tooltip: true }, minWidth: 260 },

  // ★ 追加：拠点名カラム
  {
    title: '拠点',
    key: 'branch_name',
    width: 200,
    render: (row: Row) => (row.branch?.name ?? '—')
  },
  {
    title: '操作',
    key: 'actions',
    width: 180,
    render: (row: Row) => h('div', null, [
      h(NButton, {
        size: 'small',
        tertiary: true,
        style: 'margin-right:8px',
        onClick: () => router.push({ name: 'care-log-detail', params: { id: row.id } })
      }, { default: () => '詳細' }),
      h(NButton, {
        size: 'small',
        onClick: () => router.push({ name: 'care-log-edit', params: { id: row.id } })
      }, { default: () => '編集' })
    ])
  }
]
</script>

<template>
  <div>
    <n-spin :show="loading">
      <n-data-table :columns="columns" :data="rows" :bordered="false" />
    </n-spin>
  </div>
</template>