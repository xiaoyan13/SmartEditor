<script setup>
import { watch, computed, onBeforeUnmount } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import TextStyle from '@tiptap/extension-text-style'
import FontFamily from '@tiptap/extension-font-family'
import Typography from '@tiptap/extension-typography'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import CharacterCount from '@tiptap/extension-character-count'
import Highlight from '@tiptap/extension-highlight'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Table from '@tiptap/extension-table'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import TableRow from '@tiptap/extension-table-row'
import { Markdown } from 'tiptap-markdown';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import css from 'highlight.js/lib/languages/css'
import js from 'highlight.js/lib/languages/javascript'
import ts from 'highlight.js/lib/languages/typescript'
import html from 'highlight.js/lib/languages/xml'
import { createLowlight } from 'lowlight'
import { Underline } from '@tiptap/extension-underline'
import { TextAlign } from '@tiptap/extension-text-align'
import { Superscript } from '@tiptap/extension-superscript'
import { Subscript } from '@tiptap/extension-subscript'
import { Color } from '@tiptap/extension-color'
import fontFamily from "../utils/fontFamily.js"
import colorList from "../utils/colors.js"

defineProps({
    showHeader: {
        type: Boolean,
        default: true,
    }
})
const content = defineModel()

watch(content, (newContent) => {
    const isSame = editor.value.getHTML() === newContent
    if (isSame) {
        return
      }
      editor.value.commands.setContent(newContent, false);
      editor.value.storage.markdown.getMarkdown();
  }
);

const lowlight = createLowlight()
lowlight.register({ html, ts, css, js })

// editor
const editor = useEditor({
    content: content.value,
    extensions: [
        StarterKit.configure({ codeBlock: false }),
        Markdown,
        Underline,
        TextAlign.configure({ types: ['heading', 'paragraph'] }),
        Superscript,
        Subscript,
        TextStyle,
        Color,
        FontFamily,
        Typography,
        TaskList,
        TaskItem,
        CharacterCount,
        Highlight.configure({ multicolor: true }),
        Link,
        Image,
        Table.configure({ resizable: true }),
        TableRow,
        TableHeader,
        TableCell,
        CodeBlockLowlight.configure({ lowlight }),
    ],
    onUpdate: () => content.value = editor.value.getHTML()
})

// 计算标题级别
const headingLevel = computed(() => {
  for (let level = 1; level <= 4; level++) {
    if (editor.value.isActive('heading', { level })) {
      return level;
    }
  }
  return 0; // 正文
});
// 计算标题样式
const headingStyle = computed(() => {
  if (headingLevel.value == 0) {
    return editor.value.isActive('paragraph');
  }
  return editor.value.isActive('heading', { level: headingLevel.value });
});
// 设置链接
const setLink = () => {
  const previousUrl = editor.value.getAttributes('link').href
  const url = window.prompt('URL', previousUrl)
  if (url === null) return // Abort if the user cancels
  if (url === '') {
    editor.value.chain().focus().extendMarkRange('link').unsetLink().run()
    return
  }
  editor.value.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
};
// 添加图片
const addImage = () => {
  const url = window.prompt('URL')
  if (url === null) return // Abort if the user cancels
  editor.value.chain().focus().setImage({ src: url }).run()
}


onBeforeUnmount(() => {
  if (editor.value) {
    editor.value.destroy();
  }
});

</script>


