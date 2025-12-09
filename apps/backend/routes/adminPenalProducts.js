const express = require("express");
const router = express.Router();

const { Product, Unit, PenalProduct, sequelize } = require("../models");
const { QueryTypes } = require("sequelize");

// GET /api/admin/penales → para llenar el selector
router.get("/penales", async (req, res) => {
  try {
    const penales = await Unit.findAll({
      attributes: ["id", "name"],
      order: [["name", "ASC"]],
    });

    res.json(penales);
  } catch (err) {
    console.error("Error obteniendo penales:", err);
    res.status(500).json({ error: "Error interno" });
  }
});

// GET /api/admin/penales/:penalId/products
// Devuelve TODOS los productos + flag visible para ese penal
router.get("/penales/:penalId/products", async (req, res) => {
  try {
    const penalId = parseInt(req.params.penalId, 10);
    if (!penalId) return res.status(400).json({ error: "penalId inválido" });

    const rows = await sequelize.query(
      `
      SELECT 
        p.id,
        p.name,
        p.price,
        p.image,
        COALESCE(pp.visible, false) AS visible
      FROM products p
      LEFT JOIN penal_products pp
        ON pp."productId" = p.id
       AND pp."penalId" = :penalId
      ORDER BY p.name ASC
      `,
      {
        replacements: { penalId },
        type: QueryTypes.SELECT,
      }
    );

    res.json(rows);
  } catch (err) {
    console.error("Error obteniendo productos por penal:", err);
    res.status(500).json({ error: "Error interno" });
  }
});

// POST /api/admin/penales/:penalId/products/:productId/visible
// Body: { visible: true/false }
router.post("/penales/:penalId/products/:productId/visible", async (req, res) => {
  try {
    const penalId = parseInt(req.params.penalId, 10);
    const productId = parseInt(req.params.productId, 10);
    const { visible } = req.body;

    if (!penalId || !productId || typeof visible !== "boolean") {
      return res.status(400).json({ error: "Datos inválidos" });
    }

    let row = await PenalProduct.findOne({
      where: { penalId, productId },
    });

    if (!row) {
      row = await PenalProduct.create({ penalId, productId, visible });
    } else {
      row.visible = visible;
      await row.save();
    }

    res.json({ ok: true, penalId, productId, visible: row.visible });
  } catch (err) {
    console.error("Error actualizando visible penal-producto:", err);
    res.status(500).json({ error: "Error interno" });
  }
});

module.exports = router;
