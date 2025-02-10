<template>
  <el-container style="height: 100vh">
    <el-aside width="14vw" style="background-color: var(--nav--color)">
      <div class="platform">
        <div class="platform-logo">📔</div>
      </div>
      <div class="add-container">
        <button class="add" @click="createDoc()"><i class="ri-add-line"></i>&nbsp;新建文档</button>
        <button class="import" @click="importDoc()"><i class="ri-import-line"></i>&nbsp;导入文档</button>
        <input type="file" ref="fileInput" accept=".docx" @change="handleFileChange" style="display: none;">
      </div>
      <el-divider class="divider-title">功能区</el-divider>
      <!-- 左侧导航链接 -->
      <div class="router-link">
        <router-link to="/dashboard/DocumentPage" class="link">
          &nbsp;&nbsp;&nbsp;
          <i class="ri-folder-2-line"></i>
          &nbsp;&nbsp;
          我的文档
        </router-link>
        <router-link to="/dashboard/MyTemplate" class="link">
          &nbsp;&nbsp;&nbsp;
          <i class="ri-folder-open-line"></i>
          &nbsp;&nbsp;
          我的模板
        </router-link>
        <router-link to="/dashboard/ArticleGenerate" class="link">
          &nbsp;&nbsp;&nbsp;
          <i class="ri-article-line"></i>
          &nbsp;&nbsp;
          整文生成
        </router-link>
        <router-link to="/dashboard/ArticleSetting" class="link">
          &nbsp;&nbsp;&nbsp;
          <i class="ri-file-settings-line"></i>
          &nbsp;&nbsp;
          生成配置
        </router-link>
        <router-link to="/dashboard/StarPage" class="link">
          &nbsp;&nbsp;&nbsp;
          <i class="ri-star-line"></i>
          &nbsp;&nbsp;
          我的收藏
        </router-link>
        <router-link to="/dashboard/TemplateRepo" class="link">
          &nbsp;&nbsp;&nbsp;
          <i class="ri-folder-cloud-line"></i>
          &nbsp;&nbsp;
          模板库
        </router-link>
        <router-link to="/dashboard/RecyclePage" class="link">
          &nbsp;&nbsp;&nbsp;
          <i class="ri-delete-bin-line"></i>
          &nbsp;&nbsp;
          回收站
        </router-link>
      </div>
    </el-aside>
    <el-container>
      <el-header class="header">
        <div style="width: 60vw;">
          <el-autocomplete v-model="search" :fetch-suggestions="querySearchAsync" :trigger-on-focus="false"
            value-key="title" @select="handleSelect" placeholder="📔通过文档名搜索文档..." clearable>
            <template #prefix>
              <el-icon>
                <Search />
              </el-icon>
            </template>
          </el-autocomplete>
        </div>
        <div class="avatar-container">
          <el-avatar class="avatar" src="https://avatars.githubusercontent.com/u/90735179?v=4" size="small" />
          <div class="card">
              <div @click="handleCommand('change_prompt')" class="card-item">
                <el-icon><Setting /></el-icon>
                <span style="margin-left: 5px;">修改配置</span>
              </div>
              <div @click="handleCommand('reset_password')" class="card-item">
                <el-icon><EditPen /></el-icon>
                <span style="margin-left: 5px;">修改密码</span>
              </div>
              <div @click="handleCommand('logout')" class="card-item">
                <el-icon><SwitchButton /></el-icon>
                <span style="margin-left: 5px;">退出登录</span>
              </div>
          </div>
        </div>
      </el-header>
      <el-main class="main">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
        <ResetPassword :signal="toggle" />
        <Settings :signal="setting_visible" />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref } from "vue";
import router from "../router";
import { useUserStore } from "../stores/userStore.js";
import ResetPassword from "../components/ResetPassword.vue";
import Settings from "@/components/Settings.vue";
import request from "../utils/request.js";
import { ElMessage, ElLoading } from "element-plus";
import mammoth from 'mammoth';

const userStore = useUserStore();
const toggle = ref(false);  // 控制重置密码对话框的显示
const RightsDialog = ref(false);  // 控制权益对比表格的显示
let search = ref('');
const fileInput = ref(null);
const tableData = ref([
  { Type: '存储空间', super: '10G', gold: '1G', normal: '100M' },
  { Type: '文档数量', super: '无限制', gold: '1000', normal: '100' },
  { Type: '个人模板', super: '无限制', gold: '100', normal: '10' },
  { Type: '下载打印', super: '支持', gold: '支持', normal: '无' },
  { Type: '信息提取', super: '全功能', gold: '部分功能', normal: '无' },
  { Type: 'AI编辑', super: '全功能', gold: '部分功能', normal: '无' },
  { Type: '模板库', super: '全部', gold: '部分', normal: '无' },
  { Type: '价格', super: '￥99/年', gold: '￥49/年', normal: 'Free' },
  { Type: '退款', super: '无理由退款', gold: '无理由退款', normal: '无理由退款' },
  { Type: '客服', super: '7*24小时', gold: '7*24小时', normal: '7*24小时' },
]);


const setting_visible = ref(false)


