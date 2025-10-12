## src/components/lobby/BranchListPanel.vue

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { fromCare } from '@/lib/supabase'
import { TABLE } from '@/lib/contracts'
import { useMessage } from 'naive-ui'

type Branch = { id: string; name: string | null; status?: string | null; phone?: string | null; address?: string | null; company_id?: string | null; updated_at?: string | null }

const props = defineProps<{
  companyId?: string | null
  clickable?: boolean
  showToolbar?: boolean
  title?: string
}>()

const emit = defineEmits<{
  (e: 'select', row: Branch): void
}>()

const message = useMessage()
const loading = ref(false)
const items = ref<Branch[]>([])
const q = ref('')

async function load() {
  loading.value = true
  try {
    let query = fromCare(TABLE.branches)
      .select('id, name, status, phone, address, company_id, updated_at')

    if (props.companyId) {
      query = query.eq('company_id', props.companyId)
    }

    const { data, error } = await query.order('name', { ascending: true })
    if (error) throw error
    items.value = data ?? []
  } catch (e:any) {
    console.error(e)
    message.error(e?.message ?? '拠点一覧の取得に失敗しました')
  } finally {
    loading.value = false
  }
}

const filtered = computed(() => {
  const kw = q.value.trim()
  if (!kw) return items.value
  return items.value.filter(b =>
    (b.name ?? '').includes(kw) ||
    (b.address ?? '').includes(kw) ||
    (b.phone ?? '').includes(kw)
  )
})

function onRowClick(b: Branch) {
  if (!props.clickable) return
  emit('select', b)
}

onMounted(load)
</script>

<template>
  <div>
    <div v-if="showToolbar" class="flex items-center justify-between mb-3">
      <div class="text-lg font-semibold">{{ title || '拠点一覧' }}</div>
      <n-input v-model:value="q" placeholder="拠点名 / 住所 / 電話" clearable style="width: 260px" />
    </div>

    <n-spin :show="loading">
      <div v-if="!loading && filtered.length === 0" class="text-gray-500 py-8 text-center">
        該当する拠点がありません
      </div>

      <div v-else class="divide-y">
        <div
          v-for="b in filtered" :key="b.id"
          class="py-3 flex items-start justify-between gap-4 hover:bg-gray-50 rounded transition cursor-pointer"
          @click="onRowClick(b)"
        >
          <div class="min-w-0">
            <div class="text-base font-medium text-blue-600 hover:underline">
              {{ b.name || '(名称未設定)' }}
            </div>
            <div class="text-xs text-gray-500 truncate">ID: {{ b.id }}</div>
            <div class="text-xs text-gray-500 truncate">住所: {{ b.address || '—' }} / 電話: {{ b.phone || '—' }}</div>
          </div>
          <div class="flex items-center gap-3 shrink-0">
            <n-tag :type="(b.status || 'active') === 'active' ? 'success' : 'warning'">
              {{ b.status || 'active' }}
            </n-tag>
            <div class="text-xs text-gray-400 hidden sm:block">
              更新: {{ (b.updated_at || '').slice(0, 16).replace('T', ' ') }}
            </div>
          </div>
        </div>
      </div>
    </n-spin>
  </div>
</template>

<style scoped>
.divide-y > * + * { border-top: 1px solid rgba(0,0,0,0.06); }
</style>```

