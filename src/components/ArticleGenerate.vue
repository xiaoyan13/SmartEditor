<script setup>
import { ref } from 'vue'
import request from '../utils/request.js'
import TaskStatus from './TaskStatus.vue'
import { ElMessage, ElLoading } from "element-plus";
import CommonEditor from './CommonEditor.vue'
import router from "../router/index.js";
import { useUserStore } from '@/stores/userStore.js';

const userStore = useUserStore()

const config = ref()
const configPromptStr = ref('')
const articleTitle = ref('')
const taskRunning  = ref(false) // For now, taskRunning just determines <TaskStatus> rendered or not
const taskId = ref()

const keyForReflush = ref(1)
const refreshTaskStatusComponent = () => keyForReflush.value++
// @change
const changeTask = async () => {
    // change task prompt
    configPromptStr.value = config.value.article_prompt.content
    // get the task's status and then render them
    const configId = config.value.id
    const resp = await request.get(`/article_generate/get_task_by_config/${configId}`)
    if (resp.code == 200) {
        const tasks = resp["tasks"]
        if (tasks.length == 0) {
            taskRunning.value = false
        }else {
            taskRunning.value = true
            taskId.value = tasks[0].id
            refreshTaskStatusComponent() // Relfush task display component
        }
    }else {
        ElMessage.error('获取配置相关任务失败！')
    }
}

const headerLoading = ref(false)
const headerOptions = ref([])
// get article configs
const remoteMethod = async (query) => {
  if (query) {
    headerLoading.value = true

    const resp = await request.get('/article_generate/get_configs');
    if (resp.code == 200) {
        headerOptions.value = resp["configs"]
    }else {
        ElMessage.error(resp.message)
    }

    headerLoading.value = false
  } else {
    headerOptions.value = []
  }
}

// send start generating request to backend
const startGeneratingRequest = async () => {
    if (!configPromptStr.value.length) {
        ElMessage.error('Prompt 不能为空！')
        return
    }

    // update prompt to backend
    const promptId = config.value.article_prompt.id;
    const resp = await request.put(`/article_generate/change_prompt/${promptId}`, {
        content: configPromptStr.value
    })
    if (resp.code == 200) {
        ElMessage.success('Prompt保存成功！')
    }else {
        ElMessage.error('Prompt 保存失败')
    }
    // create new task and run
    const configId = config.value.id;
    const taskResp = await request.post(`/article_generate/create_generate_task/${configId}`, {
        "article_title": articleTitle.value
    });
    if (taskResp.code == 200) {
        ElMessage.success('任务开始运行');
        // update to new task id
        taskId.value = taskResp["task_id"];
        // render <TaskStatus>
        taskRunning.value = true;
    }else {
        ElMessage.error(taskResp.message)
    }
}

// Feature todo: add button to stop article generation. 
const endGeneratingDisabled = ref(true)
const endGenerating = () => {
    taskRunning.value = false;
}

const documentResult = ref('')
const regenerateDoc = async () => {
    // send generating request
    await startGeneratingRequest()
    // refresh task status and clear document generated.
    refreshTaskStatusComponent()
    documentResult.value = ''
}

const documentId = ref()
const towardsEditView = async () => {
    if (documentId.value) {
        router.push({ name: 'edit', params: { id: response.id } });
        return;
    }

    const loadingInstance = ElLoading.service({
        fullscreen: true,
        text: "正在新建文档...",
    });
    try {
        const response = await request.post('/document', { title: articleTitle.value, content: documentResult.value });
        if (response.code == 200) {
        ElMessage.success('新建文档成功!');
        documentId.value = response.id;
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

const documentReady = async () => {
    try {
        const response = await fetch(`/api/article_generate/task/${taskId.value}/generate_document`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${userStore.token}`
            },
        });
        if (!response.ok) {
            throw new Error('网络响应不正常');
        }
        ElMessage.success('开始生成文章...')
        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let receivedText = '';
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const decodedValue = decoder.decode(value, { stream: true });
            receivedText += decodedValue;
            documentResult.value = receivedText;
        }
    } catch (error) {
        ElMessage.error(error.message);
    }
}

const taskStatusRef = ref()
const generatingByOutline = async (outline) => {
    // start generation
    taskStatusRef.value.generatingByOutline = true
    try {
        const response = await fetch(`/api/article_generate/task/${taskId.value}/generate_doc_by_outline`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${userStore.token}`
            },
            body: JSON.stringify({ outline }),
        });
        if (!response.ok) {
            throw new Error('网络响应不正常');
        }
        ElMessage.success('开始根据大纲生成文章...')
        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let receivedText = '';
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const decodedValue = decoder.decode(value, { stream: true });
            receivedText += decodedValue;
            documentResult.value = receivedText;
        }
    } catch (error) {
        ElMessage.error(error.message);
    }
    taskStatusRef.value.generatingByOutline = false
    taskStatusRef.value.regenerateNeeded = true
}


</script>


<template>
    <div class="article-generation">
        <div class="header">
            <el-select
                v-model="config"
                filterable
                remote
                placeholder="请输入整文配置的名称..."
                :remote-method="remoteMethod"
                :loading="headerLoading"
                @change="changeTask"
            >
                <el-option
                v-for="item in headerOptions"
                :key="item.id"
                :label="item.title"
                :value="item"
                />
            </el-select>
        </div>
        <div v-if="config?.id" class="container">
            <h2 style="color: var(--el-color-primary);">📰 {{ config?.title }}</h2>
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
                        placeholder="🌱请输入用于生成文章的提示词。"
                        maxlength="1000"
                        show-word-limit
                    />
                </div>
                <div class="prompt-operate">
                    <el-button @click="configPromptStr = ''">清空</el-button>
                    <el-button @click="startGeneratingRequest" :disabled="taskRunning">开始生成</el-button>
                    <!-- todo -->
                    <!-- <el-button @click="endGenerating" :disabled="endGeneratingDisabled">停止生成</el-button> -->
                </div>
            </div>
            <div v-if="taskRunning" class="status-display">
                <TaskStatus 
                    ref="taskStatusRef"
                    :config="config" 
                    :task-id="taskId" 
                    :key="keyForReflush"
                    @document-ready="documentReady"
                    @start-generation-by-outline="generatingByOutline"
                />
            </div>
            <div v-if="documentResult">
                <CommonEditor v-model="documentResult" />
                <div class="document-operate-buttons">
                    <el-button @click="regenerateDoc">重新生成</el-button>
                    <el-button @click="towardsEditView">存为文档编辑</el-button>
                </div>
            </div>
        </div>
    </div>
</template>


<style scoped>
.article-generation {
    margin: 10px 20px;
    margin-bottom: 100px;
    .header {
        margin: 20px 10px;
    }

    .inputs {
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

        .prompt-operate {
            display: flex;
            justify-content: end;
            align-items: center;
            button {
                margin: 20px 5px;
            }
        }
    }
}

.document-operate-buttons {
    display: flex;
    justify-content: end;
    align-items: center;
}

</style>