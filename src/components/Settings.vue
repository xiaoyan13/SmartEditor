<script setup>
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus';
import request from '../utils/request.js'

const props = defineProps({
    signal: Boolean
})

const title = '修改配置项'
const show = ref(false);
watch(props, () => {
    show.value = true;
})

const prompts = ref([])
const tips = ref([])

// validate with debounce
let timer = null;
const validate = (str, pos) => {
    console.log('here')
    if (timer) clearTimeout(timer);
    // validate
    timer = setTimeout(() => {
        const regex = /\{text\}/;
        if (regex.test(str) === false) {
            console.log('here')
            tips.value[pos] = true
        }else {
            tips.value[pos] = false
        }
    }, 300)
    // use a macro task here, next time `validate` func be called,
    // the `timer` will be true, then be cleared and retimingjjjjjjj.
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
        const resp = await request.put('/prompt/update_prompts', prompts.value)
        if (resp.code == 200) {
            ElMessage.success('保存成功')
        }else {
            ElMessage.error(resp.message)
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
    console.log(resp)
    if (resp.code != 200) {
        ElMessage.error('prompts获取失败!')
    }else {
        prompts.value = resp.prompts
        tips.value = Array(prompts.value.length).fill(false)
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
        <el-scrollbar height="60vh">
             <div>
                <h2>Prompt 配置</h2>
                <i class="ri-questionnaire-line"></i>
                tip: 修改完毕后点击确认按钮，以更新修改后的 prompts。
                <hr>
                <template v-for="(p, index) of prompts">
                    <div class="prompt" style="position: relative">
                        <h3>{{ p.title }}</h3>
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
        </el-scrollbar>
        <template #footer>
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

</style>