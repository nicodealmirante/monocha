// routes/adminPlanilla.js
const express = require("express");
const path = require("path");
const router = express.Router();
const { sequelize, Order, OrderItem, Product, Unit } = require("../models");
const { Op } = require("sequelize");

/**
 * 🔹 Página HTML del panel de planilla
 * GET /admin/planilla
 */
router.get("/admin/planilla", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "planilla.html"));
});

/**
 * 🔹 Días con pedidos (para armar tabla por día)
 * GET /admin/api/planilla/dias?unitId=1 (opcional)
 */
router.get("/admin/api/planilla/dias", async (req, res) => {
  try {
    const unitId = req.query.unitId || null;

    const whereUnit = unitId ? `WHERE "unitId" = :unitId` : "";

    const rows = await sequelize.query(
      `
      SELECT
        DATE("createdAt") as fecha,
        COUNT(*) as cant_pedidos
      FROM "orders"
      ${whereUnit}
      GROUP BY DATE("createdAt")
      ORDER BY fecha DESC
    `,
      {
        replacements: unitId ? { unitId } : {},
        type: sequelize.QueryTypes.SELECT,
      }
    );

    res.json({ dias: rows });
  } catch (err) {
    console.error("Error /admin/api/planilla/dias:", err);
    res.status(500).json({ error: "Error obteniendo días de planilla" });
  }
});

/**
 * 🔹 Detalle de un día (lista de pedidos + resumen productos)
 * GET /admin/api/planilla/dia?date=YYYY-MM-DD&unitId=1(opcional)
 */
router.get("/admin/api/planilla/dia", async (req, res) => {
  try {
    const dateStr = req.query.date;
    const unitId = req.query.unitId || null;

    if (!dateStr) {
      return res.status(400).json({ error: "Falta date=YYYY-MM-DD" });
    }

    const start = new Date(dateStr + "T00:00:00.000Z");
    const end = new Date(dateStr + "T23:59:59.999Z");

    const where = {
      createdAt: { [Op.between]: [start, end] },
    };
    if (unitId) where.unitId = unitId;

    const orders = await Order.findAll({
      where,
      include: [
        { model: Unit },
        {
          model: OrderItem,
          include: [Product],
        },
      ],
      order: [["createdAt", "ASC"]],
    });

    const pedidos = [];
    const mapaProductos = new Map();

    for (const o of orders) {
      const rawItems = o.OrderItems || o.items || [];

      const items = rawItems.map((it) => {
        const name = it.productName || it.name || it.Product?.name || "Producto";
        const qty = it.quantity || 0;

        // Acumular en resumen general
        const current = mapaProductos.get(name) || 0;
        mapaProductos.set(name, current + qty);

        return { name, quantity: qty };
      });

      pedidos.push({
        id: o.id,
        number: o.number,
        penal_nombre: o.Unit ? o.Unit.name : "",
        interno_nombre: o.inmateName,
        interno_dni: o.inmateDni,
        pabellon: o.pabellon,
        celda: o.celda,
        status: o.status,
        items,
        totalItems: items.reduce((acc, i) => acc + i.quantity, 0),
      });
    }

    const resumenProductos = Array.from(mapaProductos.entries())
      .map(([name, totalCantidad]) => ({ name, totalCantidad }))
      .sort((a, b) => a.name.localeCompare(b.name, "es"));

    res.json({
      date: dateStr,
      unitId: unitId || null,
      pedidos,
      resumenProductos,
    });
  } catch (err) {
    console.error("Error /admin/api/planilla/dia:", err);
    res.status(500).json({ error: "Error generando planilla del día" });
  }
});

module.exports = router;
