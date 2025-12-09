// routes/admin.js
const express = require("express");
const router = express.Router();

const db = require("../../../packages/common/models");
const { User, Unit, Product, Order, OrderItem, sequelize } = db;
const { verifyToken } = require('../middleware/jwt');

router.use(verifyToken);

/* ============================
   👉 TEST ADMIN
============================ */
router.get("/", (req, res) => {
  res.json({ ok: true, msg: "Admin OK" });
});

/* ============================
   👉 LISTA PRODUCTOS (JSON)
   GET /admin/products
============================ */
router.get("/products", async (req, res) => {
  try {
    const products = await Product.findAll({
      order: [["name", "ASC"]],
    });

    res.json(products);
  } catch (err) {
    console.error("Error GET /admin/products:", err);
    res.status(500).json({ error: "Error obteniendo productos" });
  }
});

/* ============================
   👉 CREAR PRODUCTO SIMPLE
   POST /admin/products
============================ */
router.post("/products", async (req, res) => {
  try {
    const { name, price, unitId, description } = req.body;

    if (!name || !price) {
      return res.status(400).json({ error: "Falta nombre o precio" });
    }

    const product = await Product.create({
      name,
      price,
      description: description || "",
      unitId: unitId || null,
    });

    res.json({ ok: true, product });
  } catch (err) {
    console.error("Error POST /admin/products:", err);
    res.status(500).json({ error: "Error creando producto" });
  }
});

/* ============================
   👉 BORRAR PRODUCTO
   DELETE /admin/products/:id
============================ */
router.delete("/products/:id", async (req, res) => {
  try {
    const id = req.params.id;

    // borrar items de pedidos que lo usen (opcional, si no querés, comentá esto)
    await OrderItem.destroy({ where: { productId: id } });

    // borrar el producto
    const deleted = await Product.destroy({ where: { id } });

    if (!deleted) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    res.json({ ok: true });
  } catch (err) {
    console.error("Error DELETE /admin/products/:id:", err);
    res.status(500).json({ error: "Error borrando producto" });
  }
});

/* ============================
   👉 PANEL TABLA SIN FOTO
   GET /admin/products-panel
============================ */
router.get("/products-panel", async (req, res) => {
  try {
    const products = await Product.findAll({
      order: [["name", "ASC"]],
    });

    const rows = products
      .map(
        (p) => `
      <tr data-id="${p.id}">
        <td>${p.id}</td>
        <td>${p.name}</td>
        <td>$ ${Number(p.price || 0).toLocaleString("es-AR")}</td>
        <td>${p.description || ""}</td>
        <td>
          <button onclick="borrarProducto(${p.id})" style="background:#dc2626;color:#fff;border:none;border-radius:4px;padding:4px 8px;cursor:pointer;">
            Borrar
          </button>
        </td>
      </tr>
    `
      )
      .join("");

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<title>Admin productos – Chavito</title>
<style>
  body {
    font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    background: #0b0f19;
    color: #e5e7eb;
    padding: 20px;
  }
  

  tr:nth-child(even) td {
    background: #020617;
  }
  tr:nth-child(odd) td {
    background: #030712;
  }

  .btn {
    background:#2563eb;
    color:#fff;
    border:none;
    border-radius:999px;
    padding:6px 12px;
    cursor:pointer;
    font-size:0.85rem;
  }
</style>
</head>
<body>
  <div class="top-bar">
    <h1>Productos (tabla)</h1>
    <a href="/admin" class="btn" style="text-decoration:none;display:inline-block;">Volver a Admin</a>
  </div>
  <table>
    <thead>
      <tr>
        <th>ID</th>
        <th>Nombre</th>
        <th>Precio</th>
        <th>Descripción</th>
        <th>Acciones</th>
      </tr>
    </thead>
    <tbody>
      ${rows || "<tr><td colspan='5'>No hay productos cargados.</td></tr>"}
    </tbody>
  </table>

  <script>
    async function borrarProducto(id) {
      if (!confirm("¿Seguro que querés borrar el producto " + id + "?")) return;
      try {
        const res = await fetch("/admin/products/" + id, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" }
        });
        if (!res.ok) {
          const t = await res.text();
          console.error("Error:", t);
          alert("Error borrando producto");
          return;
        }
        // sacar fila de la tabla
        const tr = document.querySelector('tr[data-id="'+id+'"]');
        if (tr) tr.remove();
        alert("Producto borrado ✔️");
      } catch (err) {
        console.error(err);
        alert("Error en la petición");
      }
    }
  </script>
</body>
</html>`;

    res.send(html);
  } catch (err) {
    console.error("Error GET /admin/products-panel:", err);
    res.status(500).send("Error cargando panel");
  }
});

/* ============================
   👉 ÓRDENES (LISTA SIMPLE JSON)
   GET /admin/orders
============================ */
router.get("/orders", async (req, res) => {
  try {
    const orders = await Order.findAll({
      include: [{ model: Unit }],
      order: [["createdAt", "DESC"]],
    });

    res.json(
      orders.map((o) => ({
        id: o.id,
        number: o.number,
        unitId: o.unitId,
        unitName: o.Unit ? o.Unit.name : null,
        status: o.status,
        createdAt: o.createdAt,
        deliveryDate: o.deliveryDate,
        total: o.total,
      }))
    );
  } catch (err) {
    console.error("Error GET /admin/orders:", err);
    res.status(500).json({ error: "Error obteniendo órdenes" });
  }
});

/* ============================
   👉 REPORTE SIMPLE TOP PRODUCTOS
   GET /admin/report
============================ */
router.get("/report", async (req, res) => {
  try {
    const [rows] = await sequelize.query(`
      SELECT
        p.id,
        p.name,
        SUM(oi.quantity) AS total_cantidad
      FROM "order_items" oi
      JOIN "products" p ON p.id = oi."productId"
      GROUP BY p.id, p.name
      ORDER BY total_cantidad DESC
    `);

    res.json({ ok: true, productos: rows });
  } catch (err) {
    console.error("Error /admin/report:", err);
    res.status(500).json({ error: "Error generando reporte" });
  }
});

module.exports = router;
