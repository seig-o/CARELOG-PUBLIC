## src/components/lobby/CompanyListPanel.vue

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { fromCare } from '@/lib/supabase'
import { TABLE } from '@/lib/contracts'
import { useMessage } from 'naive-ui'

type Company = { id: string; name: string | null; status?: string | null; created_at?: string | null; updated_at?: string | null }

const props = defineProps<{
  clickable?: boolean
  showToolbar?: boolean
}>()

const emit = defineEmits<{
  (e: 'select', row: Company): void
}>()

const message = useMessage()
const loading = ref(false)
const items = ref<Company[]>([])
const q = ref('')

async function load() {
  loading.value = true
  try {
    const { data, error } = await fromCare(TABLE.companies)
      .select('id, name, status, created_at, updated_at')
      .order('name', { ascending: true })
    if (error) throw error
    items.value = data ?? []
  } catch (e:any) {
    console.error(e)
    message.error(e?.message ?? '会社一覧の取得に失敗しました')
  } finally {
    loading.value = false
  }
}

const filtered = computed(() => {
  const kw = q.value.trim()
  if (!kw) return items.value
  return items.value.filter(c =>
    (c.name ?? '').includes(kw) || (c.id ?? '').includes(kw)
  )
})

function onRowClick(c: Company) {
  if (!props.clickable) return
  emit('select', c)
}

onMounted(load)
</script>

<template>
  <div>
    <div v-if="showToolbar" class="flex items-center justify-between mb-3">
      <div class="text-lg font-semibold">会社一覧</div>
      <n-input v-model:value="q" placeholder="会社名 / ID" clearable style="width: 240px" />
    </div>

    <n-spin :show="loading">
      <div v-if="!loading && filtered.length === 0" class="text-gray-500 py-8 text-center">
        会社がありません
      </div>
      <div v-else class="divide-y">
        <div
          v-for="c in filtered" :key="c.id"
          class="py-3 flex items-center justify-between hover:bg-gray-50 rounded transition cursor-pointer"
          @click="onRowClick(c)"
        >
          <div class="min-w-0">
            <div class="text-base font-medium text-blue-600 hover:underline">
              {{ c.name || c.id }}
            </div>
            <div class="text-xs text-gray-500 truncate">ID: {{ c.id }}</div>
          </div>
          <div class="flex items-center gap-3">
            <n-tag :type="(c.status || 'active') === 'active' ? 'success' : 'warning'">
              {{ c.status || 'active' }}
            </n-tag>
            <div class="text-xs text-gray-400 hidden sm:block">
              更新: {{ (c.updated_at || '').slice(0,16).replace('T',' ') }}
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

