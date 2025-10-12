## src/views/staffs/StaffList.vue

```vue
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
  role?: 'superadmin' | 'admin' | 'manager' | string | null
  email?: string | null
  staff_branch_memberships?: Array<{ branch: BranchMini | null }> | null
}

const router = useRouter()
const loading = ref(false)
const rows = ref<Row[]>([])

async function fetchList () {
  loading.value = true
  try {
    const { data, error } = await fromCare(TABLE.staffs)
      .select(`
        id,
        name,
        role,
        email,
        staff_branch_memberships:staff_branch_memberships (
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
  const list = (row.staff_branch_memberships ?? [])
    .map(m => m?.branch?.name)
    .filter(Boolean) as string[]

  if (list.length === 0) return h('span', { style: 'color:#999' }, '—')

  const pills = list.slice(0, 3).map((name, i) =>
    h(NTag, { round: true, key: i, style: 'margin-right:6px' }, { default: () => name })
  )
  const rest = list.length - 3
  if (rest > 0) pills.push(h(NTag, { round: true, bordered: false }, { default: () => `+${rest}` }))
  return h('div', null, pills)
}

const columns = [
  { title: '氏名', key: 'name', minWidth: 160 },
  { title: '役割', key: 'role', width: 120 },
  { title: 'メール', key: 'email', minWidth: 200, ellipsis: { tooltip: true } },
  { title: '所属拠点', key: 'branches', minWidth: 260, render: (row: Row) => renderBranches(row) },
  {
    title: '操作',
    key: 'actions',
    width: 200,
    render: (row: Row) => h('div', null, [
      h(NButton, {
        size: 'small',
        tertiary: true,
        style: 'margin-right:8px',
        onClick: () => router.push({ name: 'staff-detail', params: { id: row.id } })
      }, { default: () => '詳細' }),
      h(NButton, {
        size: 'small',
        onClick: () => router.push({ name: 'staff-edit', params: { id: row.id } })
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
</template>```

