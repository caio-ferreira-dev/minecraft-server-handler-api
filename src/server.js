import express from "express";
import cors from "cors";
import { spawn } from "child_process";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import "dotenv/config";
import dotEnv from "./utils/env.js";
import authenticateTokenMiddleware from "./middleware/auth.js";
import { queryFull } from "minecraft-server-util";
import { createServer } from "http";
import { Server } from "socket.io";
import { currentLoad, mem } from "systeminformation";
import archiver from "archiver";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: dotEnv.frontendIP,
    methods: ["GET", "POST"],
  },
});
app.use(cors());
app.use(express.json());

let minecraftServerProcess = null;
let lastServerInfos = null;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FOLDER_TO_ZIP = path.join(__dirname, dotEnv.backupFolderPath);

app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const user = dotEnv.users.find((u) => u.username === username);
  if (!user) {
    return res.status(401).send("Credenciais inválidas.");
  }

  try {
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).send("Credenciais inválidas.");
    }

    const token = jwt.sign(
      { username: user.username },
      process.env.JWT_SECRET,
      {
        expiresIn: "90d",
      }
    );
    res.status(200).json({ token });
  } catch (error) {
    console.error("Erro no login:", error);
    res.status(500).send("Erro interno do servidor.");
  }
});

app.post("/start", authenticateTokenMiddleware, (_req, res) => {
  if (minecraftServerProcess) {
    return res.status(409).send("O servidor já está rodando.");
  }

  if (!dotEnv.serverJarFilePath && !dotEnv.serverFolderPath) {
    return res
      .status(500)
      .send("O caminho do arquivo do servidor não está configurado.");
  }

  minecraftServerProcess = spawn(dotEnv.serverJarFilePath, [], {
    cwd: dotEnv.serverFolderPath,
  });

  minecraftServerProcess.stdout.on("data", (data) => {
    console.log(`Minecraft Server: ${data}`);
  });

  minecraftServerProcess.stderr.on("data", (data) => {
    console.error(`Minecraft Server Error: ${data}`);
  });

  minecraftServerProcess.on("close", (code) => {
    console.log(`O servidor de Minecraft foi encerrado com código ${code}.`);
    minecraftServerProcess = null;
  });

  res.status(200).send("Servidor iniciado com sucesso.");
});

app.post("/stop", authenticateTokenMiddleware, (_req, res) => {
  if (!minecraftServerProcess) {
    return res.status(409).send("O servidor não está rodando.");
  }

  minecraftServerProcess.stdin.write("stop\n");

  res.status(200).send("Comando de parada enviado.");
});

app.get("/status", async (_req, res) => {
  try {
    const infos = await getInfos();
    res.status(200).json(infos);
  } catch (error) {
    console.log(error);
    res.status(200).json({ message: "Servidor offline" });
  }
});

app.get("/backup", async (_req, res) => {
  const archive = archiver("zip", {
    zlib: { level: 9 },
  });

  const now = new Date();

  res.attachment(`backup ${now.toISOString()}.zip`);

  archive.pipe(res);

  if (!fs.existsSync(FOLDER_TO_ZIP)) {
    return res.status(404).send("Pasta de backup não encontrada.");
  }

  try {
    const files = fs.readdirSync(FOLDER_TO_ZIP);
    console.log(`Conteúdo da pasta ${FOLDER_TO_ZIP}:`, files);
  } catch (e) {
    console.error("Erro ao ler o diretório:", e);
  }
  // 4. Adiciona a pasta ao arquivo compactado
  archive.directory(FOLDER_TO_ZIP, "compactada");

  // 5. Finaliza o arquivo (isso faz o stream fechar e enviar a resposta)
  archive.finalize();

  // Opcional: Tratamento de erros
  archive.on("error", (err) => {
    console.error("Erro ao compactar:", err);
    res.status(500).send("Erro interno do servidor ao compactar a pasta.");
  });

  // Opcional: Escuta o evento de finalização para logs
  archive.on("finish", () => {
    console.log("Pasta compactada e enviada com sucesso.");
  });
});

async function getInfos() {
  const serverInfos = await queryFull(
    dotEnv.minecraftServerIP,
    +dotEnv.minecraftServerPort
  );

  const playersPromises = serverInfos.players.list.map(async (playerName) => {
    const uuidResponse = await fetch(
      `https://api.minecraftservices.com/minecraft/profile/lookup/name/${playerName}`,
      { method: "GET" }
    );

    if (!uuidResponse.ok) {
      console.error(`Falha ao buscar UUID para ${playerName}`);
      return { playerName, playerPictureURL: null };
    }
    const uuidData = await uuidResponse.json();
    const playerUUID = uuidData.id;

    const playerPictureURL = `https://crafatar.com/avatars/${playerUUID}?size=32&overlay`;

    return {
      playerName,
      playerPictureURL,
    };
  });

  const resolvedPlayers = await Promise.all(playersPromises);

  return {
    online: true,
    players: resolvedPlayers,
    maxPlayers: serverInfos.players.max,
  };
}

async function getSystemMetrics() {
  try {
    const memData = await mem();
    const ramUsage = (1 - memData.available / memData.total) * 100;

    const cpuData = await currentLoad();
    const cpuUsage = cpuData.currentLoad;

    const metrics = [
      { resource: "CPU", value: `${cpuUsage.toFixed(2)}%` },
      { resource: "RAM", value: `${ramUsage.toFixed(2)}%` },
    ];

    return metrics;
  } catch (e) {
    console.error("Erro ao obter métricas do sistema:", e);
    return [];
  }
}

async function checkAndEmitStatus() {
  try {
    const simplifiedServerInfos = await getInfos();

    if (
      !lastServerInfos ||
      lastServerInfos.players.length !== simplifiedServerInfos.players.length
    ) {
      console.log(
        `Status atualizado. Jogadores: ${simplifiedServerInfos.players.length}`
      );

      io.emit("server_status", simplifiedServerInfos);
      lastServerInfos = simplifiedServerInfos;
    }
  } catch (error) {
    if (lastServerInfos && lastServerInfos.online) {
      console.log("Servidor caiu.");
      io.emit("server_status", {
        online: false,
        players: 0,
        max: lastServerInfos.max,
        error: error.message,
      });
      lastServerInfos = { online: false, players: 0, max: lastServerInfos.max };
    }
  }
}

async function checkAndEmitResources() {
  try {
    const resources = await getSystemMetrics();

    io.emit("server_resources", resources);
  } catch (error) {
    if (lastServerInfos && lastServerInfos.online) {
      console.log("Erro:");
      console.log(error);

      io.emit("server_resources", [
        { resource: "CPU", value: "0%" },
        { resource: "RAM", value: "0%" },
      ]);
    }
  }
}

const POLLING_INTERVAL_STATUS = 1000;
setInterval(checkAndEmitStatus, POLLING_INTERVAL_STATUS);
checkAndEmitStatus();

const POLLING_INTERVAL_RESOURCES = 750;
setInterval(checkAndEmitResources, POLLING_INTERVAL_RESOURCES);

httpServer.listen(dotEnv.apiPort, () => {
  console.log(
    `API de controle do Minecraft rodando em http://localhost:${dotEnv.apiPort}`
  );
});
