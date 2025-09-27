<template>
  <div class="p-4">
    <n-card title="拠点詳細">
      <template #header-extra>
        <n-space>
          <n-button @click="goList">一覧へ</n-button>
          <n-button type="primary" @click="goEdit" :disabled="!branch?.id">編集</n-button>
          <n-popconfirm @positive-click="onDelete" :negative-text="'キャンセル'" :positive-text="'削除'">
            <template #trigger>
              <n-button type="error" :disabled="!branch?.id">削除</n-button>
            </template>
            本当に削除しますか？
          </n-popconfirm>
        </n-space>
      </template>

      <n-descriptions label-placement="left" :column="1" bordered>
        <n-descriptions-item label="ID">
          <code>{{ branch?.id }}</code>
        </n-descriptions-item>
        <n-descriptions-item label="拠点名">
          {{ branch?.name || '—' }}
        </n-descriptions-item>
        <n-descriptions-item label="作成日時">
          {{ formatTs(branch?.created_at) }}
        </n-descriptions-item>
        <n-descriptions-item label="更新日時">
          {{ formatTs(branch?.updated_at) }}
        </n-descriptions-item>
      </n-descriptions>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import { supabase } from '@/lib/supabase'

type Branch = {
  id: string
  name: string | null
  created_at?: string | null
  updated_at?: string | null
}

const route = useRoute()
const router = useRouter()
const message = useMessage()

const branchId = route.params.id as string
const branch = ref<Branch | null>(null)

function formatTs(ts?: string | null) {
  if (!ts) return '—'
  try {
    return new Date(ts).toLocaleString()
  } catch {
    return ts
  }
}

async function load() {
  try {
    const { data, error } = await supabase
      .from('branches')
      .select('id, name, created_at, updated_at')
      .eq('id', branchId)
      .single()

    if (error) throw error
    branch.value = data as Branch
  } catch (e: any) {
    console.error('load branch error:', e)
    message.error(e?.message ?? '読み込みに失敗しました')
  }
}

function goList() {
  router.push({ name: 'branch-list' })
}
function goEdit() {
  router.push({ name: 'branch-edit', params: { id: branchId } })
}

async function onDelete() {
  try {
    const { error } = await supabase.from('branches').delete().eq('id', branchId)
    if (error) throw error
    message.success('削除しました')
    goList()
  } catch (e: any) {
    console.error('delete branch error:', e)
    message.error(e?.message ?? '削除に失敗しました')
  }
}

onMounted(load)
</script>

<style scoped>
.p-4 { padding: 1rem; }
</style>
