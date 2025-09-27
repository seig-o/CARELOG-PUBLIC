<template>
  <div>
    <n-space justify="space-between" style="margin-bottom: 16px;">
      <n-button type="primary" @click="goNew">新規スタッフ追加</n-button>
      <n-input v-model:value="search" placeholder="名前で検索" clearable style="width: 200px;" />
    </n-space>

    <n-data-table
      :columns="columns"
      :data="filteredStaffs"
      :pagination="pagination"
      :bordered="false"
    />
  </div>
</template>

<script setup lang="ts">
import { h, ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { NButton, NDataTable, NSpace, NInput } from 'naive-ui'
import { supabase } from '@/lib/supabase'

const router = useRouter()
const staffs = ref<any[]>([])
const search = ref('')

const columns = [
  { title: '名前', key: 'name' },
  { title: 'メール', key: 'email' },
  { title: '役割', key: 'role' },
  {
    title: '操作',
    key: 'actions',
    render (row: any) {
      return h('div', {}, [
        h(
          NButton,
          {
            size: 'small',
            onClick: () => router.push({ name: 'staff-detail', params: { id: row.id } })
          },
          { default: () => '詳細' }
        ),
        h(
          NButton,
          {
            size: 'small',
            style: 'margin-left: 8px;',
            onClick: () => router.push({ name: 'staff-edit', params: { id: row.id } })
          },
          { default: () => '編集' }
        )
      ])
    }
  }
]

const pagination = { pageSize: 10 }

const filteredStaffs = computed(() => {
  if (!search.value) return staffs.value
  return staffs.value.filter((s) =>
    s.name.toLowerCase().includes(search.value.toLowerCase())
  )
})

async function fetchStaffs () {
  const { data, error } = await supabase
    .from('v_staff_with_branches')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('スタッフ一覧の取得エラー:', error)
  } else {
    staffs.value = data || []
  }
}

function goNew () {
  router.push({ name: 'staff-new' })
}

onMounted(fetchStaffs)
</script>