## src/components/lobby/CareLogListPanel.vue

```vue
<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { fromCare } from '@/lib/supabase'
import { TABLE } from '@/lib/contracts'

type Props = {
  branchId?: string
  clickable?: boolean
  showToolbar?: boolean
}
const props = withDefaults(defineProps<Props>(), {
  clickable: false,
  showToolbar: false
})

const loading = ref(false)
const items = ref<any[]>([])

const hasFilter = computed(() => !!props.branchId)

async function loadLogs() {
  loading.value = true
  try {
    let q = fromCare(TABLE.careLogs)
      .select('id, date, title, summary, tags, branch_id, user_id, staff_id')
      .order('date', { ascending: false })
      .limit(100)

    if (props.branchId) q = q.eq('branch_id', props.branchId)

    const { data, error } = await q
    if (error) throw error
    items.value = data ?? []
  } finally {
    loading.value = false
  }
}

onMounted(loadLogs)
watch(() => props.branchId, loadLogs)

const emit = defineEmits<{
  (e: 'select', row: any): void
}>()

function clickRow(row: any) {
  if (props.clickable) emit('select', row)
}
</script>

<template>
  <div class="flex flex-col gap-3">
    <div v-if="showToolbar" class="flex items-center justify-between">
      <div class="text-sm text-gray-500">
        ケアログ一覧
        <span v-if="hasFilter" class="ml-2">（branch_id={{ branchId }}）</span>
      </div>
      <slot name="toolbar-right" />
    </div>

    <n-spin :show="loading">
      <n-empty v-if="!loading && items.length === 0" description="該当するケアログがありません" />

      <div v-else class="grid gap-3">
        <n-card
          v-for="log in items"
          :key="log.id"
          class="cursor-pointer"
          :class="{'hover:shadow': clickable}"
          @click="clickRow(log)"
        >
          <div class="flex items-center justify-between">
            <div class="font-medium">
              {{ log.title || '（無題）' }}
            </div>
            <div class="text-sm text-gray-500">
              {{ log.date }}
            </div>
          </div>

          <div v-if="log.summary" class="mt-1 text-gray-700 text-sm">
            {{ log.summary }}
          </div>

          <div v-if="Array.isArray(log.tags) && log.tags.length" class="mt-2 flex flex-wrap gap-6">
            <div
              v-for="t in log.tags"
              :key="t"
              class="text-[12px] text-gray-600"
            >
              <span class="inline-block align-middle mr-1">#</span>{{ t }}
            </div>
          </div>
        </n-card>
      </div>
    </n-spin>
  </div>
</template>

<style scoped>
.hover\:shadow:hover { box-shadow: 0 8px 24px rgba(0,0,0,0.08); }
</style>```

