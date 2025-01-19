<script setup>
import { ref } from 'vue'
import request from '../utils/request.js'
import TaskStatus from './TaskStatus.vue'
import { ElMessage } from 'element-plus'

const headerLoading = ref(false)
const headerOptions = ref([])

const config = ref()
const configPromptStr = ref('')
const taskRunning  = ref(false)
const taskId = ref()

// @change
const changeTask = async () => {
    // change task prompt
    configPromptStr.value = config.value.article_prompt.content
    // get the task's status and render
    const configId = config.value.id
    const resp = await request.get(`/article_generate/get_task_by_config/${configId}`)
    if (resp.code == 200) {
        const tasks = resp["tasks"]
        if (tasks.length == 0) {
            taskRunning.value = false
        }else {
            taskRunning.value = true
            taskId.value = tasks[0].id
            reflushTaskComponent() // Relfush task display component
        }
    }else {
        ElMessage.error('获取配置相关任务失败！')
    }
}

let keyForReflush = 1
const reflushTaskComponent = () => { keyForReflush++; }

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

const startGenerating = async () => {
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
    const taskResp = await request.get(`/article_generate/create_generate_task/${configId}`);
    if (taskResp.code == 200) {
        ElMessage.success('任务开始运行');
        taskId.value = taskResp["task_id"];
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
</script>


<template>
    <div>
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
            <div class="prompt">
                <h2>Prompt</h2>
                <el-input
                    v-model="configPromptStr"
                    :autosize="{ minRows: 4 }"
                    type="textarea"
                    placeholder="请输入提示词..."
                    minlength="1"
                    maxlength="1000"
                />
                <div class="prompt-operate">
                    <el-button @click="configPromptStr = ''">清空</el-button>
                    <el-button @click="startGenerating" :disabled="taskRunning">开始生成</el-button>
                    <!-- todo -->
                    <!-- <el-button @click="endGenerating" :disabled="endGeneratingDisabled">停止生成</el-button> -->
                </div>
            </div>
            <div v-if="taskRunning" class="status-display">
                <TaskStatus :config="config" :task-id="taskId" :key="keyForReflush"></TaskStatus>
            </div>
        </div>
    </div>
</template>


<style scoped>
.prompt {
    padding: 0 10px;
    .prompt-operate {
        display: flex;
        justify-content: end;
        align-items: center;
        button {
            margin: 20px 5px;
        }
    }
}
</style>