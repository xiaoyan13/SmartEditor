<template>
	<node-view-wrapper class="vue-component">
		<label>ERNIE Bot</label>
		<div class="reply">
				<common-editor v-if="replySuccess" v-model="reply" :show-header="false"></common-editor>
		</div>
		<div class="content">
			<el-input v-model="prompt" style="width: 100%" :autosize="{ minRows: 2 }" type="textarea"
				placeholder="请输入内容..." />
		</div>
		<div class="footer">
			<el-select v-model="tone" placeholder="切换风格" style="width: 140px">
				<el-option v-for="item in options" :key="item" :label="item" :value="item" />
			</el-select>
			<div class="buttons">
				<el-button v-if="replySuccess" type="primary" :icon="Check" round plain @click="copyToClipboard">复制</el-button>
				<el-button type="primary" @click="send">{{ replySuccess ? '重新' : '' }}发送</el-button>
			</div>
		</div>
	</node-view-wrapper>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { Check } from '@element-plus/icons-vue'
import { nodeViewProps, NodeViewWrapper } from '@tiptap/vue-3';
import { ElMessage, ElLoading, ElInput } from "element-plus";
import { useUserStore } from '../stores/userStore';
import CommonEditor from './CommonEditor.vue';

const userStore = useUserStore()

const prompt = ref('')
const reply = ref('')
const tone = ref('')
const replySuccess = ref(false)

const options = ["商业", "学术", '随意', '正式', '感性', '客观', '诗意'];
// 定义 props
const props = defineProps(nodeViewProps);

// 定义 send 方法
const send = async () => {
	const loadingInstance = ElLoading.service({
		fullscreen: true,
		text: "正在加载中...",
	});
	try {
		const response = await fetch('/api/function/AIFunc', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
        'Authorization': `Bearer ${userStore.token}`
			},
			body: JSON.stringify({ command: '', text: '', prompt: prompt.value, tone: tone.value }),
		});
		if (!response.ok) {
			throw new Error('网络响应不正常');
		}
		const reader = response.body.getReader();
		const decoder = new TextDecoder('utf-8');
		let receivedText = '';
		loadingInstance.close();
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;
			if (!replySuccess.value) {
				replySuccess.value = true;
			}
			const decodedValue = decoder.decode(value, { stream: true });
			receivedText += decodedValue;
			reply.value = receivedText;
		}
	} catch (error) {
		ElMessage.error(error.message);
	}
}

const copyToClipboard = async () => {
	try {
		await navigator.clipboard.writeText(reply.value)
		ElMessage.success('复制到剪贴板!')
	} catch (error) {
		ElMessage.error('复制失败!', error)
	}
}

onMounted(() => {
	if (props.node.attrs.message) {
		prompt.value = props.node.attrs.message;
	}
})
</script>

<style lang="scss">
.tiptap {

	/* Vue component */
	.vue-component {
		border: 2px solid var(--theme--color);
		border-radius: 0.5rem;
		margin: 2rem 0;
		position: relative;

		label {
			background-color: var(--theme--color);
			border-radius: 0 0 0.5rem 0;
			color: var(--white);
			font-size: 0.75rem;
			font-weight: bold;
			padding: 0.25rem 0.5rem;
			position: absolute;
			top: 0;
		}

		.content {
			padding: 2rem 0.5rem;
			display: flex;
			justify-content: center;
		}

		.footer {
			margin: 0 0.5rem;
			margin-bottom: 0.5rem;
			display: flex;
			justify-content: space-between;
		}
	}
}
</style>

<style lang="css" scoped>
.reply :deep(.main) {
	margin: 40px;
}
</style>