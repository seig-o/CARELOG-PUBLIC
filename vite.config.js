import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';
// 追加プラグイン
import Components from 'unplugin-vue-components/vite';
import AutoImport from 'unplugin-auto-import/vite';
import { NaiveUiResolver } from 'unplugin-vue-components/resolvers';
export default defineConfig(function (_a) {
    var command = _a.command;
    var isBuild = command === 'build';
    return {
        base: isBuild ? '/DEV/comrade/CARELOG/admin/' : '/', // ★ devは'/'、buildは'/DEV/comrade/CARELOG/admin/'
        plugins: [
            vue(),
            // Naive UI コンポーネント自動インポート
            Components({
                dts: 'src/components.d.ts',
                resolvers: [NaiveUiResolver()]
            }),
            // Naive UI の Composables (useMessage 等) も自動インポート
            AutoImport({
                dts: 'src/auto-imports.d.ts',
                resolvers: [NaiveUiResolver()],
                imports: [
                    'vue', // ref, reactive, computed, onMounted など
                    'vue-router' // useRouter, useRoute 等
                ]
            })
        ],
        resolve: {
            alias: { '@': path.resolve(__dirname, 'src') }
        }
    };
});
