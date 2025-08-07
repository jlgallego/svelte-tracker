<script lang="ts">
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<h1>{data.post.title}</h1>
<div><p class="font-mono" >{@html data.post.content}</p></div>