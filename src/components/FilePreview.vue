<script setup>
import { useRoute } from 'vue-router';
import request from '../utils/request.js'
import { ref } from 'vue';
import { onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { VueFilesPreview } from 'vue-files-preview';

const route = useRoute()
const { config_id, file_name } = route.params

const file = ref()
// const fileRender = ref()
onMounted(async () => {
    try {
        const blob = await request.get(`/article_generate/${config_id}/${file_name}`, {
            responseType: 'blob',  // 设置响应类型为 blob
        })
        file.value = new File([blob], file_name);
    } catch (error) {
        ElMessage.error(error)
    }
    document.title = file.value.name
    const link = document.querySelector("link[rel~='icon']");
    link.href = '/file_preview.svg';
})

const getFileType = (file) => {
    const fileName = file.name
    const idx = fileName.lastIndexOf('.')
    return fileName.substring(idx + 1)
}

const isCode = (file) => {
    const file_suffix = getFileType(file);
    const accepts = ['html', 'css', 'less', 'scss', 'js', 'json', 'ts', 'vue', 'c', 'cpp', 'java', 'py', 'go', 'php', 'lua', 'rb', 'pl', 'swift', 'vb', 'cs', 'sh', 'rs', 'vim', 'log', 'lock', 'swift', 'mod', 'mht', 'mhtml', 'xml']
    if (accepts.find(item => item == file_suffix)) {
        return true
    }
    return false
}

const isBinaryFile = (file) => {
    const file_suffix = getFileType(file);
}

</script>


<template>
    <div class="main" v-if="file" >
        <h1>Preview</h1>
        <div class="file-preview" :class="{ 'code-background': isCode(file) }">
            <!-- <iframe class="pdf-iframe" :src="fileRender" frameborder="0" /> -->
            <VueFilesPreview :file="file"></VueFilesPreview>
        </div>
        <div v-if="isCode(file)" class="bottom">
            文件名：{{ file.name }}
        </div>
    </div>
</template>

 
<style scoped>
.main {
    padding: 0 10%;
    display: flex;
    flex-direction: column;
    min-height: 80vh;
    overflow: auto;
}

.code-background {
    background-color: #282c34
}

.file-preview {
    font-size: 20px;
    flex: 1 0;
}

.bottom {
    display: flex;
    justify-content: end;
    font-size: 20px;
    font-style: italic;
    margin: 8px;
}
</style>