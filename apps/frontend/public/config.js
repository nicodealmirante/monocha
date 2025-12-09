const DEFAULT_API_BASE =
  typeof window !== "undefined"
    ? window.location.origin.replace(/\/$/, "") // mismo dominio que el front (Railway)
    : process.env.API_BASE || "http://localhost:3000"; // fallback para desarrollo

export { DEFAULT_API_BASE };
