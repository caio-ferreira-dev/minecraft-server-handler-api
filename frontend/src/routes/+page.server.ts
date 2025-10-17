import type { Actions } from "./$types";
import { fail, redirect } from "@sveltejs/kit";
import { PUBLIC_API_BASE_URL } from "$env/static/public";

export const actions: Actions = {
  login: async ({ request, cookies }) => {
    const data = await request.formData();
    const user = data.get("user");
    const pass = data.get("pass");

    if (!user || !pass) {
      return fail(400, { user, error: "Por favor, preencha todos os campos." });
    }

    try {
      const response = await fetch(`${PUBLIC_API_BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: user, password: pass }),
      });

      const responseText = await response.text();
      let responseData: any;
      let errorMessage = "Erro desconhecido na comunicação com a API.";

      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        responseData = responseText;
      }

      if (!response.ok) {
        // Tenta extrair a mensagem do JSON, se for um objeto
        if (typeof responseData === "object" && responseData.message) {
          errorMessage = responseData.message;
        }
        // Se foi texto puro (e não vazio)
        else if (typeof responseData === "string" && responseData.length > 0) {
          errorMessage = responseData;
        }

        return fail(response.status, {
          user,
          error: errorMessage,
        });
      }

      const loginData = responseData;

      // ✅ Segurança: Guarda o token em um cookie HTTP-only (A MELHOR PRÁTICA)
      cookies.set("jwtToken", loginData.token, {
        path: "/",
        httpOnly: true, // Impedir acesso via JavaScript no navegador
        secure: true, // Apenas HTTPS
        sameSite: "strict",
        maxAge: 60 * 60 * 24 * 7 * 8, // 8 semanas
      });

      // Redireciona o usuário após o login bem-sucedido
      throw redirect(303, "/");
    } catch (e) {
      console.error(e);
      return fail(500, { user, error: "Ocorreu um erro interno no servidor." });
    }
  },
  logout: async ({ cookies }) => {
    cookies.delete("jwtToken", { path: "/" });
    throw redirect(303, "/");
  },
  start: async ({ cookies }) => {
    const token = cookies.get("jwtToken");
    if (!token) {
      throw new Error("Token de autenticação não encontrado.");
    }
    const response = await fetch(`${PUBLIC_API_BASE_URL}/start`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      const errorText = await response.text();
      if (response.status === 403) {
        cookies.delete("jwtToken", { path: "/" });
        throw redirect(303, "/");
      } else {
        throw new Error(errorText || `Erro ao iniciar o servidor.`);
      }
    }
    return { success: true, message: await response.text(), action: "start" };
  },
  stop: async ({ cookies }) => {
    const token = cookies.get("jwtToken");
    if (!token) {
      throw new Error("Token de autenticação não encontrado.");
    }
    const response = await fetch(`${PUBLIC_API_BASE_URL}/stop`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      if (response.status === 403) {
        cookies.delete("jwtToken", { path: "/" });
        throw redirect(303, "/");
      } else {
        return {
          error: true,
          message: (await response.text()) || `Erro ao parar o servidor.`,
          action: "stop",
        };
      }
    }
    return { success: true, message: await response.text(), action: "stop" };
  },
};

export async function load({ cookies }) {
  const token = cookies.get("jwtToken");

  return {
    isAuthenticated: !!token,
  };
}
