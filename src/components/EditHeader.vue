<template>
  <div class="left-group">
    <el-tooltip content="回到首页" :hide-after="0">
      <el-button @click="returnHome()" class="icon exclude">
        <el-icon :size="22">
          <HomeFilled />
        </el-icon>
      </el-button>
    </el-tooltip>
    <el-tooltip content="创建文档" :hide-after="0">
      <el-button @click="createDoc()" class="icon exclude">
        <el-icon :size="22">
          <Plus />
        </el-icon>
      </el-button>
    </el-tooltip>
    <el-divider direction="vertical" />
    <el-tooltip content="保存" :hide-after="0">
      <el-button @click="save()" class="icon">
        <i style="font-size: 22px;" class="ri-save-3-line"></i>
      </el-button>
    </el-tooltip>
    <el-tooltip content="下载" :hide-after="0">
      <el-button @click="download(title)" class="icon exclude">
        <i style="font-size: 22px;" class="ri-download-2-line"></i>
      </el-button>
    </el-tooltip>
    <el-tooltip content="打印" :hide-after="0">
      <el-button @click="print()" class="icon exclude">
        <i style="font-size: 22px;" class="ri-printer-line"></i>
      </el-button>
    </el-tooltip>
  </div>
  <div class="edit-title">
    <input class="edit-input" type="text" :value="title" @input="updateTitle" />
  </div>
  <div class="right-group" style="margin-right: 1vw;">
    <el-tooltip content="文心助手" :hide-after="0">
      <el-button @click="InsertErnie()" class="icon">
        <i style="font-size: 22px;" class="ri-baidu-fill"></i>
      </el-button>
    </el-tooltip>
    <el-tooltip content="字符识别" :hide-after="0">
      <el-button @click="ocrDialog = true; uploadSuccess = false" class="icon">
        <i style="font-size: 22px;" class="ri-character-recognition-line"></i>
      </el-button>
    </el-tooltip>
    <el-tooltip content="语音识别" :hide-after="0">
      <el-button @click="asrDialog = true; uploadSuccess = false" class="icon">
        <i style="font-size: 22px;" class="ri-voice-recognition-line"></i>
      </el-button>
    </el-tooltip>
    <el-tooltip content="思维导图" :hide-after="0">
      <el-button @click="createMindMap()" class="icon">
        <i style="font-size: 22px;" class="ri-mind-map"></i>
      </el-button>
    </el-tooltip>
  </div>
  <el-dialog v-model="ocrDialog" width="500" title="上传图片">
    <el-upload v-if="!uploadSuccess" ref="ocrUpload" drag action="/api/function/ocr" accept=".jpg, .jpeg, .png"
      :limit="1" :on-exceed="handleExceed" :before-upload="checkImage" :auto-upload="false" :on-success="handleSuccess">
      <el-icon class="el-icon--upload"><upload-filled /></el-icon>
      <div class="el-upload__text">
        将图片拖到此处或 <em>点击上传</em>
      </div>
    </el-upload>
    <p v-if="uploadSuccess">{{ uploadResult }}</p>
    <template #footer>
      <div class="dialog-footer">
        <el-button v-if="!uploadSuccess" @click="ocrDialog = false">取消</el-button>
        <el-button v-if="!uploadSuccess" type="primary" @click="ocrUpload.submit();">上传</el-button>
        <el-button v-if="uploadSuccess" type="primary" :icon="Check" round plain @click="copyToClipboard">复制</el-button>
        <el-button v-if="uploadSuccess" type="primary" @click="ocrDialog = false">确认</el-button>
      </div>
    </template>
  </el-dialog>
  <el-dialog v-model="asrDialog" width="500" title="上传音频">
    <el-upload v-if="!uploadSuccess" ref="asrUpload" drag action="/api/function/asr" accept=".wav, .mp3" :limit="1"
      :on-exceed="handleExceed" :before-upload="checkSpeech" :auto-upload="false" :on-success="handleSuccess">
      <el-icon class="el-icon--upload"><upload-filled /></el-icon>
      <div class="el-upload__text">
        将文件拖到此处或 <em>点击上传</em>
      </div>
    </el-upload>
    <p v-if="uploadSuccess">{{ uploadResult }}</p>
    <template #footer>
      <div class="dialog-footer">
        <el-button v-if="!uploadSuccess" @click="asrDialog = false">取消</el-button>
        <el-button v-if="!uploadSuccess" type="primary" @click="asrUpload.submit();">上传</el-button>
        <el-button v-if="uploadSuccess" type="primary" :icon="Check" round plain @click="copyToClipboard">复制</el-button>
        <el-button v-if="uploadSuccess" type="primary" @click="asrDialog = false">确认</el-button>
      </div>
    </template>
  </el-dialog>
  <el-drawer v-model="drawer" size="46%" destroy-on-close>
    <template #header>
      <h2>思维导图</h2>
    </template>
    <template #default>
      <MindMap :htmlContent="MindMapContent" />
    </template>
  </el-drawer>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue';
import { ElButton, ElTooltip, ElDivider, ElIcon, ElDialog, ElDrawer } from 'element-plus';
import { ElMessage, genFileId, ElLoading, ElUpload } from "element-plus";
import { HomeFilled, Plus } from '@element-plus/icons-vue';
import { Check } from '@element-plus/icons-vue'
import request from "../utils/request.js";
import router from "../router/index.js";
import MindMap from '../components/MindMap.vue';
import htmlToPDF from '../utils/htmlToPDF.js';
const ocrDialog = ref(false); // OCR弹窗
const asrDialog = ref(false); // ASR弹窗
const uploadSuccess = ref(false); // 上传成功
const uploadResult = ref(''); // 上传结果
const ocrUpload = ref(null); // 图片上传
const asrUpload = ref(null); // 音频上传
const drawer = ref(false);
const MindMapContent = ref('');

