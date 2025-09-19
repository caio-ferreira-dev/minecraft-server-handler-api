import React, { useState, useEffect } from "react";
import "./App.css";

// Definindo as interfaces para os dados da API
interface ServerStatus {
  online: boolean;
  players?: {
    online: number;
    max: number;
  };
  version?: {
    name_clean: string;
  };
}

interface LoginResponse {
  token: string;
}

const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL;
const SERVER_IP: string = import.meta.env.VITE_SERVER_IP;

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [serverStatus, setServerStatus] = useState<ServerStatus | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isActionLoading, setIsActionLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("jwtToken");
    if (token) {
      setIsLoggedIn(true);
      checkServerStatus();
    }
  }, []);

  const getToken = (): string | null => {
    return localStorage.getItem("jwtToken");
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      if (!API_BASE_URL || API_BASE_URL === "YOUR_API_BASE_URL") {
        throw new Error(
          "Por favor, configure o URL da API na variável `API_BASE_URL`."
        );
      }

      const response = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });
      if (!response.ok) {
        throw new Error("Credenciais inválidas.");
      }
      const data: LoginResponse = await response.json();
      localStorage.setItem("jwtToken", data.token);
      setIsLoggedIn(true);
      checkServerStatus();
    } catch (err: any) {
      setError(err.message || "Erro ao fazer login.");
    } finally {
      setIsLoading(false);
    }
  };

  const checkServerStatus = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (!SERVER_IP || SERVER_IP === "YOUR_SERVER_IP") {
        throw new Error(
          "Por favor, configure o IP do servidor na variável `SERVER_IP`."
        );
      }

      const response = await fetch(
        `https://api.mcstatus.io/v2/status/java/${SERVER_IP}`
      );

      if (!response.ok) {
        throw new Error("Não foi possível obter o status do servidor.");
      }
      const data: ServerStatus = await response.json();
      setServerStatus(data);
    } catch (err: any) {
      setServerStatus({ online: false });
      setError(err.message || "Erro ao verificar o status do servidor.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = async (action: "start" | "stop") => {
    setIsActionLoading(true);
    setError(null);
    try {
      if (!API_BASE_URL || API_BASE_URL === "YOUR_API_BASE_URL") {
        throw new Error(
          "Por favor, configure o URL da API na variável `API_BASE_URL`."
        );
      }
      const token = getToken();
      if (!token) {
        throw new Error("Token de autenticação não encontrado.");
      }
      const response = await fetch(`${API_BASE_URL}/${action}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Erro na ação de ${action}.`);
      }
      setTimeout(checkServerStatus, 5000);
    } catch (err: any) {
      setError(err.message || `Erro ao executar a ação de ${action}.`);
    } finally {
      setIsActionLoading(false);
    }
  };

  const renderLogin = () => (
    <div className="container">
      <div className="card login-card">
        <h2 className="title">Gerenciador do Servidor Minecraft</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleLogin} className="form">
          <div>
            <label className="sr-only" htmlFor="username">
              Usuário
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Usuário"
              required
              className="input-field"
            />
          </div>
          <div>
            <label className="sr-only" htmlFor="password">
              Senha
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Senha"
              required
              className="input-field"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className={`button ${
              isLoading ? "button-disabled" : "button-primary"
            }`}
          >
            {isLoading ? "Carregando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );

  const renderDashboard = () => (
    <div className="container">
      <div className="card dashboard-card">
        <h2 className="title">Painel de Controle</h2>
        {error && <div className="error-message">{error}</div>}

        <div className="status-section">
          <div className="status-header">
            <h3 className="section-title">Status do Servidor</h3>
            {isLoading ? (
              <span className="spinner">🔄</span>
            ) : (
              <button onClick={checkServerStatus} className="refresh-button">
                🔄
              </button>
            )}
          </div>

          {serverStatus && (
            <div className="status-info">
              <div className="status-indicator">
                <span
                  className={`status-dot ${
                    serverStatus.online ? "online" : "offline"
                  }`}
                ></span>
                <span className="status-text">
                  Status:{" "}
                  <span className="status-value">
                    {(serverStatus.online ? "online" : "offline").toUpperCase()}
                  </span>
                </span>
              </div>
              {serverStatus.online &&
                serverStatus.players &&
                serverStatus.version && (
                  <>
                    <p className="info-item">
                      Jogadores: {serverStatus.players.online} /{" "}
                      {serverStatus.players.max}
                    </p>
                    <p className="info-item">
                      Versão: {serverStatus.version.name_clean}
                    </p>
                  </>
                )}
            </div>
          )}
        </div>

        <div className="actions-section">
          <button
            onClick={() => handleAction("start")}
            disabled={isActionLoading || serverStatus?.online}
            className={`button ${
              isActionLoading || serverStatus?.online
                ? "button-disabled"
                : "button-start"
            }`}
          >
            {isActionLoading ? "Carregando..." : "▶ Iniciar"}
          </button>
          <button
            onClick={() => handleAction("stop")}
            disabled={isActionLoading || !serverStatus?.online}
            className={`button ${
              isActionLoading || !serverStatus?.online
                ? "button-disabled"
                : "button-stop"
            }`}
          >
            {isActionLoading ? "Carregando..." : "■ Parar"}
          </button>
        </div>
      </div>
    </div>
  );

  return <>{isLoggedIn ? renderDashboard() : renderLogin()}</>;
};

export default App;
