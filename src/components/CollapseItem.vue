<script setup>
import { ref, watch } from 'vue'
import { Eleme } from '@element-plus/icons-vue'

// change the item's attr directly in props.item in the component for convenience.
// https://vuejs.org/guide/components/props.html#mutating-object-array-props
const props = defineProps({
  item: Object, 
  index: Number,
  tag: String
})

const emit = defineEmits(['addToFormData', 'delConfig', 'changeConfig', 'changeTag'])

const GPToptions = [
    {value: 'deepseek', label: 'deepseek'},
    {value: 'chatgpt', label: 'chatGPT'}, 
    {value: 'erniebot', label: '文心一言'}, 
    {value: 'gemini', label: 'gemini'}, 
    {value: 'claude', label: 'claude'}, 
]
const engineOptions = [
    {value: 'baidu', label: '百度'}, 
    {value: 'google', label: '谷歌'}, 
    {value: 'edge', label: 'edge'}, 
]

const tagColorMap = ref({
    "NEED_SAVE" : "warning",
    "ACTIVE": "success"
})

watch(() => {
    return [
        props.item.search_engine,
        props.item.gpt,
        props.item.networking_RAG,
        props.item.local_RAG_support,
        props.item.step_by_step,
        props.item.file_list.length,
        props.item.system_prompt,
        props.item.steps?.length
    ]
}, () => {
    emit('changeTag', props.index, 'NEED_SAVE')
})

const changeSteps = (new_val) => {
    if (new_val > 4) {
        props.item.steps.push({step_order: new_val});
        return;
    }
    switch (new_val) {
        case 1:
            props.item.steps = [
                {step_order: 1, title: "文章生成", prompt: "请你根据以上信息生成一篇文章。"},
            ]
            break
        case 2:
            props.item.steps = [
                {step_order: 1, title: "大纲生成", prompt: "请你根据以上设定生成大纲。"},
                {step_order: 2, title: "文章生成", prompt: "请你根据以下给定的大纲生成一篇文章。"},
            ]
            break
        case 3:
            props.item.steps = [
                {step_order: 1, title: "任务理解", prompt: "请你根据以上设定进行任务理解。"},
                {step_order: 2, title: "大纲生成", prompt: "请你根据以上设定与理解生成大纲。"},
                {step_order: 3, title: "文章生成", prompt: "请你根据以上给定的大纲生成一篇文章。"},
            ]
            break
        case 4:
            props.item.steps = [
                {step_order: 1, title: "任务理解", prompt: "请你根据以上设定进行任务理解。"},
                {step_order: 2, title: "大纲生成", prompt: "请你根据以上设定与理解生成大纲。"},
                {step_order: 3, title: "文章生成", prompt: "请你根据以上设定与大纲生成一篇文章。"},
                {step_order: 4, title: "扩写与优化", prompt: "请你扩写这篇文章。"},
            ]
            break
    }
}

const dialogVisible = ref(false)
let activeIndex = -1
const dialogContent = ref("")
const showModal = (index) => {
    activeIndex = index;
    dialogContent.value = props.item.steps[activeIndex].prompt;
    dialogVisible.value = true;
}
const changePrompt = () => {
    props.item.steps[activeIndex].prompt = dialogContent.value
    dialogVisible.value = false;
    activeIndex = -1;
}

const system_prompt_open = ref(false)
if (props.item.system_prompt) {
    system_prompt_open.value = true
}

const previewFile = (file) => {
    const config_id = props.item.id
    const file_name = file.name
    window.open(`/file_preview/${config_id}/${file_name}`, '_blank')
}

</script>


