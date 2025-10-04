<template>
  <div class="p-4">
    <n-card title="拠点詳細">
      <template #header-extra>
        <n-space>
          <n-button @click="goList">一覧へ</n-button>
          <n-button type="primary" :disabled="!branch?.id" @click="goEdit">編集</n-button>
          <n-popconfirm
            :negative-text="'キャンセル'"
            :positive-text="'削除'"
            @positive-click="onDelete"
          >
            <template #trigger>
              <n-button type="error" :disabled="!branch?.id">削除</n-button>
            </template>
            本当に削除しますか？
          </n-popconfirm>
        </n-space>
      </template>

      <n-spin :show="loading">
        <template v-if="branch">
          <n-descriptions
            bordered
            label-placement="left"
            :column="2"
            class="mb-4"
          >
            <n-descriptions-item label="ID">
              <code>{{ branch.id }}</code>
            </n-descriptions-item>
            <n-descriptions-item label="会社ID">
              <code v-if="branch.company_id">{{ branch.company_id }}</code>
              <span v-else>—</span>
            </n-descriptions-item>

            <n-descriptions-item label="拠点名">
              {{ branch.name || '—' }}
            </n-descriptions-item>
            <n-descriptions-item label="状態">
              <n-tag :type="statusTagType(branch.status)">{{ branch.status ?? '—' }}</n-tag>
            </n-descriptions-item>

            <n-descriptions-item label="作成日時">
              {{ formatTs(branch.created_at) }}
            </n-descriptions-item>
            <n-descriptions-item label="更新日時">
              {{ formatTs(branch.updated_at) }}
            </n-descriptions-item>
          </n-descriptions>
        </template>
        <template v-else>
          <n-empty description="データが見つかりませんでした" />
        </template>
      </n-spin>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import { supabase } from '@/lib/supabase'
import { TABLE, ROUTE } from '@/lib/contracts'

type Branch = {
  id: string
  name: string | null
  company_id?: string | null
  status?: string | null
  created_at?: string | null
  updated_at?: string | null
}

const route = useRoute()
const router = useRouter()
const message = useMessage()

const branch = ref<Branch | null>(null)
const loading = ref(false)
const branchId = computed(() => route.params.id as string)

function formatTs (ts?: string | null) {
  if (!ts) return '—'
  const d = new Date(ts)
  return d.toLocaleString('ja-JP', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  })
}

function statusTagType (status?: string | null) {
  const s = (status || '').toLowerCase()
  if (s === 'active') return 'success'
  if (s === 'inactive' || s === 'disabled') return 'warning'
  return 'default'
}

async function load () {
  loading.value = true
  try {
    // company_id / status は存在すれば拾う。無ければ undefined のまま（画面は '—' 表示）
    const { data, error } = await supabase
      .from(TABLE.branches)
      .select('id,name,company_id,status,created_at,updated_at')
      .eq('id', branchId.value)
      .maybeSingle()

    if (error) throw error
    if (!data) {
      message.warning('拠点が見つかりませんでした')
      return
    }
    branch.value = data as Branch
  } catch (e: any) {
    console.error('[BranchDetail] load error:', e)
    message.error(e?.message ?? '読み込みに失敗しました')
  } finally {
    loading.value = false
  }
}

function goList () {
  router.push({ name: ROUTE.branches.name.list })
}
function goEdit () {
  router.push({ name: ROUTE.branches.name.edit, params: { id: branchId.value } })
}

async function onDelete () {
  try {
    const { error } = await supabase.from(TABLE.branches).delete().eq('id', branchId.value)
    if (error) throw error
    message.success('削除しました')
    goList()
  } catch (e: any) {
    console.error('[BranchDetail] delete error:', e)
    message.error(e?.message ?? '削除に失敗しました')
  }
}

onMounted(load)
</script>

<style scoped>
.p-4 { padding: 1rem; }
.mb-4 { margin-bottom: 1rem; }
</style>