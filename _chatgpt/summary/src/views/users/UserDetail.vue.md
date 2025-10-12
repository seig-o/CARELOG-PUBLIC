## src/views/users/UserDetail.vue

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fromCare } from '@/lib/supabase'
import { TABLE } from '@/lib/contracts'
import {
  NCard, NDescriptions, NDescriptionsItem, NTag, NEmpty, NSpin,
  NButton, NSpace, NDivider, NImage
} from 'naive-ui'

type User = {
  id: string
  name: string | null
  kana?: string | null
  birthdate?: string | null
  sex?: string | null
  phone?: string | null
  address?: string | null
  emergency_contact_name?: string | null
  emergency_contact_relation?: string | null
  emergency_contact_phone?: string | null
  allergies?: string[] | null
  diagnoses?: string[] | null
  medications?: string | null
  care_level?: string | null
  care_insurance_id?: string | null
  physician_name?: string | null
  physician_clinic?: string | null
  physician_phone?: string | null
  diet?: string | null
  swallowing_caution?: string | null
  fall_risk?: boolean | null
  dementia_stage?: string | null
  mobility?: string | null
  adl_notes?: string | null
  preferences?: string | null
  communication_notes?: string | null
  photo_url?: string | null
  created_at?: string
  updated_at?: string
}

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const user = ref<User | null>(null)

onMounted(fetchDetail)

