<script>
  /** @type {HTMLDialogElement} */
  let dialog;

  /**
   * Opens the dialog
   */
  export function open() {
    dialog?.showModal();
  }

  /**
   * Closes the dialog
   */
  export function close() {
    dialog?.close();
  }

  let { 
    class: className = '',
    showCloseButton = true,
    ariaLabel = '닫기',
    children,
    ...restProps 
  } = $props();
</script>

<dialog
  bind:this={dialog}
  class="m-auto max-w-md bg-transparent backdrop:bg-black/80 backdrop:backdrop-blur-md {className}"
  {...restProps}>
  
  {#if showCloseButton}
    <!-- Close Button -->
    <form method="dialog" class="absolute top-4 right-4">
      <button 
        type="submit" 
        class="btn preset-ghost-surface-500 btn-sm rounded-full"
        aria-label={ariaLabel}>
        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </form>
  {/if}
  
  {@render children?.()}
</dialog>