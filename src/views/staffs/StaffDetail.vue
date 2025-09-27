<template>
  <div class="p-4">
    <NCard title="スタッフ詳細">
      <template #header-extra>
        <NSpace>
          <NButton @click="goList">一覧へ</NButton>
          <NButton type="primary" @click="goEdit" :disabled="!staff?.id">編集</NButton>
          <NPopconfirm @positive-click="onDelete" :negative-text="'キャンセル'" :positive-text="'削除'">
            <template #trigger>
              <NButton type="error" :disabled="!staff?.id">削除</NButton>
            </template>
            本当に削除しますか？
          </NPopconfirm>
        </NSpace>
      </template>

      <NDescriptions label-placement="left" :column="1" bordered>
        <NDescriptionsItem label="ID">
          <code>{{ staff?.id }}</code>
        </NDescriptionsItem>

        <NDescriptionsItem label="氏名">
          {{ staff?.name || '—' }}
        </NDescriptionsItem>

        <NDescriptionsItem label="メールアドレス">
          {{ staff?.email || '—' }}
        </NDescriptionsItem>

        <NDescriptionsItem label="ロール">
          <NTag v-if="staff?.role" size="small">{{ staff?.role }}</NTag>
          <template v-else>—</template>
        </NDescriptionsItem>

        <NDescriptionsItem label="ログイン連携 (auth_user_id)">
          <code v-if="staff?.auth_user_id">{{ staff?.auth_user_id }}</code>
          <template v-else>—</template>
        </NDescriptionsItem>

        <NDescriptionsItem label="所属拠点">
          <NSpace wrap>
            <NTag v-for="b in branches" :key="b.id" size="small">{{ b.name }}</NTag>
            <span v-if="branches.length === 0">—</span>
          </NSpace>
        </NDescriptionsItem>

        <NDescriptionsItem label="作成日時">
          {{ formatTs(staff?.created_at) }}
        </NDescriptionsItem>

        <NDescriptionsItem label="更新日時">
          {{ formatTs(staff?.updated_at) }}
        </NDescriptionsItem>
      </NDescriptions>
    </NCard>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  NCard,
  NSpace,
  NButton,
  NPopconfirm,
  NDescriptions,
  NDescriptionsItem,
  NTag,
  useMessage
} from 'naive-ui'
import { supabase } from '@/lib/supabase'

type StaffViewRow = {
  id: string
  name: string | null
  email: string | null
  role: 'admin' | 'manager' | 'staff' | null
  auth_user_id: string | null
  created_at?: string | null
  updated_at?: string | null
  branches_json?: Array<{ id: string; name: string }> | null
}

type Branch = { id: string; name: string }

const route = useRoute()
const router = useRouter()
const message = useMessage()

const staffId = route.params.id as string
const staff = ref<StaffViewRow | null>(null)
const branches = ref<Branch[]>([])

function formatTs(ts?: string | null) {
  if (!ts) return '—'
  try {
    return new Date(ts).toLocaleString()
  } catch {
    return ts || '—'
  }
}

async function load() {
  try {
    // v_staff_with_branches（public）から一括取得
    const { data, error } = await supabase
      .from('v_staff_with_branches')
      .select('id,name,email,role,auth_user_id,created_at,updated_at,branches_json')
      .eq('id', staffId)
      .single()

    if (error) throw error

    staff.value = data as StaffViewRow
    branches.value = (data?.branches_json ?? []) as Branch[]
  } catch (e: any) {
    message.error(e?.message ?? '読み込みに失敗しました')
  }
}

function goList() {
  router.push({ name: 'staff-list' })
}

function goEdit() {
  router.push({ name: 'staff-edit', params: { id: staffId } })
}

async function onDelete() {
  try {
    // 一貫性維持：中間 → 本体 の順に削除
    const { error: e1 } = await supabase
      .from('staff_branch_memberships')
      .delete()
      .eq('staff_id', staffId)
    if (e1) throw e1

    const { error: e2 } = await supabase
      .from('staffs')
      .delete()
      .eq('id', staffId)
    if (e2) throw e2

    message.success('削除しました')
    goList()
  } catch (e: any) {
    message.error(e?.message ?? '削除に失敗しました')
  }
}

onMounted(load)
</script>

<style scoped>
.p-4 { padding: 1rem; }
</style>