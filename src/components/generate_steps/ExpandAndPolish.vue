<script setup>
import { ref } from 'vue'
import CommonConfig from './CommonConfig.vue'
import request from '../../utils/request.js'
import { ElMessage, ElLoading } from 'element-plus'
import TaskStatus from './TaskStatus.vue'
import CommonEditor from '../CommonEditor.vue'
import { useUserStore } from '@/stores/userStore'
import router from "../../router/index.js";

const userStore = useUserStore()

const props = defineProps({
    articleConfig: Object,
    preTaskResult: String
})

const emit = defineEmits(['preStep', 'nextStep', 'updateNowTasks'])

const userInput = ref(props.preTaskResult)

const commonConfigRef = ref()

const articleTitle = ref(props.articleConfig.article_prompt.title)
const searchHasRan = ref(false) // control the <TaskStatus> show or not
const taskId = ref()
const taskResult = ref()
const taskDone = ref(false) // control the <next-step> show or not

const StartPolishRequest = async () => {
    const config = props.articleConfig;
    // create new task and run
    const configId = config.id;
    const taskResp = await request.post(`/article_generate/create_generate_task/${configId}/4`, {
        "user_input": userInput.value,
        "search_needed": commonConfigRef.value.search_needed,
        "network_RAG_search_needed": commonConfigRef.value.network_RAG_search_needed,
        "local_RAG_search_needed": commonConfigRef.value.local_RAG_search_needed,
    });
    if (taskResp.code == 200) {
        ElMessage.success('任务开始运行');
        // update to new task id
        taskId.value = taskResp["task_id"];
        searchHasRan.value = true;
        emit('updateNowTasks')
    }else {
        ElMessage.error(taskResp.message)
    }
}

const startPolishGenerate = async () => {
    if (taskResult.value) {
        // if generation has done, return directly
        return;
    }

    try {
        const response = await fetch(`/api/article_generate/task/result_gen/${taskId.value}/expand_document`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${userStore.token}`
            },
        });
        if (!response.ok) {
            throw new Error('网络响应不正常');
        }
        ElMessage.success('开始文章扩写...')
        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let receivedText = '';
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const decodedValue = decoder.decode(value, { stream: true });
            receivedText += decodedValue;
            taskResult.value = receivedText;
        }
        taskDone.value = true;
    } catch (error) {
        ElMessage.error(error.message);
    }
}

// init this component's task view state
const initTaskState = (task) => {
    if (task) {
        // 如果已有 task 对应此视图, 则渲染它：
        taskId.value = task.id
        searchHasRan.value = true
        if (task.generate_status == 'done') {
            taskDone.value = true;
        }
        // Result generating process
        taskResult.value = task.task_result
        // check status of the component
        commonConfigRef.value.gpt = task.model_used
        commonConfigRef.value.search_engine = task.search_engine_used
        commonConfigRef.value.search_needed = task.search_needed
        commonConfigRef.value.network_RAG_search_needed = task.network_RAG_search_needed
        commonConfigRef.value.local_RAG_search_needed = task.local_RAG_search_needed

        userInput.value = task.user_input
    }
}


const clearAllTasksByConfig = async () => {
    const configId = props.articleConfig.id;
    await request.delete(`/article_generate/del_all_tasks/${configId}`);
}

const towardsEditView = async () => {
    const loadingInstance = ElLoading.service({
        fullscreen: true,
        text: "正在新建文档...",
    });
    try {
        const response = await request.post('/document', { 
            title: articleTitle.value, 
            content: taskResult.value || userInput.value
        });
        if (response.code == 200) {
            ElMessage.success('新建文档成功!');
            router.push({ name: 'edit', params: { id: response.id } });
            clearAllTasksByConfig();
        } else {
            ElMessage.error(response.message);
        }
    } catch (error) {
        ElMessage.error(error);
    } finally {
        loadingInstance.close();
    }
}

defineExpose({
    initTaskState
})
</script>


<template>
    <div class="container">
        <div class="user-input" v-if="userInput">
            <h3>将扩写以下文章：</h3>
            <CommonEditor v-model="userInput" />
        </div>
        <CommonConfig ref="commonConfigRef" />
        <div class="prompt-operate">
            <el-button @click="StartPolishRequest" :disabled="searchHasRan">
                <i class="ri-sparkling-2-line" style="margin-right: 5px;" />
                开始扩写文章
            </el-button>
        </div>
        <TaskStatus
        v-if="searchHasRan"
        :config="articleConfig" 
        :task-id="taskId"
        @search-ended="startPolishGenerate" />
        <CommonEditor v-if="taskResult" v-model="taskResult" />
        <div class="change-view">
            <el-button @click="emit('preStep')">上一步</el-button>
            <el-button @click="towardsEditView">存为文档编辑</el-button>
        </div>
    </div>
</template>


<style scoped>
.container {
    margin: 0 4%;

    .user-input {
        margin-top: 30px;
        margin-right: 10px;
    }

    .inputs {
        margin-top: 30px;
        .article-prompt-input {
            display: flex;
            font-weight: bold;
            margin-right: 10px;
        }

        .article-title-input {
            margin-top: 10px;
            margin-bottom: 20px;
            margin-right: 10px;
            display: flex;
            align-items: center;
            font-weight: bold;
        }
    }

    .prompt-operate {
        display: flex;
        justify-content: end;
        align-items: center;
        button {
            margin:5px 5px;
        }
    }
}

.change-view {
    display: flex;
    justify-content: end;
    align-items: center;
    margin: 20px 5px;
}
</style>