<script setup>
// this is a full-controlled component.
import { ref } from 'vue'

const search_needed = ref(true) 
const network_RAG_search_needed = ref(true)
const local_RAG_search_needed = ref(true)

const gpt = ref()
const search_engine = ref()

const GPToptions = [
    {value: 'deepseek', label: 'deepseek'},
    {value: 'chatgpt', label: 'chatGPT'}, 
    {value: 'erniebot', label: '文心一言'}, 
    {value: 'gemini', label: 'gemini'}, 
]
const engineOptions = [
    {value: 'baidu', label: '百度'}, 
    {value: 'google', label: '谷歌'}, 
    {value: 'edge', label: 'edge'}, 
]

defineExpose({
    gpt,
    search_engine,
    search_needed,
    network_RAG_search_needed,
    local_RAG_search_needed,
})
</script>


<template>
    <div>
        <div class="select-container">
            模型源：
            <el-select
                v-model="gpt"
                placeholder="Select"
                clearable
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
                v-model="search_engine"
                placeholder="Select"
                clearable
                style="width: 100px; margin-right:120px;"
                >
                <el-option
                    v-for="item in engineOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                />
                </el-select>
            <el-checkbox v-model="search_needed" label="启用网络检索" size="large" />
            <el-checkbox v-model="network_RAG_search_needed" label="启用远程 RAG 检索" size="large" />
            <el-checkbox v-model="local_RAG_search_needed" label="启用本地 RAG" size="large" />
        </div>
    </div>
</template>


<style scoped>
.select-container {
    display: flex;
    align-items: center;
    margin: 40px 0;
}
</style>