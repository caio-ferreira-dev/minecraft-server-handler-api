import express from "express";
import { spawn } from "child_process";
import util from "minecraft-server-util";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import "dotenv/config";
import dotEnv from "./utils/env.js";
import authenticateTokenMiddleware from "./middleware/auth.js";

const app = express();
app.use(express.json());

let minecraftServerProcess = null;

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
        expiresIn: "1h",
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

app.get("/status", authenticateTokenMiddleware, async (_req, res) => {
  if (!minecraftServerProcess) {
    return res.status(200).json({ status: "offline" });
  }

  try {
    const status = await util.status(
      dotEnv.serverIP,
      dotEnv.minecraftServerPort
    );

    res.status(200).json({
      status: "online",
      onlinePlayers: status.players.online,
      maxPlayers: status.players.max,
      version: status.version.name,
      motd: status.motd.clean,
    });
  } catch (error) {
    console.error("Erro ao obter status do servidor:", error);
    res.status(500).json({
      status: "offline",
      error: "Não foi possível se conectar ao servidor.",
    });
  }
});

app.listen(dotEnv.apiPort, () => {
  console.log(
    `API de controle do Minecraft rodando em http://localhost:${dotEnv.apiPort}`
  );
});
