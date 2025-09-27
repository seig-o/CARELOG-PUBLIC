<template>
  <div class="p-4">
    <n-card title="利用者一覧">
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
  { title: 'ID', key: 'id', width: 80 },
  { title: '氏名', key: 'name', width: 200 },
  { title: 'メールアドレス', key: 'email', width: 220 },
  { title: 'ロール', key: 'role', width: 100 },
  {
    title: '操作',
    key: 'actions',
    width: 200,
    render (row: any) {
      return h('div', { class: 'flex gap-2' }, [
        h(
          NButton,
          {
            size: 'small',
            onClick: () => router.push({ name: ROUTE.user.detail, params: { id: row.id } })
          },
          { default: () => '詳細' }
        ),
        h(
          NButton,
          {
            size: 'small',
            type: 'primary',
            onClick: () => router.push({ name: ROUTE.user.edit, params: { id: row.id } })
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
    const { data, error } = await supabase
      .from(TABLE.users)
      .select('id, name, email, role')
      .order('created_at', { ascending: false })
    if (error) throw error
    rows.value = data || []
  } catch (e: any) {
    message.error(e?.message ?? '利用者一覧の取得に失敗しました')
  } finally {
    loading.value = false
  }
}

function goNew() {
  router.push({ name: ROUTE.user.new })
}

onMounted(load)
</script>

<style scoped>
.p-4 { padding: 1rem; }
.flex { display: flex; }
.gap-2 { gap: 0.5rem; }
</style>