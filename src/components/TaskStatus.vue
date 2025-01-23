<script setup>
import { onMounted, onUnmounted, ref, watch } from 'vue'
import request from '../utils/request.js'
import { ElMessage } from 'element-plus'
import CommonEditor from './CommonEditor.vue'

const props = defineProps({
    config: Object, 
    taskId: String
})

const emit = defineEmits(['documentReady', 'startGenerationByOutline'])

const task = ref(null)
const search_result = ref('')
const network_RAG_result = ref('')
const local_RAG_search_result = ref('')
const outline_result = ref('')
const document_result = ref('')

// resultWanted: 'search_result' | 'network_RAG_search_result' | 'local_RAG_search_result' | 'document_str'
const getResult = async (resultWanted) => {
    const resp = await request.get(`/article_generate/task/${props.taskId}/${resultWanted}`)
    if (resp.code == 200) {
        return resp[resultWanted]
    }else {
        ElMessage.error(resp.message)
    }
}

const activeNames = ref([])
// Refreshing result timely
const fetchResults = async () => {
    if (!search_result.value 
        && task.value?.search_ready
    ) 
        search_result.value = await getResult('search_result')

    if (props.config.networking_RAG 
        && !network_RAG_result.value 
        && task.value?.network_RAG_search_ready
    )
        network_RAG_result.value = await getResult('network_RAG_search_result')

    //  local_RAG should be true, local_RAG_files as well
    if (props.config.local_RAG 
        && props.config.local_RAG_files
        && task.value?.local_RAG_search_ready
        && !local_RAG_search_result.value 
    ) 
        local_RAG_search_result.value = await getResult('local_RAG_search_result')

    // if step_by_step is False, fetch document will be automatically carried out.
    if (!props.config.step_by_step) {
        if (!document_result.value && task.value?.document_ready) {
            // emit the document ready to do fetch
            emit('documentReady')
        }
    }else {
    // Otherwise, fetch outline of the document.
        if (!outline_result.value && task.value?.outline_ready) {
            outline_result.value = await(getResult('outline_result'))
            // reinforce the outline collapse-item to be unfold
            activeNames.value = ['outline_result']
        }
            
    }
}

const getTaskStatus = async () => {
    const resp = await request.get(`/article_generate/get_task_by_id/${props.taskId}`)
    if (resp.code == 200) {
        if (!resp.task) {
            return false
        }else {
            task.value = resp.task
            // 每次拿到最新的状态后，根据状态获取结果
            fetchResults()
            return true
        }
    }else {
        ElMessage.error(resp.message)
        return false
    }
}

let reTrycnt = 6
let intervalId = null;
const setupTimer = () => {
    intervalId = setInterval(async () => {
        if ((task.value && task.value?.outline_ready || task.value?.document_ready) || reTrycnt < 0) {
            // 心跳机制将保证一直发送请求，直到响应无效 reTrycnt 次，或者 outline_ready/document_ready == True。
            clearInterval(intervalId)
        }else {
            const res = await getTaskStatus()
            if (res == false) {
                reTrycnt--;
            }
        }
    }, 1000);
}

const cleanTimer = () => {
    if (intervalId){
        clearInterval(intervalId);
    }
}

onMounted(() => setupTimer())
onUnmounted(() => cleanTimer())

const articleGenerating = () => {
    emit('startGenerationByOutline', outline_result.value);
    activeNames.value = []
}

// these signs are controlled by father component
const generatingByOutline = ref(false)
const regenerateNeeded = ref(false)
defineExpose({
    generatingByOutline,
    regenerateNeeded,
})
</script>


<template>
    <div>
        <el-collapse class="main" v-model="activeNames">
            <el-collapse-item name="search_result">
                <template #title>
                    <div class="title">
                        <div>网络搜索</div>
                        <el-icon v-if="task?.search_ready" style="color: greenyellow"><SuccessFilled /></el-icon>
                        <img v-else src="@/assets/images/loading.gif" alt="loading" />
                    </div>
                </template>
                <el-main v-loading="!task?.search_ready">
                    {{ search_result }}
                </el-main>
            </el-collapse-item>
            <el-collapse-item v-if="config.networking_RAG" name="networking_RAG">
                <template #title>
                    <div class="title">
                        <div>远程 RAG 检索</div>
                        <el-icon v-if="task?.network_RAG_search_ready" style="color: greenyellow"><SuccessFilled /></el-icon>
                        <img v-else src="@/assets/images/loading.gif" alt="loading" />
                    </div>
                </template>
                <el-main v-loading="!task?.network_RAG_search_ready">
                    {{ network_RAG_result }}
                </el-main>
            </el-collapse-item>
            <el-collapse-item v-if="config.local_RAG && config.local_RAG_files" name="local_RAG">
                <template #title>
                    <div class="title">
                        <div>本地 RAG 检索</div>
                        <el-icon v-if="task?.local_RAG_search_ready" style="color: greenyellow"><SuccessFilled /></el-icon>
                        <img v-else src="@/assets/images/loading.gif" alt="loading" />
                    </div>
                </template>
                <el-main v-loading="!task?.local_RAG_search_ready">
                    {{ local_RAG_search_result }}
                </el-main>
            </el-collapse-item>
            <el-collapse-item v-if="config?.step_by_step" name="outline_result">
                <template #title>
                    <div class="title">
                        <div>生成大纲</div>
                        <el-icon v-if="task?.outline_ready" style="color: greenyellow;"><SuccessFilled /></el-icon>
                        <img v-else src="@/assets/images/loading.gif" alt="loading" />
                    </div>
                </template>
                <el-main v-loading="!task?.outline_ready">
                    <CommonEditor v-model="outline_result" />
                    <div class="genreate-article-button">
                        <el-button @click="articleGenerating" :disabled="generatingByOutline" v-if="regenerateNeeded === false">🖊️生成文章</el-button>
                        <el-button @click="articleGenerating" :disabled="generatingByOutline" v-else>🖊️重新生成</el-button>
                    </div>
                </el-main>
            </el-collapse-item>
        </el-collapse>
    </div>
</template>


<style scoped>
.main {
    margin: 1%;
    .title {
        display: flex;  
        align-items: center;
        font-size: 18px;
        font-weight: 700;

        i {
            margin-left: 8px;
        }

        img {
            margin-left: 8px;
            width: 20px;
            margin-top: 2px;
        }
    }

    .genreate-article-button {
        display: flex;
        justify-content: center;
        align-items: center;
        .el-button {
            color: white;
            background: var(--el-color-primary);
            width: 80%;
        }
    }
}
</style>