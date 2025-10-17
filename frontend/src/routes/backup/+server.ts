import { error } from "@sveltejs/kit";
import { API_BASE_URL } from "$env/static/private";

export async function POST({ request, cookies }) {
  const token = cookies.get("jwtToken");

  if (!token) {
    throw error(401, "Token de autenticação não encontrado.");
  }

  try {
    const response = await fetch(`${API_BASE_URL}/backup`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Erro na API de Backup:", response.status, errorText);
      throw error(
        response.status,
        `Falha ao gerar backup: ${response.statusText}`
      );
    }

    const arrayBuffer = await response.arrayBuffer();

    const contentDisposition = response.headers.get("Content-Disposition");
    let filename = "backup.zip";

    if (contentDisposition) {
      const match = contentDisposition.match(/filename="?([^"]+)"?/);
      if (match) {
        filename = match[1];
      }
    }

    return new Response(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Length": arrayBuffer.byteLength.toString(),
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (e) {
    console.error("Erro durante o fetch de backup:", e);
    throw error(500, "Erro interno ao processar o backup.");
  }
}
