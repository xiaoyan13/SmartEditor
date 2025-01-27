<script setup>
import { ref } from 'vue'
import CommonConfig from './CommonConfig.vue'
import request from '../../utils/request.js'
import { ElMessage } from 'element-plus'
import TaskStatus from './TaskStatus.vue'
import CommonEditor from '../CommonEditor.vue'
import { useUserStore } from '@/stores/userStore'
import router from "../../router/index.js";

const userStore = useUserStore()

const props = defineProps({
    articleConfig: Object,
    preTaskResult: String,
    currentStep: Number
})

const emit = defineEmits(['preStep', 'nextStep', 'updateNowTasks'])

const userInput = ref(props.preTaskResult)
const preprocessInput = () => {
    if (props.currentStep > 0) { // 如果不是第一步
        userInput.value += "\n\n我将基于此大纲生成文章.";
    }
}
preprocessInput()

const commonConfigRef = ref()

// varible for STEP 1
const articleTitle = ref(props.articleConfig.article_prompt.title)
const configPromptStr = ref(props.articleConfig.article_prompt.content)


const searchHasRan = ref(false) // control the <TaskStatus> show or not
const taskId = ref()
const taskResult = ref()
const taskDone = ref(false) // control the <next-step> show or not

const step1StartArticleRequest = async () => {
    const config = props.articleConfig;
    // send start generating request to backend
    if (!configPromptStr.value.length) {
        ElMessage.error('Prompt 不能为空！')
        return
    }

    // update prompt to backend
    const promptId = config.article_prompt.id;
    const resp = await request.put(`/article_generate/change_prompt/${promptId}`, {
        title: articleTitle.value,
        content: configPromptStr.value
    })
    if (resp.code == 200) {
        ElMessage.success('Prompt保存成功！')
    }else {
        ElMessage.error('Prompt 保存失败')
    }
    // create new task and run
    const configId = config.id;
    const taskResp = await request.post(`/article_generate/create_generate_task/${configId}/1`, {
        "article_title": articleTitle.value,
        "search_needed": commonConfigRef.value.search_needed,
        "network_RAG_search_needed": commonConfigRef.value.network_RAG_search_needed,
        "local_RAG_search_needed": commonConfigRef.value.local_RAG_search_needed,
    });
    if (taskResp.code == 200) {
        ElMessage.success('搜索开始运行');
        // update to new task id
        taskId.value = taskResp["task_id"];
        searchHasRan.value = true;
        emit('updateNowTasks')
    }else {
        ElMessage.error(taskResp.message)
    }
}

const step2StartArticleRequest = async () => {
    const config = props.articleConfig;
    // create new task and run
    const configId = config.id;
    const taskResp = await request.post(`/article_generate/create_generate_task/${configId}/2`, {
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

// similiar to step2, just copy and modify some varibles
const step3StartArticleRequest = async () => {
    const config = props.articleConfig;
    // create new task and run
    const configId = config.id;
    const taskResp = await request.post(`/article_generate/create_generate_task/${configId}/3`, {
        "user_input": userInput.value,
        "search_needed": commonConfigRef.value.search_needed,
        "network_RAG_search_needed": commonConfigRef.value.network_RAG_search_needed,
        "local_RAG_search_needed": commonConfigRef.value.local_RAG_search_needed,
    });
    if (taskResp.code == 200) {
        ElMessage.success('搜索开始运行');
        // update to new task id
        taskId.value = taskResp["task_id"];
        searchHasRan.value = true;
        emit('updateNowTasks')
    }else {
        ElMessage.error(taskResp.message)
    }
}

const startArticleRequest = async () => {
    if (props.currentStep == 0)
        await step1StartArticleRequest();
    else if (props.currentStep == 1)
        await step2StartArticleRequest();
    else
        await step3StartArticleRequest()
}

const startArticleGenerate = async () => {
    if (taskResult.value) {
        // if generation has done, return directly
        return;
    }

    try {
        const response = await fetch(`/api/article_generate/task/result_gen/${taskId.value}/generate_document`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${userStore.token}`
            },
        });
        if (!response.ok) {
            throw new Error('网络响应不正常');
        }
        ElMessage.success('开始文章生成...')
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
        commonConfigRef.value.search_needed = task.search_needed
        commonConfigRef.value.network_RAG_search_needed = task.network_RAG_search_needed
        commonConfigRef.value.local_RAG_search_needed = task.local_RAG_search_needed
            if (task.step_n == 2 || task.step_n == 3) {
            // 如果是 step2/ step3, 则还需渲染 user_input
            userInput.value = task.user_input
        }
    }
}

const towardsEditView = async () => {
    const loadingInstance = ElLoading.service({
        fullscreen: true,
        text: "正在新建文档...",
    });
    try {
        const response = await request.post('/document', { 
            title: articleTitle.value, 
            content: documentResult.value 
        });
        if (response.code == 200) {
            ElMessage.success('新建文档成功!');
            router.push({ name: 'edit', params: { id: response.id } });
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
            <el-input
                v-model="userInput"
                :autosize="{ minRows: 4 }"
                type="textarea"
                placeholder="🌱请输入用于生成文章的提示词。"
                maxlength="1000"
                show-word-limit
            />
        </div>
        <div class="inputs" v-else>
            <div class="article-title-input">
                <span style="margin-right: 35px;">Title:</span>
                <el-input
                v-model="articleTitle"
                placeholder="🐼请输入文章标题(可选)..."
                />
            </div>
            <div class="article-prompt-input">
                <span style="margin-right: 10px; margin-top: 6px;">Prompt:</span>
                <el-input
                    v-model="configPromptStr"
                    :autosize="{ minRows: 4 }"
                    type="textarea"
                    placeholder="🌱请输入用于生成文章的提示词。"
                    maxlength="1000"
                    show-word-limit
                />
            </div>
        </div>
        <CommonConfig ref="commonConfigRef" />
        <div class="prompt-operate">
            <el-button @click="startArticleRequest" :disabled="searchHasRan">开始任务</el-button>
        </div>
        <TaskStatus
        v-if="searchHasRan"
        :config="articleConfig" 
        :task-id="taskId"
        @search-ended="startArticleGenerate" />
        <CommonEditor v-if="taskResult" v-model="taskResult" />
        <div class="change-view" v-if="taskDone">
            <el-button @click="emit('preStep')">上一步</el-button>
            <el-button 
                v-if="articleConfig.step_by_step == 3" 
                @click="towardsEditView"
            >
                存为文档编辑
            </el-button>
            <el-button v-else @click="emit('nextStep', taskResult)">下一步</el-button>
        </div>
    </div>
</template>


<style scoped>
.container {
    margin: 0 4%;

    .user-input {
        font-weight: bold;
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
            margin:15px 5px;
        }
    }
}

.change-view {
    display: flex;
    justify-content: end;
    align-items: center;
    margin: 20px 0;
}
</style>