async function fetchDetail () {
  loading.value = true
  try {
    const id = String(route.params.id)
    const { data, error } = await fromCare(TABLE.users)
      .select(`
        id, name, kana, birthdate, sex,
        phone, address,
        emergency_contact_name, emergency_contact_relation, emergency_contact_phone,
        allergies, diagnoses, medications,
        care_level, care_insurance_id,
        physician_name, physician_clinic, physician_phone,
        diet, swallowing_caution,
        fall_risk, dementia_stage,
        mobility, adl_notes,
        preferences, communication_notes,
        photo_url,
        created_at, updated_at
      `)
      .eq('id', id)
      .single()
    if (error) throw error
    user.value = data as User
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

function goEdit () {
  if (!user.value?.id) return
  router.push({ name: 'user-edit', params: { id: user.value.id } })
}
</script>

<template>
  <div class="max-w-4xl">
    <n-card>
      <div class="flex items-center justify-between mb-2">
        <h1 class="text-lg font-semibold">利用者プロフィール</h1>
        <n-space>
          <n-button tertiary @click="$router.push({ name: 'user-list' })">一覧へ</n-button>
          <n-button type="primary" :disabled="!user" @click="goEdit">編集</n-button>
        </n-space>
      </div>

      <n-spin :show="loading">
        <template v-if="user">
          <!-- 画像 -->
          <div class="mb-4">
            <n-image
              v-if="user.photo_url"
              :src="user.photo_url"
              width="120"
              height="120"
              :preview-disabled="false"
              class="rounded-xl object-cover"
            />
          </div>

          <!-- 基本情報 -->
          <n-divider>基本情報</n-divider>
          <n-descriptions label-placement="left" bordered :column="2">
            <n-descriptions-item label="氏名">{{ user.name || '—' }}</n-descriptions-item>
            <n-descriptions-item label="カナ">{{ user.kana || '—' }}</n-descriptions-item>
            <n-descriptions-item label="生年月日">{{ user.birthdate || '—' }}</n-descriptions-item>
            <n-descriptions-item label="性別">{{ user.sex || '—' }}</n-descriptions-item>
          </n-descriptions>

          <!-- 連絡先 -->
          <n-divider>連絡先</n-divider>
          <n-descriptions label-placement="left" bordered :column="2">
            <n-descriptions-item label="電話">{{ user.phone || '—' }}</n-descriptions-item>
            <n-descriptions-item label="住所"><div class="whitespace-pre-wrap">{{ user.address || '—' }}</div></n-descriptions-item>
          </n-descriptions>

          <!-- 緊急連絡先 -->
          <n-divider>緊急連絡先</n-divider>
          <n-descriptions label-placement="left" bordered :column="2">
            <n-descriptions-item label="氏名">{{ user.emergency_contact_name || '—' }}</n-descriptions-item>
            <n-descriptions-item label="続柄">{{ user.emergency_contact_relation || '—' }}</n-descriptions-item>
            <n-descriptions-item label="電話">{{ user.emergency_contact_phone || '—' }}</n-descriptions-item>
          </n-descriptions>

          <!-- 医療情報 -->
          <n-divider>医療情報</n-divider>
          <n-descriptions label-placement="left" bordered :column="1">
            <n-descriptions-item label="アレルギー">
              <div v-if="(user.allergies?.length ?? 0) > 0" class="flex flex-wrap gap-2">
                <n-tag v-for="(t, i) in user.allergies" :key="i" round>{{ t }}</n-tag>
              </div>
              <n-empty v-else description="なし" size="small" />
            </n-descriptions-item>
            <n-descriptions-item label="既往・診断名">
              <div v-if="(user.diagnoses?.length ?? 0) > 0" class="flex flex-wrap gap-2">
                <n-tag v-for="(d, i) in user.diagnoses" :key="i" round>{{ d }}</n-tag>
              </div>
              <n-empty v-else description="未登録" size="small" />
            </n-descriptions-item>
            <n-descriptions-item label="内服・処方">
              <div class="whitespace-pre-wrap">{{ user.medications || '—' }}</div>
            </n-descriptions-item>
          </n-descriptions>

          <!-- 介護保険 -->
          <n-divider>介護保険</n-divider>
          <n-descriptions label-placement="left" bordered :column="2">
            <n-descriptions-item label="要介護区分">{{ user.care_level || '—' }}</n-descriptions-item>
            <n-descriptions-item label="被保険者番号">{{ user.care_insurance_id || '—' }}</n-descriptions-item>
          </n-descriptions>

          <!-- 主治医 -->
          <n-divider>主治医</n-divider>
          <n-descriptions label-placement="left" bordered :column="2">
            <n-descriptions-item label="氏名">{{ user.physician_name || '—' }}</n-descriptions-item>
            <n-descriptions-item label="医療機関">{{ user.physician_clinic || '—' }}</n-descriptions-item>
            <n-descriptions-item label="電話">{{ user.physician_phone || '—' }}</n-descriptions-item>
          </n-descriptions>

          <!-- 食事・嚥下 -->
          <n-divider>食事・嚥下</n-divider>
          <n-descriptions label-placement="left" bordered :column="2">
            <n-descriptions-item label="食形態">{{ user.diet || '—' }}</n-descriptions-item>
            <n-descriptions-item label="嚥下注意点"><div class="whitespace-pre-wrap">{{ user.swallowing_caution || '—' }}</div></n-descriptions-item>
          </n-descriptions>

          <!-- リスク・認知 -->
          <n-divider>リスク・認知</n-divider>
          <n-descriptions label-placement="left" bordered :column="2">
            <n-descriptions-item label="転倒リスク">{{ user.fall_risk ? 'あり' : (user.fall_risk === false ? 'なし' : '—') }}</n-descriptions-item>
            <n-descriptions-item label="認知症ステージ">{{ user.dementia_stage || '—' }}</n-descriptions-item>
          </n-descriptions>

          <!-- 生活・ADL -->
          <n-divider>生活・ADL</n-divider>
          <n-descriptions label-placement="left" bordered :column="1">
            <n-descriptions-item label="移動・補助具など"><div class="whitespace-pre-wrap">{{ user.mobility || '—' }}</div></n-descriptions-item>
            <n-descriptions-item label="ADLメモ"><div class="whitespace-pre-wrap">{{ user.adl_notes || '—' }}</div></n-descriptions-item>
          </n-descriptions>

          <!-- 好み・配慮 -->
          <n-divider>好み・配慮</n-divider>
          <n-descriptions label-placement="left" bordered :column="1">
            <n-descriptions-item label="好み・NG"><div class="whitespace-pre-wrap">{{ user.preferences || '—' }}</div></n-descriptions-item>
            <n-descriptions-item label="伝達・配慮事項"><div class="whitespace-pre-wrap">{{ user.communication_notes || '—' }}</div></n-descriptions-item>
          </n-descriptions>

          <!-- システム -->
          <n-divider>システム</n-divider>
          <n-descriptions label-placement="left" bordered :column="2">
            <n-descriptions-item label="作成日時">{{ user.created_at || '—' }}</n-descriptions-item>
            <n-descriptions-item label="更新日時">{{ user.updated_at || '—' }}</n-descriptions-item>
            <n-descriptions-item label="ID">{{ user.id }}</n-descriptions-item>
          </n-descriptions>
        </template>

        <n-empty v-else description="データが見つかりません" class="py-8" />
      </n-spin>
    </n-card>
  </div>
</template>```

