<script>
  import Login from "../components/login.svelte";
  import Painel from "../components/painel.svelte";
  import { addToast } from "$lib/stores/toast";

  export let data;
  export let form;

  // Toast
  $: if (form?.success) {
    (async () => {
      const message =
        form.message instanceof Promise ? await form.message : form.message;
      message === "Funcionalidade não implementada"
        ? addToast(message, "info")
        : addToast(message, "success");
    })();
  }

  $: if (form?.error) {
    const message = form.message;
    addToast(
      message ?? "Ocorreu um erro desconhecido.",
      message === "Funcionalidade não implementada" ? "info" : "error"
    );
  }
  // --
</script>

{#if data.isAuthenticated}
  <Painel />
{:else}
  <Login {form} />
{/if}
