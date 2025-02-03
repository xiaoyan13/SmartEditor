<script setup>
import { watch, ref } from 'vue';

const props = defineProps({
  searchResult: Object
})

const tableData = ref()

watch(props, () => {
  tableData.value = props.searchResult?.organic
})


</script>


<template>
  <el-table v-if="tableData" :data="tableData">
    <el-table-column prop="title" label="标题" />
    <el-table-column prop="link" label="链接" />
  </el-table>
</template>


<style scoped>

</style>