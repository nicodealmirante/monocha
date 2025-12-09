const { Pool } = require("pg");
require("dotenv").config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL no está definido. Configura la variable de entorno para conectarte a la base de datos.");
}

const useSSL = process.env.NODE_ENV === "production" || process.env.DB_SSL === "true";

const pool = new Pool({
  connectionString,
  ssl: useSSL
    ? {
        require: true,
        rejectUnauthorized: false,
      }
    : false,
});

module.exports = pool;