const handleCommand = (command) => {
  if (command === "logout") {
    userStore.removeToken();
    userStore.removeUsername();
    userStore.removeEmail();
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("email");
    router.push("/");
  }
  if (command === "reset_password") {
    toggle.value = !toggle.value;
  }
  if (command === "change_prompt") {
    setting_visible.value = !setting_visible.value;
  }
};
// 文档查询
const querySearchAsync = async (queryString, cb) => {
  try {
    const response = await request.get("/document/search/" + queryString);
    if (response.code == 200) {
      cb(response.documents);
    } else {
      cb([]);
      ElMessage.info(response.message);
    }
  } catch (error) {
    ElMessage.error(error);
  }
};
// 点击查询结果
const handleSelect = (item) => {
  router.push({ name: 'edit', params: { id: item.id } });
};
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
    } else {
      ElMessage.error(response.message);
    }
  } catch (error) {
    ElMessage.error(error);
  } finally {
    loadingInstance.close();
  }
};
// 导入文档
const importDoc = () => {
  fileInput.value.click();
};
// 处理文档输入
const handleFileChange = async (event) => {
  const file = event.target.files[0];
  const loadingInstance = ElLoading.service({
    fullscreen: true,
    text: "正在导入文档...",
  });
  if (file) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      const response = await request.post('/document', { title: file.name.substring(0, file.name.lastIndexOf('.')), content: result.value });
      if (response.code == 200) {
        ElMessage.success('导入文档成功!');
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
};
</script>

<style scoped>
.platform {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: var(--theme--color);
}

.platform-logo {
  font-size: 7vw;
  margin: 1vh auto;
}

.platform-title {
  position: relative;
  font-weight: bolder;
  font-size: 4vh;
  cursor: pointer;
  background: linear-gradient(135deg, #5DAEFF, #bd34fe);
  background-clip: text;
  color: transparent;
}

.platform-title::after {
  content: "";
  width: 0%;
  height: 3px;
  background: linear-gradient(135deg, #5DAEFF, #bd34fe);
  position: absolute;
  top: 100%;
  left: 50%;
  transition: all 0.5s;
}

.platform-title:hover:after {
  left: 0%;
  width: 100%;
}

.add-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  margin: 3vh 0;
}

.add {
  width: 80%;
  border: none;
  padding: 1.5vh 0;
  border-radius: 10px;
  background-color: var(--el-color-primary);
  color: #eee;
  cursor: pointer;
}

.import {
  width: 80%;
  border: 1px solid #DCDFE6;
  padding: 1.5vh 0;
  margin-top: 1vh;
  border-radius: 10px;
  background-color: #fff;
  color: var(--el-color-primary);
}

.import:hover {
  border: 1px solid var(--el-color-primary-light-5);
  color: var(--el-color-primary);
  cursor: pointer;
}

.divider-title :deep(.el-divider__text) {
  line-height: 24px;
  background-color: var(--nav--color);
  color: #8c9db6;
}

.el-dropdown-link {
  display: flex;
  align-items: center;
  margin-left: 1vw;
  color: var(--el-color-primary);
  cursor: pointer;
  font-size: 2.3vh;
}

.router-link {
  width: 80%;
  margin: 3vh auto 0;
}

.link {
  width: 100%;
  display: block;
  padding: 1.5vh 0;
  text-decoration: none;
  border-radius: 10px;
  color: var(--el-color-primary);
}

.link:hover {
  background-color: #DCDFE6;
  color: var(--el-color-primary);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.link.router-link-active {
  background-color: var(--el-color-primary-light-3);
  color: #eee;
}

.more {
  width: 100%;
  padding: 1.5vh 0;
  margin-top: 20vh;
  display: block;
  text-align: center;
  text-decoration: none;
  border-radius: 10px;
  color: var(--el-color-primary-light-3);
  background-color: #DCDFE6;
}

.more:hover {
  background-color: var(--el-color-primary-light-5);
  color: #eee;
  cursor: pointer;
}

.header {
  height: 6vh;
  box-shadow: 0 0 2rem 0 rgba(41, 48, 66, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-around;
  background-color: var(--nav--color);
  color: #606266;
}

.main {
  padding: 0;
}

.avatar-container {
  position: relative; /* 使卡片相对于容器定位 */
  display: inline-block;
}

.avatar {
  display: block;
  transition: transform 0.3s ease;
  position: relative;
  z-index: 2; /* 确保头像在最前方 */
}

.card {
  position: absolute;
  top: 130%; /* 放置在头像下方 */
  right: 20px;
  width: 120px;
  background: #f9f9f9;
  border: 1px solid #ddd;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  opacity: 0; /* 默认隐藏卡片 */
  visibility: hidden; /* 防止点击卡片外的空白 */
  transform: translateY(-10px);
  transition: all 0.3s ease;
  z-index: 1;

  display: flex;
  flex-direction: column;
  align-items: center;

  .card-item {
    margin: 10px 0;
    display: flex;
    align-items: center;
    color: var(--el-color-primary);
  }
}

.avatar-container:hover .avatar {
  transform: scale(1.2) translate(-10%, 10%); /* 头像变大向左下移动 */
}

.avatar-container:hover .card {
  opacity: 1;
  visibility: visible;
  transform: translateY(0); /* 卡片从隐形位置出现 */
  cursor: pointer;
}
</style>