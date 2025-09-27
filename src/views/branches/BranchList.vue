<template>
  <div>
    <n-space justify="space-between" align="center" class="mb-4">
      <h2 class="text-xl font-bold">拠点一覧</h2>
      <n-button type="primary" @click="goNew">新規追加</n-button>
    </n-space>

    <n-data-table
      :columns="columns"
      :data="branches"
      :loading="loading"
      :pagination="pagination"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, h, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { NButton } from 'naive-ui'
import { supabase } from '@/lib/supabase'

const router = useRouter()
const branches = ref<any[]>([])
const loading = ref(false)
const pagination = { pageSize: 10 }

const goNew = () => router.push({ name: 'branch-new' })

const columns = [
  { title: 'ID', key: 'id', width: 250 },
  { title: '拠点名', key: 'name' },
  {
    title: '操作',
    key: 'actions',
    width: 200,
    render (row: any) {
      return h('div', {}, [
        h(
          NButton,
          {
            size: 'small',
            onClick: () => router.push({ name: 'branch-detail', params: { id: row.id } }),
            style: 'margin-right: 8px'
          },
          { default: () => '詳細' }
        ),
        h(
          NButton,
          {
            size: 'small',
            type: 'primary',
            onClick: () => router.push({ name: 'branch-edit', params: { id: row.id } })
          },
          { default: () => '編集' }
        )
      ])
    }
  }
]

const fetchBranches = async () => {
  loading.value = true
  const { data, error } = await supabase.from('branches').select('id, name')
  if (error) {
    console.error('fetchBranches error:', error)
  } else {
    branches.value = data || []
  }
  loading.value = false
}

onMounted(fetchBranches)
</script>