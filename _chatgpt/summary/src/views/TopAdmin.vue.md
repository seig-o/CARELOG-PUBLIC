## src/views/TopAdmin.vue

```vue
<!-- TopAdmin.vue -->
<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import BranchListPanel from '@/components/lobby/BranchListPanel.vue'

import { useCtxStore } from '@/stores/ctx'
const ctx = useCtxStore()

const router = useRouter()
const route = useRoute()

// companyId があればその会社に属するブランチのみを表示（なければ全件）
const companyId = computed(() => (route.query.companyId as string | undefined) || undefined)

function goBranchLobby(b: { id: string; name?: string }) {
  // companyId はパネル側で渡せるなら付ける。無ければ ctx.company?.id を補完
  ctx.setBranch({ id: b.id, companyId: ctx.company?.id, name: b.name })
  router.push({ name: 'care-logs-short' })
}
</script>

<template>
  <div class="max-w-5xl mx-auto py-8">
    <n-card>
      <div class="flex items-center justify-between mb-3">
        <h1 class="text-xl font-semibold">
          管理者トップ（ブランチ一覧）
          <span v-if="companyId" class="ml-2 text-gray-500 text-base">
            company_id={{ companyId }}
          </span>
        </h1>
        <n-button type="primary" tertiary @click="$router.push({ name: 'branch-new' })">
          拠点を新規追加
        </n-button>
      </div>

      <BranchListPanel
        :company-id="companyId"
        :clickable="true"
        :show-toolbar="true"
        @select="goBranchLobby"
      />
    </n-card>
  </div>
</template>```

