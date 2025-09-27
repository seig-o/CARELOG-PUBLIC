<template>
  <div class="p-6">
    <n-spin :show="loading">
      <n-data-table
        :columns="columns"
        :data="careLogs"
        :bordered="false"
        :single-line="false"
        :pagination="pagination"
      />
    </n-spin>
  </div>
</template>

<script setup lang="ts">
import { ref, h, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { NDataTable, NButton, NSpin } from 'naive-ui'
import { FQ_VIEW } from '@/lib/contracts'

const router = useRouter()
const careLogs = ref<any[]>([])
const loading = ref(false)

const pagination = { pageSize: 20 }

const columns = [
  { title: 'ID', key: 'id', width: 80 },
  { title: '利用者', key: 'user_name', width: 160 },
  { title: '日付', key: 'date', width: 140,
    render: (row: any) => new Date(row.date).toLocaleDateString() },
  { title: '概要', key: 'summary', ellipsis: { tooltip: true } },
  {
    title: '操作',
    key: 'actions',
    width: 200,
    render (row: any) {
      return h('div', { style: 'display:flex; gap:8px;' }, [
        h(
          NButton,
          { size: 'small', onClick: () => router.push({ name: 'care-log-detail', params: { id: row.id } }) },
          { default: () => '詳細' }
        ),
        h(
          NButton,
          { size: 'small', type: 'primary', onClick: () => router.push({ name: 'care-log-edit', params: { id: row.id } }) },
          { default: () => '編集' }
        )
      ])
    }
  }
]

const fetchLogs = async () => {
  loading.value = true
  const { data, error } = await supabase
    .from(FQ_VIEW.V_CARE_LOGS)
    .select('*')
    .order('date', { ascending: false })
    .limit(100)

  if (error) {
    console.error('[CareLogList] fetch error:', error)
  } else {
    careLogs.value = data ?? []
  }
  loading.value = false
}

onMounted(fetchLogs)
</script>