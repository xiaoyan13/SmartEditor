<script setup>
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus';
import request from '../utils/request.js'
import { Eleme } from '@element-plus/icons-vue'

const props = defineProps({
    signal: Boolean
})

const title = '修改配置项'
const show = ref(false);
watch(props, () => {
    show.value = true;
})

const prompts = ref([])
const templates = ref([])
const tips = ref([])

// validate with debounce
let timer = null;
const validate = (str, pos) => {
    if (timer) clearTimeout(timer);
    // validate
    timer = setTimeout(() => {
        const regex = /\{text\}/;
        if (regex.test(str) === false) {
            tips.value[pos] = true
        }else {
            tips.value[pos] = false
        }
    }, 300)
    // use a macro task here, next time `validate` func be called,
    // the `timer` will be true, then be cleared and retime.
}

const loading = ref(false);
const submit = async () => {
    loading.value = true;
    for (const tipStatu of tips.value) {
        if (tipStatu === true) {
            ElMessage.error('请检查 prompt 格式!')
            loading.value = false;
            return;
        }
    }
    try {
        // prompts
        const resp1 = await request.put('/prompt/update_prompts', prompts.value)
        // templates
        const resp2 = await request.put('/prompt/update_templates', templates.value)
        
        if (resp1.code == 200 && resp2.code == 200) {
            ElMessage.success('保存成功')
        }else {
            if (resp1.code != 200) {
                ElMessage.error(resp1.message)
            }
            if (resp2.code != 200) {
                ElMessage.error(resp2.message)
            }
        }
    } catch (error) {
        ElMessage.error(error)
    }
    loading.value = false;
    show.value = false;
}

const init = async () => {
  try {
    // get prompts
    const resp = await request.get('/prompt/user')
    if (resp.code != 200) {
        ElMessage.error('prompts获取失败!')
    }else {
        prompts.value = resp.prompts
        tips.value = Array(prompts.value.length).fill(false)
    }
  } catch (error) {
    ElMessage.error(error)
  }

  try {
    // get templates
    const resp = await request.get('/prompt/user/templates')
    if (resp.code != 200) {
        ElMessage.error('prompts获取失败!')
    }else {
        templates.value = resp.templates
    }
  } catch (error) {
    ElMessage.error(error)
  }
}
init()

</script>


<template>
    <el-dialog v-model="show" :show-close="false" width="70vw">
        <template #header>
            <div class="dialog-title">{{ title }}</div>
        </template>
        <el-scrollbar height="60vh" class="collapses">
            <i class="ri-questionnaire-line"></i>
            <span style="font-weight: 800; font-size: medium;"> tips: 修改完毕后，请点击确认按钮。</span>
            <hr>
            <el-collapse accordion>
                <el-collapse-item title="润色 Prompt 配置">
                    <div>
                        <template v-for="(p, index) of prompts">
                            <div class="prompt" style="position: relative">
                                <h3 style="color: var(--el-color-primary)">{{ p.title }}</h3>
                                <el-input
                                v-model="p.content"
                                @input="(newstring) => validate(newstring, index)"
                                style="width: 99%"
                                :autosize="{ minRows: 3 }"
                                type="textarea"
                                maxlength="400"
                                show-word-limit
                                />
                                <Transition name="fade">
                                    <div v-show="tips[index]" class="invalid-alert">
                                    <i class="ri-error-warning-line"></i>
                                    请保证：输入的内容包含 `{text}` 占位符。
                                    </div>
                                </Transition>
                            </div>
                        </template>
                    </div>
                </el-collapse-item>
                <el-collapse-item title="模板 Prompt 配置">
                    <div class="template-config">
                        <el-collapse accordion>
                            <template v-for="t of templates" :key="t.id">
                                <el-collapse-item>
                                    <template #title>
                                        <h4 style="color: var(--el-color-primary)">{{ t.label }}</h4>
                                    </template>
                                    <template v-for="option of t.options" :key="option.title">
                                        <div class="option">
                                            <h3 style="margin: 0;">{{ option.title }}</h3>
                                            <el-input
                                                v-model="option.prompt"
                                                style="width: 99%"
                                                :autosize="{ minRows: 3 }"
                                                type="textarea"
                                                maxlength="1000"
                                                show-word-limit
                                            />
                                        </div>
                                    </template>
                                </el-collapse-item>
                            </template>
                        </el-collapse>
                    </div>
                </el-collapse-item>
            </el-collapse>
        </el-scrollbar>
        <template #footer>
            <el-button 
            type="primary"
            @click="show = false"
            >
                取消
            </el-button>
            <el-button 
            type="primary" 
            :loading-icon="Eleme" 
            :loading
            @click="submit"
            >
                确认
            </el-button>
        </template>
    </el-dialog>
</template>


<style scoped>
.dialog-title {
    font-weight: 600;
    font-size: 21px;
}

.prompt {
    margin-bottom: 30px;
}

.invalid-alert {
    position: absolute; 
    bottom: -20px;
    color: red;
}

/* 定义渐变动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease; /* 透明度渐变 */
}

.fade-enter,
.fade-leave-to {
  opacity: 0; /* 初始/消失状态 */
}

.collapses {
    padding: 20px;
}

.collapses :deep(.el-collapse-item__header) {
    font-size: large;
    font-weight: 700;
}

.template-config {
    padding-left: 20px;
    .option {
        margin-bottom: 20px;
    }
}

</style>