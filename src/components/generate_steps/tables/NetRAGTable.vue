<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  ragResult: Object
})

const tableData = ref()

watch(props, () => {
  tableData.value = props.ragResult?.results
})

</script>


<template>
  <el-table v-if="tableData" :data="tableData">
    <el-table-column prop="title" label="标题" width="180" />
    <el-table-column prop="url" label="来源" width="180" />
    <el-table-column prop="content" label="内容" />
  </el-table>
</template>


<style scoped>

</style>