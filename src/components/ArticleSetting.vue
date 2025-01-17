<script setup>
import { ref, watch } from 'vue'
import request from '../utils/request.js'
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';
import { ElMessage } from 'element-plus';
import { useUserStore } from '@/stores/userStore.js';
import CollapseItem from './CollapseItem.vue';

const userStore = useUserStore()

/*
{
    "title": "string",
    "search_engine": "baidu" | "google" | "edge",
    "gpt": "chatgpt" | "erniebot" | "gemini",
    "networking_RAG": boolean
    "local_RAG_support": boolean
    "file_list": {name:string}[]    // see https://github.com/element-plus/element-plus/blob/ea964f16723ea39551320ab3d68fb731dd227ab3/packages/components/upload/src/upload.ts#L31
    "step_by_step": boolean
    // "advanced_config" : {
    //     "model_config": {...}
    // }
}
*/
const activeCollapseName = ref('') // 控制当前哪个面板展开

const data = ref([]) // data will be rendered in HTML
const filesMap = new Map() // used for mapping data's position in arr to its corresponding NEW files.
const tags = ref([]) // used for mapping data's position to its editing state: NEED_SAVE | ACTIVE 
const changeTag = (i, val) => {
    tags.value[i] = val;
}

const configChange = async (i) => {
    const dt = data.value[i]
    dt.isloading = true

    const files = filesMap.get(i)
    const formData = new FormData()
    // collect all files need pushed
    if (files) 
        for (const file of files)
            formData.set(file.name, file)
    // collect all field to json
    for (const field in dt) {
        if (field == 'file_list') continue;
        formData.append(field, dt[field]);
    }
    // Determine to use UPDATE or ADD method by check it has ID attr or not
    if (dt.id) {
        try {
            const resp = await fetch(`/api/article_config/update_config/${dt.id}`, {
                method: 'PUT',
                headers: {'Authorization': `Bearer ${userStore.token}` },
                body: formData
            });
            if (resp.ok) {
                ElMessage.success('更新配置成功！')
                tags.value[i] = 'ACTIVE'
            }else {
                const responseJson = await resp.json()
                ElMessage.error(responseJson.message)
            }
        } catch (error) {
            ElMessage.error("更新失败！")
        }
    }else {
        try {
            const resp = await fetch('/api/article_config/add_config', {
                method: 'POST',
                headers: {'Authorization': `Bearer ${userStore.token}` },
                body: formData
            });
            const responseJson = await resp.json()
            if (resp.ok) {
                ElMessage.success('新增配置成功！')
                dt.id = responseJson.id;
                tags.value[i] = 'ACTIVE';
            }else {
                ElMessage.error(responseJson.message)
            }
        } catch (error) {
            ElMessage.error("保存失败！")
        }
    }
    dt.isloading = false
}

const delConfig = async (i) => {
    const dt = data.value[i];
    dt.deleteloading = true
    const id = dt?.id;
    // determine whether need send DELETE to backend by data has ID or not.
    if (id) {
        const resp = await request.delete(`/article_config/delete_config/${id}`);
        if (resp.code == 200) {
            ElMessage.success('删除成功');
            data.value.splice(i, 1);
            tags.value.splice(i, 1);
        }else {
            ElMessage.error(resp.message)
        }
    }else {
        data.value.splice(i, 1)
    }
    dt.deleteloading = false
}

const addToFormData = (options, index) => {
    const file = options.file
    if (!filesMap.get(index)) {
        filesMap.set(index, [file])
    }else {
        filesMap.get(index).push(file);
    }
}

const dialogVisible = ref(false)
const newTitle = ref('')
const dialogHandleConfirm = () => {
    if (!newTitle.value) {
        ElMessage.error('请输入名称！')
    }else {
        data.value.push({
            "title": newTitle.value,
            "search_engine": "google",
            "gpt": "erniebot",
            "networking_RAG": true,
            "local_RAG_support": false,
            "file_list": [],
            "step_by_step": true,
            isloading: false, // used by html control
            deleteloading: false, // used by html control
        })
        tags.value.push('NEED_SAVE')
        activeCollapseName.value = (data.value.length - 1).toString();

        newTitle.value = '';
        dialogVisible.value = false;
    }
}

const init = async () => {
    NProgress.start()
    // get data
    const resp = await request.get('/article_config/get_configs')
    if (resp.code == 200) {
        // pre-clean data
        for (const config of resp.configs) {
            const file_list = []
            if (config.local_RAG_files) {
                for (const file of config.local_RAG_files) {
                    file_list.push({name: file.file_name})
                }
            }
            data.value.push({
                id: config.id,
                title: config.title,
                local_RAG_support: config.local_RAG,
                networking_RAG: config.networking_RAG,
                search_engine: config.search_engine,
                step_by_step: config.step_by_step,
                gpt: config.gpt,
                file_list: file_list
            })
        }
        tags.value = Array(data.value.length).fill('ACTIVE')
    }else {
        ElMessage.error(resp.message)
    }
    NProgress.done()
}
init()
</script>

<template>
    <div class="container">
        <h2 class="title">整文生成配置</h2>
        <el-collapse accordion  v-model="activeCollapseName">
            <template v-for="(item, index) of data">
                <CollapseItem
                 :item
                 :index
                 :tag="tags[index]"
                 @add-to-form-data="addToFormData"
                 @del-config="delConfig"
                 @change-config="configChange"
                 @change-tag="changeTag"
                />
            </template>
        </el-collapse>
        <div class="add-config-button">
            <el-button @click="dialogVisible = true" color="#6c63ff">
                添加配置
            </el-button>
        </div>
        <el-dialog
        v-model="dialogVisible"
        title="提示"
        width="500"
        >
            <div style="display: flex; justify-content: center;">
                <el-input
                v-model="newTitle"
                placeholder="请输入要添加的配置名称.."
                clearable
                />
            </div>
            <template #footer>
                <div>
                    <el-button type="primary" @click="dialogHandleConfirm">
                    确定
                    </el-button>
                </div>
            </template>
        </el-dialog>
    </div>
</template>


<style scoped>
.container {
  margin: 20px 2vw;
}

.title {
  color: #555;
}

.add-config-button {
    display: flex;
    justify-content: end;
    padding: 20px 10px;
}
</style>