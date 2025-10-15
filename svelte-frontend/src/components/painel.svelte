<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { io, type Socket } from "socket.io-client";

  const API_URL = "http://localhost:4444";

  let online: boolean = $state(false);
  let players: { playerName: string; playerPictureURL: string }[] = $state([]);
  let onlinePlayers: string = $state(`0/0`);

  let socket: Socket;

  // Função para estabelecer a conexão e ouvir eventos
  onMount(async () => {
    const response = await fetch(`${API_URL}/status`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    const responseText = await response.text();
    const serverInfos = JSON.parse(responseText);

    online = serverInfos.online;
    onlinePlayers = `${serverInfos.players.length}/${serverInfos.maxPlayers}`;

    if (serverInfos.players.length > 0) {
      players = serverInfos.players;
    }

    socket = io(API_URL);

    socket.on("server_status", (data) => {
      console.log("Dados recebidos via WebSocket:", data);

      online = data.online;
      onlinePlayers = `${data.players.length}/${data.maxPlayers}`;

      // ⚠️ Os dados do Query Protocol fornecem a lista de nomes.
      // Se 'data.list' (nomes dos jogadores) estiver disponível, use-o.
      if (data.players && Array.isArray(data.players)) {
        // Mapeia a lista de nomes para o formato do seu objeto 'players'
        players = serverInfos.players;
      } else {
        players = [];
      }

      // 💡 Se você estiver enviando dados de recursos:
      // if (data.cpuUsage) {
      //     serverResources[0].value = `${data.cpuUsage}%`;
      // }
      // if (data.ramUsage) {
      //     serverResources[1].value = `${data.ramUsage}%`;
      // }
    });

    socket.on("disconnect", () => {
      console.log("Desconectado do servidor WebSocket.");
      online = false;
    });
  });

  onDestroy(() => {
    if (socket) {
      socket.disconnect();
    }
  });

  let serverResources = [
    { resource: "CPU", value: "80%" },
    { resource: "RAM", value: "40%" },
  ];
</script>

<div class="container">
  <section>
    <div>
      <h1>Jogadores online</h1>
      <ul>
        {#each players as player}
          <li>
            <p class="list-index">{players.indexOf(player) + 1}</p>
            <img src={player.playerPictureURL} alt="player profile pic" />
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
          >{online ? "Online" : "Offline"}</span
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

    <div class="section-div">
      <h1>Ações</h1>
      <div class="action-buttons">
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

  h1 {
    margin-bottom: 40px;
  }

  section {
    display: flex;
    flex-direction: column;
    padding: 40px;
    justify-content: space-between;
    background-color: #0f2043;
  }

  li {
    background-color: #1b2d51;
    display: flex;
    align-items: center;
    gap: 20px;
    padding: 20px;
  }

  .list-index {
    text-align: center;
    width: 20px;
  }

  img {
    width: 32px;
    height: 32px;
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

  .action-buttons {
    display: flex;
    flex-wrap: nowrap;
    gap: 20px;
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

  @media (max-width: 425px) {
    .container {
      flex-direction: column;
    }

    section {
      width: 100%;
    }

    .action-buttons {
      flex-wrap: wrap;
    }
  }

  @media (min-width: 426px) {
    section {
      width: 450px;
      height: 80vh;
    }
  }
</style>
