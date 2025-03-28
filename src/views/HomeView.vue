<template>
  <div class="container">
    <div class="header">
      <div class="logo">
        <div style="font-size: 4vh;">📔</div>
        <span href="#" class="name">iflower · 智能编辑器</span>
      </div>
      <ul class="links">
        <li style="color: #6c63ff;cursor: pointer;">首页</li>
        <li><a href="https://github.com/xiaoyan13/SmartEditor_backend" target="_blank">Github</a></li>
        <router-link to="/login" class="toLogin">登录/注册</router-link>
      </ul>
    </div>
    <el-divider style="margin: 0;"></el-divider>
    <div class="content">
      <div class="info">
        <span class="clip">iflower</span>
        <h1>一个基于大小模型的</h1>
        <h1>在线文档富文本编辑器</h1>
        <p>在线编辑、AI辅助、文档管理</p>
        <button @click="start()">开始使用</button>
      </div>
      <div class="image">
        <div class="img-bg"></div>
        <div style="font-size: 30vh;">📔</div>
      </div>
    </div>
    <div class="features">
      <div class="feat">
        <h3>智能润色</h3>
        <p>基于大语言模型，实现根据上下文，实现如摘要、修饰、续写、病句改写、翻译等等常见写作辅助功能。</p>
      </div>
      <div class="feat">
        <h3>多媒体信息提取</h3>
        <p>基于OCR、目标检测和语音识别等多模态感知技术，实现对图像、语音甚至视频等多媒体信息的在线信息提取。</p>
      </div>
      <div class="feat">
        <h3>定制化生成</h3>
        <p>基于自定义配置生成所需段落或文章，细粒度的控制每一步生成步骤。</p>
      </div>
    </div>
    <div class="footer">
      <p style="font-size: 2vh;">Copyright © 2025 iflower.</p>
    </div>
  </div>
</template>

<script setup>
import router from "../router";

const start = () => {
  router.push("/login");
};
</script>

<style scoped>
.header {
  margin: 0 6vw;
  height: 9vh;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo {
  display: flex;
  align-items: center;
}

.name {
  margin-left: 1vw;
  font-size: 3vh;
  color: #555;
  font-weight: bold
}

.links {
  list-style: none;
  display: flex;
  align-items: center;
  font-size: 2.5vh;
}

.links li a {
  text-decoration: none;
  margin-left: 3vw;
  color: #5d5d5d;
  cursor: pointer;
  transition: 0.3s;
}

.toLogin {
  text-decoration: none;
  margin-left: 3vw;
  border-radius: 2vh;
  padding: 1vh 1.5vw;
  color: #fff;
  background-color: #6c63ff;
}

.links li a:hover {
  color: #6c63ff;
}

.content {
  margin: auto 13vw;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 60vh;
}

.content .info {
  flex: 1;
}

.content .info h1 {
  color: #444;
  font-size: 6vh;
  margin: 0;
}

.content .info .clip {
  font-size: 8vh;
  margin: 0;
  font-weight: bold;
  background: linear-gradient(135deg, #47caff, #bd34fe);
  background-clip: text;
  color: transparent;
}

.content .info p {
  margin: 0;
  padding-top: 1.5vh;
  font-size: 4vh;
  color: #5d5d5d;
}

.content .info button {
  font-size: 2vh;
  border: 0;
  border-radius: 3vh;
  padding: 2vh 2vw;
  margin-top: 3vh;
  cursor: pointer;
  color: #fff;
  background-color: #6c63ff;
}

.content .image {
  position: relative;
  flex: 1;
  display: flex;
  justify-content: center;
}

.content .image .img-bg {
  position: absolute;
  top: -5vh;
  width: 40vh;
  height: 40vh;
  background-color: var(--el-color-primary-light-3);
  border-radius: 50%;
  filter: blur(14vh);
}

.features {
  display: flex;
  justify-content: space-between;
  margin: 0 12vw;
  height: 20vh;
}

.feat {
  flex: 1;
  background-color: #f6f6f7;
  border-radius: 1vh;
  margin: 0 1vh;
  padding: 2vh;
}

.feat h3 {
  font-size: 3vh;
  color: #666;
  margin: 0;
}

.feat p {
  font-size: 2vh;
  color: #888;
  line-height: 1.5;
}

.footer {
  height: 10vh;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #888;
}
</style>
