// publicRoutes.js
const express = require("express");
const router = express.Router();

const {
  Unit,
  Product,
  Order,
  OrderItem,
  sequelize
} = require("../../packages/common/models");

const mercadopago = require("mercadopago");
mercadopago.configure({
  access_token: process.env.MP_ACCESS_TOKEN || ""
});

/* =============================
   👉 1) LISTA DE PENALES
============================= */
router.get("/api/penales", async (req, res) => {
  try {
    const penales = await Unit.findAll({
      where: { active: true },
      attributes: ["id", "name", "servicePrice", "calendarDays"],
      order: [["name", "ASC"]]
    });

    const mapped = penales.map(p => ({
      id: p.id,
      codigo: "PEN-" + String(p.id).padStart(3, "0"),
      nombre: p.name,
      calendario_dias: p.calendarDays || "[]"
    }));

    res.json(mapped);
  } catch (err) {
    console.error("Error /api/penales:", err);
    res.status(500).json({ error: "Error obteniendo penales" });
  }
});

/* =============================
   👉 2) PRODUCTOS POR PENAL
   (por ahora lista general, ignora penal_id)
============================= */
router.get("/api/productos", async (req, res) => {
  try {
    const penalId = req.query.penal_id; // lo dejamos por compatibilidad

    const productos = await Product.findAll({
      order: [["name", "ASC"]]
    });

    const result = productos.map(p => ({
      id: p.id,
      nombre: p.name,
      precio: p.price,
      precio_base: p.price,
      imagen: p.image || "",
      categoria: p.category || "General"
    }));

    res.json(result);
  } catch (err) {
    console.error("Error /api/productos:", err);
    res.status(500).json({ error: "Error cargando productos" });
  }
});

/* =============================
   👉 3) PRÓXIMA ENTREGA DEL PENAL
============================= */
router.get("/api/penales/:id/proxima-entrega", async (req, res) => {
  try {
    const penal = await Unit.findByPk(req.params.id);
    if (!penal) return res.status(404).json({ error: "Penal no encontrado" });

    const dias = penal.calendarDays ? JSON.parse(penal.calendarDays) : [];

    if (!dias.length) return res.json({ fecha_entrega_estimada: null });

    const hoy = new Date();
    let fecha = new Date(hoy);
    fecha.setDate(fecha.getDate() + 1);

    for (let i = 0; i < 14; i++) {
      const diaSemana = fecha.getDay() === 0 ? 7 : fecha.getDay();
      if (dias.includes(diaSemana)) {
        return res.json({
          fecha_entrega_estimada: fecha.toISOString().substring(0, 10),
        });
      }
      fecha.setDate(fecha.getDate() + 1);
    }

    res.json({ fecha_entrega_estimada: null });
  } catch (err) {
    console.error("Error /api/penales/:id/proxima-entrega:", err);
    res.status(500).json({ error: "Error calculando entrega" });
  }
});

/* =============================
   👉 4) CREAR PEDIDO (front público)
============================= */
router.post("/api/pedidos", async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const data = req.body;

    const numero = "CHAV-" + Date.now().toString().slice(-6);

    // 1) Armar detalle con precios
    let total = 0;
    const detalles = [];

    for (const item of data.items || []) {
      const product = await Product.findByPk(item.producto_id, { transaction: t });
      if (!product) continue;

      const unitPrice = Number(product.price) || 0;
      const qty = Number(item.cantidad) || 0;

      total += unitPrice * qty;

      detalles.push({
        productId: product.id,
        name: product.name,
        unitPrice,
        quantity: qty
      });
    }

    // 2) Crear el pedido
    const pedido = await Order.create({
      number: numero,
      unitId: data.penal_id,
      status: "PENDIENTE",      // debe coincidir con el enum de la tabla
      total
      // createdAt lo maneja Sequelize solo
    }, { transaction: t });

    // 3) Crear los items con name + unitPrice
    for (const det of detalles) {
      await OrderItem.create({
        orderId: pedido.id,
        productId: det.productId,
        name: det.name,
        unitPrice: det.unitPrice,
        quantity: det.quantity
      }, { transaction: t });
    }

    await t.commit();

    res.json({ ok: true, numero, id: pedido.id });

  } catch (err) {
    await t.rollback();
    console.error("Error /api/pedidos:", err);
    res.status(500).json({ error: "Error creando pedido" });
  }
});

/* =============================
   👉 5) CONSULTA POR CÓDIGO
============================= */
router.get("/api/pedidos/consulta", async (req, res) => {
  try {
    const numero = req.query.numero;
    if (!numero) return res.status(400).json({ error: "Falta código" });

    const pedido = await Order.findOne({
      where: { number: numero },
      include: [{ model: Unit }]
    });

    if (!pedido) return res.status(404).json({ error: "Pedido no encontrado" });

    res.json({
      pedido: {
        numero: pedido.number,
        estado: pedido.status,
        fecha_creacion: pedido.createdAt?.toISOString().substring(0, 10),
        fecha_entrega_estimada: pedido.estimatedDelivery || null,
        fecha_entrega_real: pedido.realDelivery || null,
        penal_codigo: "PEN-" + String(pedido.unitId).padStart(3, "0"),
        penal_nombre: pedido.Unit?.name || "",
        nombre_interno: pedido.inmateName || "",
        dni_interno: pedido.inmateDni || ""
      }
    });

  } catch (err) {
    console.error("Error /api/pedidos/consulta:", err);
    res.status(500).json({ error: "Error consultando pedido" });
  }
});

/* =============================
   👉 6) MERCADO PAGO – CREAR LINK
============================= */
router.get("/pago/crear", async (req, res) => {
  try {
    const monto = Number(req.query.monto);
    const pedido = req.query.pedido;

    if (!monto || !pedido) {
      return res.status(400).json({ error: "Datos inválidos" });
    }

    const preference = await mercadopago.preferences.create({
      items: [
        {
          title: `Pedido CHAVITO #${pedido}`,
          quantity: 1,
          unit_price: monto
        }
      ],
      back_urls: {
        success: process.env.MP_SUCCESS_URL || "https://chavito.com.ar/pago-ok",
        pending: process.env.MP_PENDING_URL || "https://chavito.com.ar/pago-pendiente",
        failure: process.env.MP_FAILURE_URL || "https://chavito.com.ar/pago-error"
      },
      auto_return: "approved",
      external_reference: pedido
    });

    const link_pago =
      preference.body.init_point || preference.body.sandbox_init_point;

    res.json({ link_pago });
  } catch (err) {
    console.error("Error /pago/crear:", err);
    res.status(500).json({ error: "Error creando pago" });
  }
});

module.exports = router;
