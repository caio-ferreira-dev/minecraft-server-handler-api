<script lang="ts">
  let online = true;
  let onlinePlayers = "3/20";

  let serverResources = [
    { resource: "CPU", value: "80%" },
    { resource: "RAM", value: "40%" },
  ];

  let players = [{ playerName: "Divino", playerPicture: "http://" }];
</script>

<div class="container">
  <section>
    <div>
      <h1>Jogadores online</h1>
      <ul>
        {#each players as player}
          <li>
            <p>{player.playerName}</p>
          </li>
        {/each}
      </ul>
    </div>
  </section>

  <section>
    <div class="section-div first-section-div">
      <h1 style="margin-bottom: 10px;">Monitoramento</h1>
      <h2>
        Status: <span style={`color:${online ? "#2DEA72" : "#EA2D2D"}`}
          >Online</span
        >
      </h2>
      <h2>Jogadores: {onlinePlayers}</h2>
      {#each serverResources as resource}
        <div style="width: 100%">
          <h2 style="margin-bottom: 10px;">{resource.resource}</h2>
          <div class="progress-bar-container">
            <div style="width: {resource.value}"></div>
          </div>
          <p style="justify-self: flex-end;">{resource.value}</p>
        </div>
      {/each}
    </div>

    <div class="section-div second-section-div">
      <h1>Ações</h1>
      <form method="POST" action="?/start">
        <button class="start">Iniciar</button>
      </form>
      <form method="POST" action="?/stop">
        <button class="stop">Parar</button>
      </form>
      <form method="POST" action="?/backup">
        <button class="backup">Backup</button>
      </form>
    </div>
  </section>
</div>

<style>
  .container {
    display: flex;
    height: 100vh;
    align-items: center;
    justify-content: space-around;
  }

  .section-div {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }

  .first-section-div {
    gap: 30px;
  }

  .second-section-div {
    gap: 20px;
  }

  h1 {
    margin-bottom: 40px;
  }

  section {
    display: flex;
    flex-direction: column;
    width: 450px;
    height: 80vh;
    padding: 40px;
    justify-content: space-between;
    background-color: #0f2043;
  }

  .progress-bar-container {
    background-color: #365281;
    border-radius: 2px;
    width: 100%;
    height: 10px;
  }

  .progress-bar-container div {
    height: 100%;
    border-radius: 2px;
    background-image: linear-gradient(to right, #04dc79, #d0fdf3);
  }

  button {
    width: 100px;
    height: 40px;
    color: #ffffff;
    border: none;
    border-radius: 2px;
    font-size: 18px;
  }

  button:hover {
    cursor: pointer;
    transition: ease-in-out 300ms;
  }

  .start {
    background-color: #23cd61;
  }

  .start:hover {
    background-color: #069d54;
  }

  .stop {
    background-color: #cd2323;
  }

  .stop:hover {
    background-color: #9d0606;
  }

  .backup {
    background-color: #237bcd;
  }

  .backup:hover {
    background-color: #063b9d;
  }
</style>