// 从父组件接收 editor 实例
const props = defineProps({
  editor: Object,
  title: String
});
const emit = defineEmits(['reload', 'updateTitle']);
const reload = () => {
  emit('reload');
};
const updateTitle = (event) => {
  emit('updateTitle', event.target.value);
};
// 返回文档页面
const returnHome = () => {
  router.push('/dashboard/DocumentPage');
}
// 新建文档
const createDoc = async () => {
  const loadingInstance = ElLoading.service({
    fullscreen: true,
    text: "正在新建文档...",
  });
  try {
    const response = await request.post('/document', { title: "未命名文档", content: "" });
    if (response.code == 200) {
      ElMessage.success('新建文档成功!');
      router.push({ name: 'edit', params: { id: response.id } });
      reload();
    } else {
      ElMessage.error(response.message);
    }
  } catch (error) {
    ElMessage.error(error);
  } finally {
    loadingInstance.close();
  }
};
// 保存文档
const save = async () => {
  const loadingInstance = ElLoading.service({
    fullscreen: true,
    text: "正在保存...",
  });
  try {
    const response = await request.put('/document/' + router.currentRoute.value.params.id, { title: props.title, content: props.editor.getHTML() });
    if (response.code == 200) {
      ElMessage.success("保存成功！");
      reload();
    } else {
      ElMessage.error(response.message);
    }
  } catch (error) {
    ElMessage.error(error);
  } finally {
    loadingInstance.close();
  }
}

const handleKeyDown = (event) => {
  // 检查是否按下了 Ctrl+S
  if ((event.ctrlKey || event.metaKey) && event.key === 's') {
    event.preventDefault(); // 阻止浏览器的默认保存行为
    // 在这里添加自定义逻辑，例如保存数据或调用函数
    save();
  }
}
onMounted(() => {
  document.addEventListener('keydown', handleKeyDown);
})
onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
})

// 打印文档
const print = () => {
  const printHTML = document.querySelector('#editor-content').innerHTML;
  // 将打印的区域赋值，进行打印
  window.document.body.innerHTML = printHTML;
  window.print(); // 调用window打印方法
  window.location.reload(); // 打印完成后重新加载页面
}
// 下载文档
const download = (fileName) => {
  let element = document.querySelector('#editor-content');
  // 设置打印区域的高度和overflow属性，否则打印内容会被截断为浏览器视图的高度
  element.style.overflowY = 'visible';
  element.style.height = 'auto';
  const fileList = document.getElementById('editor-content')   // 很重要
  htmlToPDF(fileName, element, fileList)
  // 恢复原来的样式
  element.style.overflowY = 'auto';
  element.style.height = '100%';
}
// 文心助手
const InsertErnie = () => {
  const { state, dispatch } = props.editor.view;
  const { $from } = state.selection;
  const tr = state.tr.delete($from.pos - 1, $from.pos);
  dispatch(tr);
  props.editor.chain().focus().insertContent('<vue-component />').run();
  props.editor.chain().blur().run();
}
// 检查上传图片格式
const checkImage = (file) => {
  const fileSuffix = file.name.substring(file.name.lastIndexOf(".") + 1);
  const whiteList = ["jpg", "jpeg", "png"];
  if (whiteList.indexOf(fileSuffix) === -1) {
    ElMessage.error("上传文件只能是jpg, jpeg, png格式");
    return false;
  }
};
// 检查上传音频格式
const checkSpeech = (file) => {
  const fileSuffix = file.name.substring(file.name.lastIndexOf(".") + 1);
  const whiteList = ["wav", "mp3"];
  if (whiteList.indexOf(fileSuffix) === -1) {
    ElMessage.error("wav, mp3格式");
    return false;
  }
};
// 处理超出文件
const handleExceed = (files) => {
  const file = files[0]
  file.uid = genFileId()
  if (ocrUpload) {
    ocrUpload.value.clearFiles()
    ocrUpload.value.handleStart(file)
  }
  else {
    asrUpload.value.clearFiles()
    asrUpload.value.handleStart(file)
  }
}
// 上传成功
const handleSuccess = (response) => {
  if (response.code !== 200) {
    ElMessage.error(response.message);
    ocrUpload.value.clearFiles();
    asrUpload.value.clearFiles();
    return;
  }
  uploadSuccess.value = true;
  uploadResult.value = response.message;
};
// 创建思维导图
const createMindMap = () => {
  MindMapContent.value = props.editor.getHTML();
  drawer.value = true;
}
// 复制到剪贴板
const copyToClipboard = async () => {
  try {
    await navigator.clipboard.writeText(uploadResult.value);
    ElMessage.success('复制到剪贴板!');
    asrDialog.value == false;
    ocrDialog.value == false;
  } catch (error) {
    ElMessage.error('复制失败!', error);
  }
}
</script>

<style scoped>
.icon {
  padding: 2px 3px;
  margin: 0 4px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  background-color: transparent;
}

.edit-title {
  font-size: 20px;
  display: flex;
  align-items: center;

  .edit-input {
    background: none; 
    border: 0px; 
    outline: none;
    font-weight: 900;
    text-align: center
  }
}
</style>