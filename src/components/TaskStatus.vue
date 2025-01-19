<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import request from '../utils/request.js'
import { ElMessage } from 'element-plus'

const props = defineProps({
    config: Object, 
    taskId: String
})

const task = ref(null)
const search_result = ref('')
const network_RAG_result = ref('')
const local_RAG_search_result = ref('')
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

const fetchResults = () => {
    if (props.config.step_by_step) {
        if (!search_result.value 
            && task.value?.search_ready
        ) 
            search_result.value = getResult('search_result')
        if (props.config.networking_RAG 
            && !network_RAG_result.value 
            && task.value?.network_RAG_search_ready
        )
            network_RAG_result.value = getResult('network_RAG_search_result')
        if (props.config.local_RAG 
            && !local_RAG_search_result.value 
            && task.value?.local_RAG_search_ready
        ) 
            local_RAG_search_result.value = getResult('local_RAG_search_result')
    }
    if (!document_result.value && task.value?.document_ready)
        document.value = getResult('document_str')
}

const getTaskStatus = async () => {
    const resp = await request.get(`/article_generate/get_task_by_id/${props.taskId}`)
    if (resp.code == 200) {
        if (!resp.task) {
            return false
        }else {
            task.value = resp.task
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
    // 心跳机制将保证一直发送请求，直到响应无效 reTrycnt 次，或者成功。
    intervalId = setInterval(async () => {
        if ((task.value && task.value.document_ready) || reTrycnt < 0) {
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

</script>


<template>
    <div v-if="config.step_by_step">
        <el-collapse class="main">
            <el-collapse-item>
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
            <el-collapse-item v-if="config.networking_RAG">
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
            <el-collapse-item v-if="config.local_RAG">
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
            
            <div v-if="task?.document_ready">
                {{ document_result }}
            </div>
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
}
</style>