<template>
    <el-collapse-item  :name="index.toString()">
        <template #title>
            <div class="head">
                <h2>{{ item.title }}</h2>
                <el-tag :type="tagColorMap[tag]">{{ tag }}</el-tag>
            </div>
        </template>
        <div class="select-container">
            设置分步生成：
            <el-input-number v-model="item.step_by_step" @change="changeSteps" :min="1" :max="8" style="margin-right: 40px;" />
            模型源：
            <el-select
                v-model="item.gpt"
                placeholder="Select"
                style="width: 150px; margin-right: 40px;"
                >
                <el-option
                    v-for="item in GPToptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                />
                </el-select>
                搜索引擎配置：
                <el-select
                v-model="item.search_engine"
                placeholder="Select"
                style="width: 100px"
                >
                <el-option
                    v-for="item in engineOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                />
                </el-select>
        </div>
        <transition name="fade">
            <div class="step-table" v-if="item.step_by_step >  1">
                <el-table :data="item.steps">
                    <el-table-column prop="step_order" label="步骤" width="180" />
                    <el-table-column prop="title" label="任务名称" width="180">
                        <template #default="scope">
                            <el-input v-model="item.steps[scope.$index].title" />
                        </template>
                    </el-table-column>
                    <el-table-column prop="prompt" label="用户默认提示词">
                        <template #default="scope">
                            <div class="ellipsis">{{ item.steps[scope.$index].prompt }}</div>
                        </template>
                    </el-table-column>
                    <el-table-column width="180">
                        <template #default="scope">
                            <el-button @click="showModal(scope.$index)">
                            修改
                            </el-button>
                        </template>
                    </el-table-column>
                </el-table>
            </div>
        </transition>
        <el-dialog v-model="dialogVisible">
            <template #header>
                <span style="font-size: large; font-weight: 600; color: var(--el-color-primary)">修改提示词</span>
            </template>
            <el-input 
            v-model="dialogContent"
            :autosize="{ minRows: 10 }"
            type="textarea"
            placeholder="🌱在此输入修改后的默认提示词..."
            maxlength="1000"
            show-word-limit
            />
            <template #footer>
                <div>
                    <el-button @click="dialogVisible = false">取消</el-button>
                    <el-button type="primary" @click="changePrompt">
                    确定
                    </el-button>
                </div>
            </template>
        </el-dialog>
        <div>
            <el-checkbox v-model="item.networking_RAG" label="启用远程 RAG 检索" size="large" />
            <el-checkbox v-model="item.local_RAG_support" label="启用本地 RAG" size="large" />
            <el-checkbox v-model="system_prompt_open" label="自定义 Prompt" size="large" />
        </div>
        <template v-if="item.local_RAG_support">
            <el-upload
                v-model:file-list="item.file_list"
                drag
                multiple
                :show-file-list="true"
                :on-preview="previewFile"
                :http-request="(options) => $emit('addToFormData', options, index)"
                style="margin-top: 10px;"
                >
                    <el-icon class="el-icon--upload"><upload-filled /></el-icon>
                    <div class="el-upload__text" style="font-size: 16px; font-weight: 600;">
                        拖动文件到这里或 <em>点击上传</em>
                    </div>
                    <template #tip>
                        仅支持文本文件格式(pdf, markdown, word, txt, etc.), 大小 < 2 MB.
                    </template>
            </el-upload>
        </template>
        <template v-if="system_prompt_open">
            <h3 style="margin-bottom: 0px;">自定义 System prompt：</h3>
            <el-input
                v-model="item.system_prompt"
                :autosize="{ minRows: 6 }"
                style="margin-top: 10px;"
                type="textarea"
                placeholder="🏖️ 在此输入System Prompt, 此系统提示词在本配置中全局生效。"
            />
        </template>
        <div class="confirm">
            <el-button 
            @click="$emit('delConfig', index)" 
            :loading="item.deleteloading"
            color="red"
            :loading-icon="Eleme">
                删除
            </el-button>
            <el-button 
            @click="$emit('changeConfig', index)" 
            :loading="item.isloading"
            color="#7FFFD4"
            :loading-icon="Eleme">
                保存
            </el-button>
        </div>
    </el-collapse-item>
</template>


<style scoped>
.head {
    display: flex;
    align-items: center;
    width: 100%;
    h2 {
        color: var(--el-color-primary);
        margin: 0px 10px;
    }
}

.select-container {
    display: flex;
    align-items: center;
    margin: 15px 0;
}

.confirm {
    display: flex;
    justify-content: end;
    margin: 5px 20px;
    margin-bottom: 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.ellipsis {
  white-space: nowrap;           /* 禁止换行 */
  overflow: hidden;              /* 隐藏超出容器的部分 */
  text-overflow: ellipsis;       /* 超出部分显示省略号 "..." */
  width: 90%;                  /* 设置一个固定宽度 */
}

</style>