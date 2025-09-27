<template>
  <div class="p-4">
    <n-card title="利用者詳細">
      <n-descriptions bordered :column="1">
        <n-descriptions-item label="氏名">{{ user?.name }}</n-descriptions-item>
        <n-descriptions-item label="メール">{{ user?.email || '（未設定）' }}</n-descriptions-item>
        <n-descriptions-item label="ロール">{{ user?.role }}</n-descriptions-item>
        <n-descriptions-item label="作成日時">{{ user?.created_at }}</n-descriptions-item>
        <n-descriptions-item label="更新日時">{{ user?.updated_at }}</n-descriptions-item>
      </n-descriptions>

      <template #footer>
        <n-space justify="end">
          <n-button @click="goList">一覧に戻る</n-button>
          <n-button type="primary" @click="goEdit">編集</n-button>
        </n-space>
      </template>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'

import { supabase } from '@/lib/supabase'
import { TABLE, ROUTE } from '@/lib/contracts'

const route = useRoute()
const router = useRouter()
const message = useMessage()

const user = ref<any>(null)

async function load() {
  const id = route.params.id as string
  const { data, error } = await supabase
    .from(TABLE.users)
    .select('*')
    .eq('id', id)
    .single()
  if (error) {
    message.error(error.message)
    return
  }
  user.value = data
}

function goList() {
  router.push({ name: ROUTE.user.list })
}

function goEdit() {
  router.push({ name: ROUTE.user.edit, params: { id: route.params.id } })
}

onMounted(load)
</script>

<style scoped>
.p-4 { padding: 1rem; }
</style>