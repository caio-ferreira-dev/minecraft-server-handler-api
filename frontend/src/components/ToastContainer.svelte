<script lang="ts">
  import { toasts, removeToast } from "$lib/stores/toast";

  const typeClasses = {
    success: "green",
    error: "red",
    info: "blue",
  };
</script>

<div class="fixed bottom-4 right-4 z-50 flex-col space-y-2">
  {#each $toasts as toast (toast.id)}
    <div class="{typeClasses[toast.type]} toast-div" role="alert">
      <span>{toast.message}</span>
      <button
        on:click={() => removeToast(toast.id)}
        class={typeClasses[toast.type]}
      >
        &times;
      </button>
    </div>
  {/each}
</div>

<style>
  .fixed {
    position: fixed;
  }
  .bottom-4 {
    bottom: 1rem;
  }
  .right-4 {
    right: 1rem;
  }
  .z-50 {
    z-index: 50;
  }
  .flex-col {
    display: flex;
    flex-direction: column;
    transition: ease-in 300ms;
  }
  .space-y-2 > :not([hidden]) ~ :not([hidden]) {
    margin-top: 0.5rem;
  }

  .toast-div {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-width: 250px;
    padding: 10px;
    border-radius: 6px;
    transition: ease-in-out 300ms;
  }

  .green {
    background-color: #23cd61;
  }

  .red {
    background-color: #cd2323;
  }

  .blue {
    background-color: #237bcd;
  }

  button {
    width: 20px;
    height: 20px;
    color: #ffffff;
    border: none;
    border-radius: 2px;
    font-size: 18px;
  }

  button:hover {
    cursor: pointer;
  }
</style>
