<script lang="ts">
    import '../app.pcss';
</script>

<div class="flex flex-col min-h-screen " style="overflow: hidden;"> <!-- h-screen relative -->
    <main class="grow flex flex-col"> <!-- relative -->
        <slot />
    </main>
</div>