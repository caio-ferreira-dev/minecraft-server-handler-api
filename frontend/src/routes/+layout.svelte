<script lang="ts">
  import favicon from "$lib/assets/favicon.ico";
  import "../styles/app.global.css";
  import ToastContainer from "../components/ToastContainer.svelte";

  let { children } = $props();
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
</svelte:head>

{@render children?.()}

<ToastContainer />
