<!-- src/views/companies/CompanyList.vue -->
<template>
  <div class="p-4">
    <n-card title="会社一覧">
      <template #header-extra>
        <n-button type="primary" @click="goNew">新規追加</n-button>
      </template>

      <n-data-table
        :columns="columns"
        :data="rows"
        :loading="loading"
        :pagination="pagination"
        :bordered="false"
      />
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { h, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { NButton, useMessage } from 'naive-ui'
import { supabase } from '@/lib/supabase'
import { TABLE, ROUTE } from '@/lib/contracts'

const router = useRouter()
const message = useMessage()

const rows = ref<any[]>([])
const loading = ref(false)

const pagination = {
  pageSize: 20,
  showSizePicker: false,
}

const columns = [
  { title: 'ID', key: 'id', width: 300 },
  { title: '会社名', key: 'name', width: 260 },
  { title: 'カナ', key: 'kana', width: 220 },
  { title: '代表者', key: 'daihyo', width: 160 },
  { title: '電話', key: 'tel', width: 140 },
  {
    title: '操作',
    key: 'actions',
    width: 220,
    render (row: any) {
      return h('div', { class: 'flex gap-2' }, [
        h(
          NButton,
          {
            size: 'small',
            onClick: () => router.push({ name: 'company-detail', params: { companyId: row.id } })
          },
          { default: () => '詳細' }
        ),
        h(
          NButton,
          {
            size: 'small',
            type: 'primary',
            onClick: () => router.push({ name: 'company-edit', params: { companyId: row.id } })
          },
          { default: () => '編集' }
        )
      ])
    }
  }
]

async function load() {
  loading.value = true
  try {
    // 今回は安全最小で必要カラムだけ
    const { data, error } = await supabase
      .from(TABLE.companies)
      .select('id, name, kana, daihyo, tel')
      .order('name', { ascending: true })
    if (error) throw error
    rows.value = data ?? []
  } catch (e: any) {
    console.error('[CompanyList] fetch error:', e)
    message.error(e?.message ?? '会社一覧の取得に失敗しました')
  } finally {
    loading.value = false
  }
}

function goNew() {
  router.push({ name: ROUTE.company.new })
}

onMounted(load)
</script>

<style scoped>
.p-4 { padding: 1rem; }
.flex { display: flex; }
.gap-2 { gap: 0.5rem; }
</style>