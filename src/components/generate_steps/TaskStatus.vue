<script setup>
import { onMounted, onUnmounted, ref, watch } from 'vue'
import request from '../../utils/request.js'
import { ElMessage } from 'element-plus'

const props = defineProps({
    config: Object, 
    taskId: String
})

const emit = defineEmits(['searchEnded'])

const task = ref(null)
const search_result = ref('')
const network_RAG_result = ref('')
const local_RAG_search_result = ref('')

// resultWanted: 'search_result' | 'network_RAG_search_result' | 'local_RAG_search_result'
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
        && task.value.search_needed
        && task.value?.search_ready
    ) 
        search_result.value = await getResult('search_result')

    if (!network_RAG_result.value 
        && task.value.network_RAG_search_needed
        && task.value?.network_RAG_search_ready
    )
        network_RAG_result.value = await getResult('network_RAG_search_result')

    //  local_RAG_search_needed should be true, local_RAG_files as well
    if (props.config.local_RAG_files?.length
        && task.value.local_RAG_search_needed
        && !local_RAG_search_result.value 
        && task.value?.local_RAG_search_ready
    ) 
        local_RAG_search_result.value = await getResult('local_RAG_search_result')
    
    if (task.value.search_ended) {
        emit('searchEnded')
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
        // need to be change
        if ((task.value && task.value?.search_ended) || reTrycnt < 0) {
            // 心跳机制将保证一直发送请求，直到响应无效 reTrycnt 次，或者 search_ended == True。
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
    <div>
        <el-collapse class="main" v-model="activeNames">
            <el-collapse-item v-if="task?.search_needed" name="search_result">
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
            <el-collapse-item v-if="task?.network_RAG_search_needed" name="networking_RAG">
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
            <el-collapse-item v-if="task?.local_RAG_search_needed && config.local_RAG_files?.length" name="local_RAG">
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