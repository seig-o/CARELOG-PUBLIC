<script setup lang="ts">
import { ref, onMounted, h } from 'vue'
import { useRouter } from 'vue-router'
import { fromCare } from '@/lib/supabase'
import { TABLE } from '@/lib/contracts'
import { NDataTable, NSpin, NButton, NTag } from 'naive-ui'

type BranchMini = { id: string; name: string | null }
type Row = {
  id: string
  name: string
  kana?: string | null
  status?: string | null
  user_branch_memberships?: Array<{ branch: BranchMini | null }> | null
}

const router = useRouter()
const loading = ref(false)
const rows = ref<Row[]>([])

async function fetchList () {
  loading.value = true
  try {
    const { data, error } = await fromCare(TABLE.users)
      .select(`
        id,
        name,
        kana,
        status,
        user_branch_memberships:user_branch_memberships (
          branch:branches (
            id,
            name
          )
        )
      `)
      .order('name', { ascending: true })

    if (error) throw error
    rows.value = (data ?? []) as Row[]
  } finally {
    loading.value = false
  }
}

onMounted(fetchList)

function renderBranches (row: Row) {
  const list = (row.user_branch_memberships ?? [])
    .map(m => m?.branch?.name)
    .filter(Boolean) as string[]

  if (list.length === 0) return h('span', { style: 'color:#999' }, '—')

  // タグ風に並べる（数が多ければ先頭3件＋ "+n"）
  const pills = list.slice(0, 3).map((name, i) =>
    h(NTag, { round: true, key: i, style: 'margin-right:6px' }, { default: () => name })
  )
  const rest = list.length - 3
  if (rest > 0) pills.push(h(NTag, { round: true, bordered: false }, { default: () => `+${rest}` }))
  return h('div', null, pills)
}

const columns = [
  { title: '氏名', key: 'name', minWidth: 160 },
  { title: 'カナ', key: 'kana', minWidth: 160, ellipsis: { tooltip: true } },
  { title: 'ステータス', key: 'status', width: 120 },
  { title: '所属拠点', key: 'branches', minWidth: 260, render: (row: Row) => renderBranches(row) },
  {
    title: '操作',
    key: 'actions',
    width: 180,
    render: (row: Row) => h('div', null, [
      h(NButton, {
        size: 'small',
        tertiary: true,
        style: 'margin-right:8px',
        onClick: () => router.push({ name: 'user-detail', params: { id: row.id } })
      }, { default: () => '詳細' }),
      h(NButton, {
        size: 'small',
        onClick: () => router.push({ name: 'user-edit', params: { id: row.id } })
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