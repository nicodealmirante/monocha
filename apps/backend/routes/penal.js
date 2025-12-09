const express = require("express");
const path = require("path");
const db = require("../db");
const { requireLogin } = require("../middleware/auth");

const router = express.Router();

// Panel penal (admin propio o super)
router.get("/penal/:penalId", requireLogin, async (req, res) => {
  const penalId = Number(req.params.penalId);

  if (req.session.admin.rol === "penal" && req.session.admin.penal_id !== penalId) {
    return res.status(403).send("Acceso denegado");
  }

  res.sendFile(path.join(__dirname, "..", "views", "panel_penal.html"));
});

// Productos del penal (global + penal_productos)
router.get("/api/penal/:penalId/productos", requireLogin, async (req, res) => {
  const penalId = Number(req.params.penalId);

  try {
    const [rows] = await db.query(
      `SELECT
         p.id,
         p.nombre,
         p.categoria_id,
         p.precio_base,
         COALESCE(pp.precio_penal, p.precio_base) AS precio_penal,
         COALESCE(pp.activo, 0) AS activo
       FROM productos p
       LEFT JOIN penal_productos pp
         ON pp.producto_id = p.id AND pp.penal_id = ?
       ORDER BY p.nombre`,
      [penalId]
    );

    res.json({ productos: rows });
  } catch (err) {
    console.error("Error listando productos penal:", err);
    res.status(500).json({ error: "Error listando productos" });
  }
});

// Agregar / actualizar producto en penal
router.post("/api/penal/:penalId/productos", requireLogin, express.json(), async (req, res) => {
  const penalId = Number(req.params.penalId);
  const { producto_id, precio_penal } = req.body;

  if (!producto_id) {
    return res.status(400).json({ error: "Falta producto_id" });
  }

  try {
    await db.query(
      `INSERT INTO penal_productos (penal_id, producto_id, precio_penal, activo)
       VALUES (?, ?, ?, 1)
       ON DUPLICATE KEY UPDATE
         precio_penal = VALUES(precio_penal),
         activo = 1`,
      [penalId, producto_id, precio_penal || null]
    );

    res.json({ ok: true });
  } catch (err) {
    console.error("Error guardando producto penal:", err);
    res.status(500).json({ error: "Error guardando" });
  }
});

// Desactivar producto en penal
router.delete("/api/penal/:penalId/productos/:productoId", requireLogin, async (req, res) => {
  const penalId = Number(req.params.penalId);
  const productoId = Number(req.params.productoId);

  try {
    await db.query(
      "UPDATE penal_productos SET activo = 0 WHERE penal_id = ? AND producto_id = ?",
      [penalId, productoId]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error("Error desactivando producto penal:", err);
    res.status(500).json({ error: "Error desactivando" });
  }
});

// Pedidos del penal
router.get("/api/penal/:penalId/pedidos", requireLogin, async (req, res) => {
  const penalId = Number(req.params.penalId);

  try {
    const [rows] = await db.query(
      `SELECT
         id,
         numero,
         nombre_interno,
         dni_interno,
         pabellon,
         celda,
         estado,
         fecha_creacion,
         total
       FROM pedidos
       WHERE penal_id = ?
       ORDER BY fecha_creacion DESC
       LIMIT 200`,
      [penalId]
    );

    res.json({ pedidos: rows });
  } catch (err) {
    console.error("Error listando pedidos penal:", err);
    res.status(500).json({ error: "Error listando pedidos" });
  }
});

module.exports = router;
