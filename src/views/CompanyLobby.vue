<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import BranchListPanel from '@/components/lobby/BranchListPanel.vue'

const route = useRoute()
const router = useRouter()
const companyId = route.params.companyId as string

function handleSelect(b: { id: string }) {
  router.push({ name: 'branch-lobby', params: { branchId: b.id } })
}
</script>

<template>
  <div class="max-w-5xl mx-auto py-8">
    <n-card>
      <BranchListPanel
        :company-id="companyId"
        :clickable="true"
        :show-toolbar="true"
        title="拠点一覧（会社ロビー）"
        @select="handleSelect"
      />
    </n-card>
  </div>
</template>