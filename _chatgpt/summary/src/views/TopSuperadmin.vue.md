## src/views/TopSuperadmin.vue

```vue
<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useCtxStore } from '@/stores/ctx'
import CompanyListPanel from '@/components/lobby/CompanyListPanel.vue'

const router = useRouter()
const ctx = useCtxStore()

function goCompanyLobby(c: { id: string; name?: string }) {
  ctx.setCompany({ id: c.id, name: c.name })
  // 会社が決まったので /branches に遷移（BranchList は companyId を内部で参照）
  router.push({ name: 'branches-short' })
}
</script>

<template>
  <div class="max-w-5xl mx-auto py-8">
    <n-card>
      <div class="flex items-center justify-between mb-3">
        <h1 class="text-xl font-semibold">システム管理者トップ</h1>
        <n-button type="primary" tertiary @click="$router.push({ name: 'company-new' })">
          会社を新規追加
        </n-button>
      </div>
      <CompanyListPanel
        :clickable="true"
        :show-toolbar="true"
        @select="goCompanyLobby"
      />
    </n-card>
  </div>
</template>```

