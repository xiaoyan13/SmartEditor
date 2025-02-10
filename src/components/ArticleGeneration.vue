<script setup>
import { computed, nextTick, onMounted, ref, shallowRef, watch} from 'vue'
import request from '../utils/request.js'
import { ElMessage, ElLoading } from "element-plus";
import TaskComprehend from './generate_steps/TaskComprehend.vue';
import OutlineGenerate from './generate_steps/OutlineGenerate.vue';
import ArticleGenerate from './generate_steps/ArticleGenerate.vue';
import ExpandAndPolish from './generate_steps/ExpandAndPolish.vue';

const config = ref()

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

const stepHTML = {
    "task_comprehend": {
        description: '任务理解',
        icon: `<i class="ri-compasses-2-line"></i>`,
        vueComponent: TaskComprehend,
    },
    "outline": {
        description: '大纲生成',
        icon: `<i class="ri-layout-2-line"></i>`,
        vueComponent: OutlineGenerate,
    },
    "article_gen": {
        description: '文章生成',
        icon: `<i class="ri-edit-2-fill"></i>`,
        vueComponent: ArticleGenerate,
    },
    "expand_and_polish": {
        description: '扩写与优化',
        icon: `<i class="ri-sparkling-2-line"></i>`,
        vueComponent: ExpandAndPolish,
    }
}

// 总共有几个步骤，装载每个步骤需要的一些基本信息，比如所需的 vueComponent
const stepList = shallowRef([])
// 当前是第几步, 下标从 0 开始
const activeStep = ref(0)
// 用户目前访问过哪几步，用于视图前后步切换的逻辑，判断用户是否访问过某视图
class ActiveStepsSet {
  constructor() {
    this.set = new Set();
    this.min = Infinity;
    this.max = -Infinity;
  }
  add(value) {
    if (!this.set.has(value)) {
      this.set.add(value);
      if (this.set.length == 1) {
        this.min = this.max = value;
      }else {
          this.min = Math.min(this.min, value);
          this.max = Math.max(this.max, value);
      }
    }
  }
  getMin() { return this.min; }
  getMax() { return this.max; }
}
const accessedSteps = new ActiveStepsSet()
watch(activeStep, () => {
    accessedSteps.add(activeStep.value);
})

// 当前已经创建的任务，其长度代表了当前已经经历几个步骤
let now_tasks = []
const fetchNowTasks = async () => {
    const configId = config.value.id
    const resp = await request.get(`/article_generate/get_task_by_config/${configId}`)
    if (resp.code == 200) {
        const tasks = resp["tasks"]
        tasks.sort((a, b) => a.step_n - b.step_n)
        now_tasks = tasks
    }else {
        ElMessage.error('获取配置相关任务失败！')
    }
}

// when @change triggered
const initTaskView = async () => {
    // get the task's status and then render them
    const stepsNum = config.value.step_by_step;
    if (stepsNum == 1) {
        stepList.value = [stepHTML.article_gen]
    }else if (stepsNum == 2) {
        stepList.value = [stepHTML.outline, stepHTML.article_gen]
    }else if (stepsNum == 3) {
        stepList.value = [stepHTML.task_comprehend, stepHTML.outline,stepHTML.article_gen]
    }else if (stepsNum == 4) { 
        stepList.value = [stepHTML.task_comprehend, stepHTML.outline,stepHTML.article_gen, stepHTML.expand_and_polish]
    }

    await fetchNowTasks()
    // change task view
    activeStep.value = now_tasks.length - 1
    if (now_tasks.length == 0) activeStep.value = 0
    if (now_tasks.length == 4) activeStep.value = 3
    // waiting for vue rendering corrent component...
    await nextTick()
    // For now, component has mounted, we insert corresponding STEP to the accessedSteps
    accessedSteps.add(activeStep.value)
    // init task view data state
    stepComponentRef.value.initTaskState(now_tasks[activeStep.value])
}