<template>
    <div class="common-editor">
        <div v-if="editor && showHeader" class="common-editor-header">
            <el-tooltip content="撤回" :hide-after="0">
                <button @click="editor.chain().focus().undo().run()" :disabled="!editor.can().chain().focus().undo().run()">
                <i class="ri-arrow-go-back-line"></i>
                </button>
            </el-tooltip>
            <el-tooltip content="取消撤回" :hide-after="0">
                <button @click="editor.chain().focus().redo().run()" :disabled="!editor.can().chain().focus().redo().run()">
                <i class="ri-arrow-go-forward-line"></i>
                </button>
            </el-tooltip>
            <el-tooltip content="清除样式" :hide-after="0">
                <button @click="editor.chain().focus().clearNodes().unsetAllMarks().run()">
                <i class="ri-eraser-fill"></i>
                </button>
            </el-tooltip>
            <el-divider direction="vertical" />
            <el-tooltip content="段落级别" :hide-after="0">
                <el-dropdown trigger="click">
                <button :class="{ 'is-active': headingStyle }">
                    <i v-if="headingLevel == 0" class="ri-paragraph"></i>
                    <i v-else :class="`ri-h-${headingLevel}`"></i>
                    <i class="ri-arrow-drop-down-fill"></i>
                </button>
                <template #dropdown>
                    <el-dropdown-menu>
                    <el-dropdown-item @click="editor.chain().focus().setParagraph().run()">
                        <i class="ri-paragraph"></i>正文</el-dropdown-item>
                    <el-dropdown-item v-for="index in 4" :key="index"
                        @click="editor.chain().focus().toggleHeading({ level: index }).run()">
                        <i :class="`ri-h-${index}`"></i>标题{{ index }}</el-dropdown-item>
                    </el-dropdown-menu>
                </template>
                </el-dropdown>
            </el-tooltip>
            <el-tooltip content="字体" :hide-after="0">
                <el-dropdown trigger="click">
                <button>
                    <i class="ri-font-family"></i>
                    <i class="ri-arrow-drop-down-fill"></i>
                </button>
                <template #dropdown>
                    <el-dropdown-menu>
                    <el-dropdown-item @click="editor.chain().focus().unsetFontFamily().run()">默认</el-dropdown-item>
                    <el-dropdown-item v-for="font in fontFamily" :key="font"
                        @click="editor.chain().focus().setFontFamily(font).run()">
                        <div :style="{ fontFamily: font }">{{ font }}</div>
                    </el-dropdown-item>
                    </el-dropdown-menu>
                </template>
                </el-dropdown>
            </el-tooltip>
            <el-tooltip content=" 加粗" :hide-after="0">
                <button @click="editor.chain().focus().toggleBold().run()"
                :disabled="!editor.can().chain().focus().toggleBold().run()" :class="{ 'is-active': editor.isActive('bold') }">
                <i class="ri-bold"></i>
                </button>
            </el-tooltip>
            <el-tooltip content="斜体" :hide-after="0">
                <button @click="editor.chain().focus().toggleItalic().run()"
                :disabled="!editor.can().chain().focus().toggleItalic().run()"
                :class="{ 'is-active': editor.isActive('italic') }">
                <i class="ri-italic"></i>
                </button>
            </el-tooltip>
            <el-tooltip content="下划线" :hide-after="0">
                <button @click="editor.chain().focus().toggleUnderline().run()"
                :disabled="!editor.can().chain().focus().toggleUnderline().run()"
                :class="{ 'is-active': editor.isActive('underline') }">
                <i class="ri-underline"></i>
                </button>
            </el-tooltip>
            <el-tooltip content="删除线" :hide-after="0">
                <button @click="editor.chain().focus().toggleStrike().run()"
                :disabled="!editor.can().chain().focus().toggleStrike().run()"
                :class="{ 'is-active': editor.isActive('strike') }">
                <i class="ri-strikethrough"></i>
                </button>
            </el-tooltip>
            <el-tooltip content="文字颜色" :hide-after="0">
                <span>
                <el-popover trigger="click" width="250">
                    <div class="color-box">
                    <div class="color-item" v-for="color in colorList" :key="color"
                        @click="editor.chain().focus().setColor(color).run()" :style="{ backgroundColor: color }"></div>
                    </div>
                    <template #reference>
                    <button>
                        <i class="ri-font-color"></i>
                        <i class="ri-arrow-drop-down-fill"></i>
                    </button>
                    </template>
                </el-popover>
                </span>
            </el-tooltip>
            <el-tooltip content="文本高亮" :hide-after="0">
                <button @click="editor.chain().focus().toggleHighlight().run()"
                :class="{ 'is-active': editor.isActive('highlight') }">
                <i class="ri-mark-pen-line"></i>
                </button>
            </el-tooltip>
            <el-tooltip content="代码" :hide-after="0">
                <button @click="editor.chain().focus().toggleCode().run()"
                :disabled="!editor.can().chain().focus().toggleCode().run()" :class="{ 'is-active': editor.isActive('code') }">
                <i class="ri-code-line"></i>
                </button>
            </el-tooltip>
            <el-tooltip content="代码块" :hide-after="0">
                <button @click="editor.chain().focus().toggleCodeBlock().run()"
                :class="{ 'is-active': editor.isActive('codeBlock') }">
                <i class="ri-code-box-line"></i>
                </button>
            </el-tooltip>
            <el-tooltip content="上标" :hide-after="0">
                <button @click="editor.chain().focus().toggleSuperscript().run()"
                :disabled="!editor.can().chain().focus().toggleSuperscript().run()"
                :class="{ 'is-active': editor.isActive('superscript') }">
                <i class="ri-superscript"></i>
                </button>
            </el-tooltip>
            <el-tooltip content="下标" :hide-after="0">
                <button @click="editor.chain().focus().toggleSubscript().run()"
                :disabled="!editor.can().chain().focus().toggleSubscript().run()"
                :class="{ 'is-active': editor.isActive('subscript') }">
                <i class="ri-subscript"></i>
                </button>
            </el-tooltip>
            <el-tooltip content="链接" :hide-after="0">
                <button @click="setLink()" :class="{ 'is-active': editor.isActive('link') }">
                <i class="ri-link"></i>
                </button>
            </el-tooltip>
            <el-tooltip content="取消链接" :hide-after="0">
                <button @click="editor.chain().focus().unsetLink().run()" :disabled="!editor.isActive('link')">
                <i class="ri-link-unlink"></i>
                </button>
            </el-tooltip>
            <el-tooltip content="插入图片" :hide-after="0">
                <button @click="addImage">
                <i class="ri-image-add-line"></i>
                </button>
            </el-tooltip>
            <el-tooltip content="表格" :hide-after="0">
                <span>
                <el-dropdown trigger="click">
                    <button>
                    <i class="ri-table-view"></i>
                    <i class="ri-arrow-drop-down-fill"></i>
                    </button>
                    <template #dropdown>
                    <el-dropdown-menu>
                        <el-dropdown-item
                        @click="editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()">插入表格</el-dropdown-item>
                        <el-dropdown-item divided @click="editor.chain().focus().addRowAfter().run()">添加行</el-dropdown-item>
                        <el-dropdown-item @click="editor.chain().focus().deleteRow().run()">删除行</el-dropdown-item>
                        <el-dropdown-item divided @click="editor.chain().focus().addColumnAfter().run()">添加列</el-dropdown-item>
                        <el-dropdown-item @click="editor.chain().focus().deleteColumn().run()">删除列</el-dropdown-item>
                        <el-dropdown-item divided @click="editor.chain().focus().mergeCells().run()">合并单元格</el-dropdown-item>
                        <el-dropdown-item @click="editor.chain().focus().splitCell().run()">拆分单元格</el-dropdown-item>
                        <el-dropdown-item @click="editor.chain().focus().deleteTable().run()">删除表格</el-dropdown-item>
                    </el-dropdown-menu>
                    </template>
                </el-dropdown>
                </span>
            </el-tooltip>
            <el-divider direction="vertical" />
            <el-tooltip content="无序列表" :hide-after="0">
                <button @click="editor.chain().focus().toggleBulletList().run()"
                :class="{ 'is-active': editor.isActive('bulletList') }">
                <i class="ri-list-unordered"></i>
                </button>
            </el-tooltip>
            <el-tooltip content="有序列表" :hide-after="0">
                <button @click="editor.chain().focus().toggleOrderedList().run()"
                :class="{ 'is-active': editor.isActive('orderedList') }">
                <i class="ri-list-ordered-2"></i>
                </button>
            </el-tooltip>
            <el-tooltip content="任务列表" :hide-after="0">
                <button @click="editor.chain().focus().toggleTaskList().run()"
                :class="{ 'is-active': editor.isActive('taskList') }">
                <i class="ri-task-line"></i>
                </button>
            </el-tooltip>
            <el-tooltip content="左对齐" :hide-after="0">
                <button @click="editor.chain().focus().setTextAlign('left').run()"
                :class="{ 'is-active': editor.isActive('textAlign', { align: 'left' }) }">
                <i class="ri-align-left"></i>
                </button>
            </el-tooltip>
            <el-tooltip content="居中对齐" :hide-after="0">
                <button @click="editor.chain().focus().setTextAlign('center').run()"
                :class="{ 'is-active': editor.isActive('textAlign', { align: 'center' }) }">
                <i class="ri-align-center"></i>
                </button>
            </el-tooltip>
            <el-tooltip content="右对齐" :hide-after="0">
                <button @click="editor.chain().focus().setTextAlign('right').run()"
                :class="{ 'is-active': editor.isActive('textAlign', { align: 'right' }) }">
                <i class="ri-align-right"></i>
                </button>
            </el-tooltip>
            <el-tooltip content="引用" :hide-after="0">
                <button @click="editor.chain().focus().toggleBlockquote().run()"
                :class="{ 'is-active': editor.isActive('blockquote') }">
                <i class="ri-double-quotes-l"></i>
                </button>
            </el-tooltip>
            <el-tooltip content="强制换行" :hide-after="0">
                <button @click="editor.chain().focus().setHardBreak().run()">
                <i class="ri-text-wrap"></i>
                </button>
            </el-tooltip>
            <el-tooltip content="分隔线" :hide-after="0">
                <button @click="editor.chain().focus().setHorizontalRule().run()">
                <i class="ri-separator"></i>
                </button>
            </el-tooltip>
        </div>
        <div class="main">
            <EditorContent :editor="editor" />
        </div>
    </div>
  </template>


<style scoped>
.common-editor-header {
	height: 6vh;
	display: flex;
	justify-content: center;
	align-items: center;
	background-color: var(--white);
	border: 1px solid var(--white);
	border-radius: 10px;

	button:not(.el-button) {
		margin: 0 1px;
		padding: 8px 10px;
		border: none;
		border-radius: 5px;
		background-color: var(--white);
		cursor: pointer;
		transition: background-color 0.3s;

		&:hover {
			background-color: var(--el-color-primary-light-9);
		}

		&.is-active {
			background-color: var(--el-color-primary-light-9);
		}
	}

	.el-button {
		margin: 0 1px;
		padding: 8px 10px;
		border-radius: 5px;
		background-color: var(--white);
	}
}

.main {
    margin: 10% 5%;
    margin-top: 30px;
}
</style>