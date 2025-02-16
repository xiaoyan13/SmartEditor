<script setup>
import { ref, watch } from 'vue'
import CommonConfig from './CommonConfig.vue'
import request from '../../utils/request.js'
import { ElMessage } from 'element-plus'
import TaskStatus from './TaskStatus.vue'
import CommonEditor from '../CommonEditor.vue'
import { useUserStore } from '@/stores/userStore'

const userStore = useUserStore()

const props = defineProps({
    articleConfig: Object
})

const emit = defineEmits(['nextStep', 'updateNowTasks'])

const commonConfigRef = ref()

const articleTitle = ref(props.articleConfig.article_prompt.title)
const configPromptStr = ref(props.articleConfig.article_prompt.content)
const stepPromptStr = ref(props.articleConfig.steps[0].prompt)
const searchHasRan = ref(false) // control the <TaskStatus> show or not
const searchViewPrinted = ref(false) // <TaskStatus> done, all searchs' results have been gained.
const taskId = ref()
const taskResult = ref()
const taskDone = ref(false) // control the <next-step> show or not
const canRestartTask = ref(false) // re-generate button
const controller = ref(null); // AbortController

const startComprehendRequest = async () => {
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
        "model_used": commonConfigRef.value.gpt,
        "search_engine": commonConfigRef.value.search_engine,
        "search_needed": commonConfigRef.value.search_needed,
        "network_RAG_search_needed": commonConfigRef.value.network_RAG_search_needed,
        "local_RAG_search_needed": commonConfigRef.value.local_RAG_search_needed,
    });
    if (taskResp.code == 200) {
        ElMessage.success('任务开始运行');
        // update to new task id
        taskId.value = taskResp["task_id"];
        searchHasRan.value = commonConfigRef.value.search_needed || commonConfigRef.value.local_RAG_search_needed || commonConfigRef.value.network_RAG_search_needed
        if (searchHasRan.value == false) {
            // 如果不需要搜索，则直接开始生成
            startComprehendGenerate()
        }else {
            // 否则，等到搜索组件渲染完毕（这意味着所有搜索已经完成），再开始生成
            watch(searchViewPrinted, () => startComprehendGenerate(), { once: true });
        }
        emit('updateNowTasks')
    }else {
        ElMessage.error(taskResp.message)
    }
}

const startComprehendGenerate = async () => {
    canRestartTask.value = true

    try {
        const response = await fetch(`/api/article_generate/task/result_gen/${taskId.value}/comprehend_task`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${userStore.token}`
            },
        });
        if (!response.ok) {
            throw new Error('网络响应不正常');
        }
        ElMessage.success('开始任务理解...')
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

const reGenerate = async () => {
    taskDone.value = false

    // 如果已有 controller，先取消之前的请求
    if (controller.value) {
        controller.value.abort();
        ElMessage.warning('上次请求已终止...');
    }
    // 创建新的 AbortController
    controller.value = new AbortController();
    const signal = controller.value.signal;
    try {
        const response = await fetch(`/api/article_generate/task/result_gen/${taskId.value}/comprehend_task/regenerate`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${userStore.token}`
            },
            signal
        });
        if (!response.ok) {
            throw new Error('网络响应不正常');
        }
        ElMessage.success('重新开始任务理解...')
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
        if (error.name === 'AbortError') {
            console.log('请求已被取消');
        } else {
            ElMessage.error(error.message);
        }
    }finally {
        controller.value = null;
    }
}

// init this component's task view state
const initTaskState = async (task) => {
    if (task) {
        taskId.value = task.id
        searchHasRan.value = task.search_needed || task.local_RAG_search_needed || task.network_RAG_search_needed
        if (task.generate_status == 'done') {
            taskDone.value = true;
        }
        // Result generating process
        // console.log(task)
        taskResult.value = task.task_result
        canRestartTask.value = true
        // check status of the component
        commonConfigRef.value.gpt = task.model_used
        commonConfigRef.value.search_engine = task.search_engine_used
        commonConfigRef.value.search_needed = task.search_needed
        commonConfigRef.value.network_RAG_search_needed = task.network_RAG_search_needed
        commonConfigRef.value.local_RAG_search_needed = task.local_RAG_search_needed
    }
}

defineExpose({
    initTaskState
})
</script>


<template>
    <div class="container">
        <div class="inputs">
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
                    placeholder="🌱请输入用于描述文章的提示词。"
                    maxlength="1000"
                    show-word-limit
                />
            </div>
        </div>
        <CommonConfig ref="commonConfigRef" />
        <div class="step-input">
            <span style="margin-top: 6px; width: 100px;">{{ articleConfig.steps[0].title }}:</span>
            <el-input
                v-model="stepPromptStr"
                :autosize="{ minRows: 10 }"
                type="textarea"
                :placeholder="`🌱请输入生成${ articleConfig.steps[0].title }的提示词。`"
                maxlength="1000"
                show-word-limit
            />
        </div>
        <div class="prompt-operate">
            <el-button @click="startComprehendRequest" v-if="!canRestartTask">开始任务</el-button>
            <el-button @click="reGenerate" v-else>重新开始任务</el-button>
        </div>
        <TaskStatus
        v-if="searchHasRan"
        :config="articleConfig" 
        :task-id="taskId"
        @search-ended="searchViewPrinted = true"
        />
        <CommonEditor v-if="taskResult" v-model="taskResult" />
        <div class="next-step" v-if="taskDone">
            <el-button @click="emit('nextStep', taskResult)">下一步</el-button>
        </div>
    </div>
</template>


<style scoped>
.container {
    margin: 0 4%;

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

    .step-input {
        margin-bottom: 20px;
        margin-right: 10px;
        display: flex;
        font-weight: bold;
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

.next-step {
    display: flex;
    justify-content: end;
    align-items: center;
    margin: 20px 0;
}
</style>