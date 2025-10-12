<script>
  import Login from "../components/login.svelte";

  export let data;
  export let form;
</script>

{#if data.isAuthenticated}
  <h1>Você está logado</h1>
{:else}
  <Login {form} />
{/if}
