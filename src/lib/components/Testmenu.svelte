<script lang="ts">
  import { Menubar } from 'bits-ui';

  function handleClick(option: string) {
    alert(`Click recibido en opción: ${option}`);
  }
</script>

<Menubar.Root>
  <Menubar.Menu>
    <Menubar.Trigger
      class="flex h-10 items-center rounded-md px-4 bg-white text-gray-800 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
      aria-label="Archivo"
    >
      Archivo
    </Menubar.Trigger>

    <Menubar.Content
      as="portal"
      class="bg-white rounded-md shadow-lg border min-w-[200px] mt-1 z-[9999] cursor-pointer"
      style="outline: none;"
      tabindex="-1"
    >
      <Menubar.Item
        class="flex items-center gap-2 px-3 py-2 hover:bg-blue-500 hover:text-white rounded-md"
        onSelect={() => handleClick('Nuevo GPX')}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 5v14m-7-7h14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        Nuevo GPX
      </Menubar.Item>
      <Menubar.Separator />
      <Menubar.Item
        class="flex items-center gap-2 px-3 py-2 hover:bg-blue-500 hover:text-white rounded-md"
        onSelect={() => handleClick('Abrir GPX')}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M4 4h16v16H4z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
        </svg>
        Abrir GPX
      </Menubar.Item>
    </Menubar.Content>
  </Menubar.Menu>
</Menubar.Root>

<style>
  /* Opcional: para ajuste visual */
  :global(button) {
    all: unset;
  }
</style>
