import axios from "axios";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

// Crear instancia de axios con configuración base
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor para manejo de errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Sube un archivo reintentando cuando la falla es de conectividad (fetch no llega
// a obtener respuesta, ej. "Failed to fetch"). Si el servidor sí responde (aunque
// sea con error), no se reintenta: esa falla ya no es de red sino del backend/Dropbox.
export async function uploadFileWithRetry(
  url: string,
  formData: FormData,
  maxRetries = 2,
): Promise<Response> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fetch(url, { method: "POST", body: formData });
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
  }

  const networkError = new Error(
    "No se pudo conectar con el servidor. Verifica tu conexión e inténtalo nuevamente.",
  );
  networkError.name = "NetworkError";
  console.error("Fallo de red tras reintentos al subir archivo:", lastError);
  throw networkError;
}
