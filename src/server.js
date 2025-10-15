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

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: dotEnv.minecraftServerIP, // IP do frontend (altere caso necessário)
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(express.json());

let minecraftServerProcess = null;
let lastServerInfos = null;

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
    const serverInfos = await queryFull(
      dotEnv.minecraftServerIP,
      +dotEnv.minecraftServerPort
    );

    const simplifiedServerInfos = {
      online: true,
      players: serverInfos.players.list,
      maxPlayers: serverInfos.players.max,
    };

    res.status(200).json(simplifiedServerInfos);
  } catch (error) {
    console.log(error);
    res.status(200).send("Servidor offline");
  }
});

async function checkAndEmitStatus() {
  try {
    const serverInfos = await queryFull(
      dotEnv.minecraftServerIP,
      +dotEnv.minecraftServerPort
    );

    const simplifiedServerInfos = {
      online: true,
      players: serverInfos.players.list,
      maxPlayers: serverInfos.players.max,
    };

    // Verifica se o status mudou (principalmente o número de jogadores)
    if (
      !lastServerInfos ||
      lastServerInfos.players.length !== simplifiedServerInfos.players.length
    ) {
      console.log(
        `Status atualizado. Jogadores: ${simplifiedServerInfos.players.length}`
      );
      io.emit("server_status", simplifiedServerInfos); // Envia a atualização via WebSocket
      lastServerInfos = simplifiedServerInfos;
    }
  } catch (error) {
    // Trata a desconexão e avisa o frontend
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

const POLLING_INTERVAL = 5000;
setInterval(checkAndEmitStatus, POLLING_INTERVAL);
checkAndEmitStatus();

httpServer.listen(dotEnv.apiPort, () => {
  console.log(
    `API de controle do Minecraft rodando em http://localhost:${dotEnv.apiPort}`
  );
});
