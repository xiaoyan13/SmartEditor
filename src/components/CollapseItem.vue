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
    {value: 'chatgpt', label: 'chatGPT'}, 
    {value: 'erniebot', label: '文心一言'}, 
    {value: 'gemini', label: 'gemini'}, 
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
    ]
}, () => {
    emit('changeTag', props.index, 'NEED_SAVE')
})
</script>


<template>
    <el-collapse-item  :name="index.toString()">
        <template #title>
            <div class="head">
                <h2>{{ item.title }}</h2>
                <el-tag :type="tagColorMap[tag]">{{ tag }}</el-tag>
            </div>
        </template>
        <div>
            <el-checkbox v-model="item.networking_RAG" label="启用 RAG 检索" size="large" />
            <el-checkbox v-model="item.step_by_step" label="启用多步生成" size="large" />
        </div>
        <div class="select-container">
            模型源：
            <el-select
                v-model="item.gpt"
                placeholder="Select"
                style="width: 150px; margin-right: 20px;"
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
        <div>
            <el-checkbox v-model="item.local_RAG_support" label="启用本地 RAG" size="large" />
        </div>
        <template v-if="item.local_RAG_support">
            <el-upload
                v-model:file-list="item.file_list"
                action="/"
                drag
                multiple
                :show-file-list="true"
                :http-request="(options) => $emit('addToFormData', options, index)"
                >
                    <el-icon class="el-icon--upload"><upload-filled /></el-icon>
                    <div class="el-upload__text" style="font-size: 16px; font-weight: 600;">
                        拖动文件到这里或 <em>点击上传</em>
                    </div>
                    <template #tip>
                        仅支持文本文件格式(pdf, markdown, word, txt), 大小 < 2 MB.
                    </template>
            </el-upload>
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
    margin: 10px 0;
}

.confirm {
    display: flex;
    justify-content: end;
    margin: 5px 20px;
    margin-bottom: 0;
}

</style>