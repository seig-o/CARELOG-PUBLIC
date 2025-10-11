<!-- src/views/companies/CompanyUpsert.vue -->
<template>
  <div class="p-4">
    <n-card :title="isEdit ? '会社編集' : '会社新規'">
      <n-form :model="form" :rules="rules" label-width="90">
        <n-form-item label="会社名" path="name">
          <n-input v-model:value="form.name" placeholder="例）株式会社コムレイド" />
        </n-form-item>
        <n-form-item label="カナ" path="kana">
          <n-input v-model:value="form.kana" placeholder="例）カブシキガイシャコムレイド" />
        </n-form-item>
        <n-form-item label="代表者" path="daihyo">
          <n-input v-model:value="form.daihyo" placeholder="例）山田 太郎" />
        </n-form-item>
        <n-form-item label="所在地" path="addr">
          <n-input v-model:value="form.addr" placeholder="例）松本市大字島立3803-1" />
        </n-form-item>
        <n-form-item label="電話" path="tel">
          <n-input v-model:value="form.tel" placeholder="例）0263-88-3906" />
        </n-form-item>

        <n-space>
          <n-button type="primary" :loading="saving" @click="onSave">
            {{ isEdit ? '更新' : '作成' }}
          </n-button>
          <n-button quaternary :disabled="saving" @click="goList">一覧へ戻る</n-button>
        </n-space>
      </n-form>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import { supabase } from '@/lib/supabase'
import { TABLE } from '@/lib/contracts'

const route = useRoute()
const router = useRouter()
const message = useMessage()

const companyId = computed(() => route.params.companyId as string | undefined)
const isEdit = computed(() => !!companyId.value)

const form = reactive({
  name: '',
  kana: '',
  daihyo: '',
  addr: '',
  tel: ''
})

const rules = {
  name: { required: true, message: '会社名を入力してください', trigger: 'blur' }
}

const saving = ref(false)

async function load() {
  if (!isEdit.value) return
  const { data, error } = await supabase
    .from(TABLE.companies)
    .select('id, name, kana, daihyo, addr, tel')
    .eq('id', companyId.value)
    .maybeSingle()
  if (error) {
    console.error('[CompanyUpsert] load error:', error)
    message.error('会社情報の取得に失敗しました')
    return
  }
  if (data) {
    form.name = data.name ?? ''
    form.kana = data.kana ?? ''
    form.daihyo = data.daihyo ?? ''
    form.addr = data.addr ?? ''
    form.tel = data.tel ?? ''
  }
}

async function onSave() {
  // 多重送信防止
  if (saving.value) return
  try {
    saving.value = true

    if (isEdit.value) {
      // UPDATE: representation を要求しない（.select() を付けない）
      const { error: updErr } = await supabase
        .from(TABLE.companies)
        .update({
          name: form.name,
          kana: form.kana,
          daihyo: form.daihyo,
          addr: form.addr,
          tel: form.tel,
          updated_at: new Date().toISOString()
        })
        .eq('id', companyId.value)

      // PGRST116 対策：仮にどこかで &select=* が付いても成功として扱う
      if (updErr && updErr.code !== 'PGRST116') {
        throw updErr
      }

      message.success('更新しました')
    } else {
      // INSERT: IDが不要なら representation は要求しない
      const { error: insErr } = await supabase
        .from(TABLE.companies)
        .insert({
          name: form.name,
          kana: form.kana,
          daihyo: form.daihyo,
          addr: form.addr,
          tel: form.tel
        })
      if (insErr && insErr.code !== 'PGRST116') {
        throw insErr
      }
      message.success('作成しました')
    }

    goList()
  } catch (e: any) {
    console.error('[CompanyUpsert] save error:', e)
    message.error(e?.message ?? '保存に失敗しました')
  } finally {
    saving.value = false
  }
}

function goList() {
  router.push({ name: 'company-list' })
}

onMounted(load)
</script>

<style scoped>
.p-4 { padding: 1rem; }
</style>