## src/views/BranchLobby.vue

```vue
<script setup lang="ts">

import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import CareLogListPanel from '@/components/lobby/CareLogListPanel.vue'

const route = useRoute()
const router = useRouter()

const branchId = computed(() => route.params.branchId as string)

function goCareLogDetail(row: { id: string }) {
  router.push({ name: 'care-log-detail', params: { id: row.id } })
}
</script>

<template>
  <div class="max-w-5xl mx-auto py-8">
    <n-card>
      <div class="flex items-center justify-between mb-3">
        <h1 class="text-xl font-semibold">
          ブランチロビー（ケアログ）
          <span class="text-gray-500 text-base ml-2">branch_id={{ branchId }}</span>
        </h1>
        <n-button type="primary" tertiary @click="$router.push({ name: 'care-log-new' })">
          新規ケアログ
        </n-button>
      </div>

      <CareLogListPanel
        :branch-id="branchId"
        :clickable="true"
        :show-toolbar="true"
        @select="goCareLogDetail"
      />
    </n-card>
  </div>
</template>```

