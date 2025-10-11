<template>
  <div style="margin-bottom: 16px">
    <n-select
      v-model:value="selectedCompanyId"
      :options="companyOptions"
      placeholder="操作対象の会社を選択"
      :loading="loading"
      clearable
      @update:value="onCompanyChange"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { NSelect } from 'naive-ui'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/lib/supabase'
import { TABLE, ROUTE } from '@/lib/contracts'

const auth = useAuthStore()
const selectedCompanyId = ref<string | null>(auth.companyId ?? null)
const companyOptions = ref<{ label: string; value: string }[]>([])
const loading = ref(false)

async function fetchCompanies () {
  loading.value = true
  const { data, error } = await supabase
    .from(TABLE.companies)
    .select('id, name')
    .order('id', { ascending: true })

  if (error) {
    console.error('会社一覧の取得に失敗しました', error)
  } else {
    companyOptions.value = (data ?? []).map(c => ({
      label: c.name ?? '(名称未設定)',
      value: c.id
    }))
  }
  loading.value = false
}

async function onCompanyChange (companyId: string | null) {
  if (!companyId) return
  await auth.setCompanyId(companyId)
  console.info('company_idを切り替えました:', companyId)
  // 必要なら画面再読み込みやデータ再取得
  // location.reload() や emit('refresh') など
}

onMounted(fetchCompanies)
</script>