const renderNextTaskView = async (taskResult) => {
    if (activeStep.value + 1 > accessedSteps.getMax()) {
        // If it is a new view(that means user hasn't access that view), provide things needed to it.
        preTaskResult = taskResult
        activeStep.value += 1
        // guarantee new component mounted
        await nextTick()
        // render task status
        stepComponentRef.value.initTaskState(now_tasks[activeStep.value])
    }else {
        // render next task comp directly
        activeStep.value += 1
    }
}
const renderPreTaskView = async () => {
    if (activeStep.value - 1 < accessedSteps.getMin()) {
        // If it is a new view(that means user hasn't access that view), provide things needed to it.
        activeStep.value -= 1
        // guarantee new component mounted
        await nextTick()
        // render task status
        stepComponentRef.value.initTaskState(now_tasks[activeStep.value])
    }else {
        // render previous task comp directly
        activeStep.value -= 1 
    }
}

const renderTargetTaskView = async (targetStep) => {
    if (targetStep <= accessedSteps.getMax() && targetStep >= accessedSteps.getMin()) {
        activeStep.value = targetStep
    }else if (targetStep < accessedSteps.getMin()) {
        // If it is a new view(that means user hasn't access that view), provide things needed to it.
        activeStep.value = targetStep
        // guarantee new component mounted
        await nextTick()
        // render task status
        stepComponentRef.value.initTaskState(now_tasks[activeStep.value])
    }else {
        return;
    }
}

const stepMargin = computed(() => {
    if (stepList.value.length == 2) 
        return '0 30%'
    if (stepList.value.length == 3)
        return '0 20%'
    if (stepList.value.length == 4)
        return '0 9%'
})

const stepComponentRef = ref()
// 传递给下一步组件的 result
let preTaskResult = ""

</script>


<template>
    <div class="article-generation">
        <div class="header">
            <el-select
                v-model="config"
                filterable
                remote
                placeholder="🐻‍❄️ 输入整文配置的名称..."
                :remote-method="remoteMethod"
                :loading="headerLoading"
                @change="initTaskView"
                class="setting-search"
                @focus="changeWidth = true"
                @blur="changeWidth = false"
            >
                <el-option
                v-for="item in headerOptions"
                :key="item.id"
                :label="item.title"
                :value="item"
                />
            </el-select>
        </div>

        <transition name="fade">
            <div v-if="config?.id" :key="config?.id" class="container">
                <h2 style="color: var(--el-color-primary); margin: 30px 10px;">📰 {{ config?.title }}</h2>
                <el-steps :style="{ margin: stepMargin }" :active="activeStep" finish-status="success">
                    <template v-for="(step, index) in stepList" v-if="stepList.length > 1">
                        <el-step 
                            :title="'Step ' + (index + 1)" 
                            :description="step.description"
                            @click="renderTargetTaskView(index)"
                            style="cursor: pointer;"
                            >
                            <template #icon>
                                <div v-html="step.icon" style="font-size: large"></div>
                            </template>
                        </el-step>
                    </template>
                </el-steps>
                <keep-alive>
                    <component
                    ref="stepComponentRef"
                    :pre-task-result="preTaskResult"
                    :is="stepList[activeStep]?.vueComponent"
                    :current-step="activeStep"
                    :article-config="config"
                    @pre-step="renderPreTaskView"
                    @next-step="renderNextTaskView"
                    @update-now-tasks="fetchNowTasks"
                    />
                </keep-alive>
            </div>
        </transition>
    </div>
</template>


<style scoped>
.article-generation {
    margin: 10px 20px;
    margin-bottom: 100px;
    .header {
        margin: 20px 10px;
        margin-top: 30px;
        .setting-search>:deep(.el-select__wrapper.el-tooltip__trigger.el-tooltip__trigger) {
            border-radius: 10px;
        }
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


.fade-enter-active {
  transition: all 0.5s;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(-20px);
}

/* 让离开时没有过渡，直接消失 */
.fade-leave-active {
  transition: none;
}

.fade-leave-from {
  opacity: 1;
  transform: translateY(0);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(20px);
}


</style>