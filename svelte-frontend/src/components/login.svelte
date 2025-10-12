<script lang="ts">
  import type { ActionData } from "../routes/$types";

  // O SvelteKit fornece automaticamente os dados retornados pela Action
  export let form: ActionData;

  // Variáveis para vincular os inputs
  let user = "";
  let pass = "";
</script>

<div class="container">
  <form method="POST" action="?/login">
    <div class="input-container">
      <label class="subtitle" for="user">Usuário</label>
      <input
        class="common-text"
        type="text"
        name="user"
        id="user"
        bind:value={user}
      />
    </div>
    <div class="input-container">
      <label class="subtitle" for="">Senha</label>
      <input
        class="common-text"
        type="password"
        name="pass"
        id="pass"
        bind:value={pass}
      />
    </div>
    {#if form?.error}
      <p class="common-text" style="color: red;">{form.error}</p>
    {/if}
    <button class="subtitle" type="submit">Entrar</button>
  </form>
</div>

<style>
  .container {
    display: flex;
    justify-content: flex-end;
    width: 100vw;
    height: 100vh;
  }

  form {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 30px;

    background-color: #0f2043;
    width: 25%;
    padding: 0px 40px;
  }

  .input-container {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  @media (max-width: 768px) {
    form {
      width: 100%;
    }
  }

  input {
    width: 200px;
    height: 30px;
    padding: 0 10px;

    background-color: #375281;

    border: none;
    border-radius: 2px;
  }

  input:focus {
    outline: none;
    border: none;
    box-shadow: none;
  }

  button {
    align-self: center;
    margin-top: 30px;
    width: 200px;
    height: 50px;
    background-color: #23cd61;
    color: #ffffff;
    border: none;
    border-radius: 2px;
  }

  button:hover {
    cursor: pointer;
    transition: ease-in-out 300ms;
    background-color: #069d54;
  }
</style>
