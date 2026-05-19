<script setup lang="ts">
defineProps<{
  code: string;
  language?: string;
}>();
</script>

<template>
  <pre class="code-block"><span v-if="language" class="code-block__lang">{{ language }}</span><code>{{ code }}</code></pre>
</template>
