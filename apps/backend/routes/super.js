const express = require("express");
const path = require("path");
const db = require("../db");
const { requireSuper, requireLogin } = require("../middleware/auth");

const router = express.Router();

// Panel super admin
router.get("/super", requireLogin, requireSuper, (req, res) => {
  res.sendFile(path.join(__dirname, "..", "views", "panel_super.html"));
});

// Productos globales
router.get("/api/super/productos", requireLogin, requireSuper, async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, nombre, categoria_id, precio_base FROM productos ORDER BY id DESC"
    );
    res.json({ productos: rows });
  } catch (err) {
    console.error("Error listando productos globales:", err);
    res.status(500).json({ error: "Error listando productos" });
  }
});

// Crear producto global
router.post("/api/super/productos", requireLogin, requireSuper, express.json(), async (req, res) => {
  const { nombre, categoria_id, precio_base } = req.body;

  if (!nombre || !precio_base) {
    return res.status(400).json({ error: "Faltan datos" });
  }

  try {
    const [result] = await db.query(
      "INSERT INTO productos (nombre, categoria_id, precio_base) VALUES (?, ?, ?)",
      [nombre, categoria_id || null, precio_base]
    );
    res.json({ ok: true, id: result.insertId });
  } catch (err) {
    console.error("Error creando producto global:", err);
    res.status(500).json({ error: "Error creando producto" });
  }
});

// Editar producto global
router.put("/api/super/productos/:id", requireLogin, requireSuper, express.json(), async (req, res) => {
  const id = Number(req.params.id);
  const { nombre, categoria_id, precio_base } = req.body;

  if (!nombre || !precio_base) {
    return res.status(400).json({ error: "Faltan datos" });
  }

  try {
    await db.query(
      "UPDATE productos SET nombre = ?, categoria_id = ?, precio_base = ? WHERE id = ?",
      [nombre, categoria_id || null, precio_base, id]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error("Error actualizando producto global:", err);
    res.status(500).json({ error: "Error actualizando producto" });
  }
});


// Listar penales (incluye activos e inactivos)
router.get("/api/super/penales", requireLogin, requireSuper, async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, codigo, nombre, calendario_dias, COALESCE(activo, 0) AS activo FROM penales ORDER BY id ASC"
    );
    res.json({ penales: rows });
  } catch (err) {
    console.error("Error listando penales:", err);
    res.status(500).json({ error: "Error listando penales" });
  }
});

// Activar / desactivar penal
router.put("/api/super/penales/:id/estado", requireLogin, requireSuper, express.json(), async (req, res) => {
  const id = Number(req.params.id);
  const { activo } = req.body;
  try {
    await db.query(
      "UPDATE penales SET activo = ? WHERE id = ?",
      [activo ? 1 : 0, id]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error("Error actualizando estado penal:", err);
    res.status(500).json({ error: "Error actualizando estado penal" });
  }
});

module.exports = router;
