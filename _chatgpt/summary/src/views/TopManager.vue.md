## src/views/TopManager.vue

```vue
<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
import CareLogListPanel from '@/components/lobby/CareLogListPanel.vue'

const router = useRouter()
const route = useRoute()
const branchId = (route.query.branchId as string) || undefined

function goDetail(r: { id: string }) {
  router.push({ name: 'care-log-detail', params: { id: r.id } })
}
</script>

<template>
  <div class="max-w-5xl mx-auto py-8">
    <n-card>
      <div class="flex items-center justify-between mb-3">
        <h1 class="text-xl font-semibold">現場責任者トップ</h1>
        <n-button type="primary" tertiary @click="$router.push({ name: 'care-log-new' })">新規ケアログ</n-button>
      </div>
      <CareLogListPanel :branch-id="branchId" :clickable="true" :show-toolbar="true" @select="goDetail" />
    </n-card>
  </div>
</template>```

