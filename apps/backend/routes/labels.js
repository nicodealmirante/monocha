const express = require("express");
const PDFDocument = require("pdfkit");
const db = require("../db");
const { requireLogin } = require("../middleware/auth");

const router = express.Router();

// Etiqueta HTML simple (para vista/impresión rápida)
router.get("/admin/calcos/:pedidoId", requireLogin, async (req, res) => {
  const pedidoId = Number(req.params.pedidoId);

  try {
    const [rowsPedido] = await db.query(
      `SELECT p.*, pe.nombre AS penal_nombre
       FROM pedidos p
       LEFT JOIN penales pe ON pe.id = p.penal_id
       WHERE p.id = ?`,
      [pedidoId]
    );

    if (rowsPedido.length === 0) {
      return res.status(404).send("Pedido no encontrado");
    }

    const pedido = rowsPedido[0];

    const [items] = await db.query(
      `SELECT
         d.cantidad,
         d.precio_unitario,
         d.subtotal,
         pr.nombre AS producto_nombre
       FROM pedido_detalle d
       LEFT JOIN productos pr ON pr.id = d.producto_id
       WHERE d.pedido_id = ?`,
      [pedidoId]
    );

    let htmlItems = "";
    for (const it of items) {
      htmlItems += `
        <tr>
          <td>${it.producto_nombre}</td>
          <td style="text-align:center">${it.cantidad}</td>
          <td style="text-align:right">$ ${it.precio_unitario}</td>
          <td style="text-align:right">$ ${it.subtotal}</td>
        </tr>`;
    }

    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Etiqueta ${pedido.numero}</title>
<style>
  @page { size: A5; margin: 10mm; }
  body { font-family: system-ui, sans-serif; margin:0; padding:0; }
  .calco { border:2px solid #000; padding:10px; border-radius:8px; width:100%; box-sizing:border-box; }
  h1 { font-size:18px; margin:0 0 6px 0; text-align:center; }
  .pedido-num { font-size:14px; font-weight:700; text-align:center; margin-bottom:6px; }
  .fila { display:flex; justify-content:space-between; font-size:12px; margin-bottom:3px; }
  .label { font-weight:600; text-transform:uppercase; }
  table { width:100%; border-collapse:collapse; margin-top:6px; font-size:11px; }
  th, td { border:1px solid #000; padding:3px 4px; }
  th { background:#eee; }
  .total { margin-top:6px; text-align:right; font-weight:700; font-size:13px; }
</style>
</head>
<body>
  <div class="calco">
    <h1>CHAVITO - ENCOMIENDAS</h1>
    <div class="pedido-num">PEDIDO ${pedido.numero}</div>

    <div class="fila">
      <div><span class="label">Penal:</span> ${pedido.penal_nombre || ("ID " + pedido.penal_id)}</div>
      <div><span class="label">Pab/Celda:</span> ${pedido.pabellon || ""} / ${pedido.celda || ""}</div>
    </div>

    <div class="fila">
      <div><span class="label">Interno:</span> ${pedido.nombre_interno || ""}</div>
    </div>

    <div class="fila">
      <div><span class="label">DNI interno:</span> ${pedido.dni_interno || ""}</div>
    </div>

    <div class="fila">
      <div><span class="label">Comprador:</span> ${pedido.nombre_comprador || ""}</div>
    </div>

    <div class="fila">
      <div><span class="label">DNI comprador:</span> ${pedido.dni_comprador || ""}</div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Producto</th>
          <th style="width:40px;text-align:center;">Cant.</th>
          <th style="width:60px;text-align:right;">Precio</th>
          <th style="width:80px;text-align:right;">Subtotal</th>
        </tr>
      </thead>
      <tbody>
        ${htmlItems}
      </tbody>
    </table>

    <div class="total">
      TOTAL: $ ${pedido.total}
    </div>
  </div>
</body>
</html>`;

    res.send(html);
  } catch (err) {
    console.error("Error generando etiqueta HTML:", err);
    res.status(500).send("Error generando etiqueta");
  }
});

// Etiqueta PDF (descarga directa)
router.get("/admin/calcos/:pedidoId/pdf", requireLogin, async (req, res) => {
  const pedidoId = Number(req.params.pedidoId);

  try {
    const [rowsPedido] = await db.query(
      `SELECT p.*, pe.nombre AS penal_nombre
       FROM pedidos p
       LEFT JOIN penales pe ON pe.id = p.penal_id
       WHERE p.id = ?`,
      [pedidoId]
    );

    if (rowsPedido.length === 0) {
      return res.status(404).send("Pedido no encontrado");
    }

    const pedido = rowsPedido[0];

    const [items] = await db.query(
      `SELECT
         d.cantidad,
         d.precio_unitario,
         d.subtotal,
         pr.nombre AS producto_nombre
       FROM pedido_detalle d
       LEFT JOIN productos pr ON pr.id = d.producto_id
       WHERE d.pedido_id = ?`,
      [pedidoId]
    );

    const doc = new PDFDocument({ size: "A5", margin: 20 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="etiqueta-${pedido.numero}.pdf"`);

    doc.pipe(res);

    doc.fontSize(18).text("CHAVITO - ENCOMIENDAS", { align: "center" });
    doc.moveDown(0.3);
    doc.fontSize(14).text(`PEDIDO ${pedido.numero}`, { align: "center" });
    doc.moveDown(0.5);

    doc.fontSize(10);
    doc.text(`Penal: ${pedido.penal_nombre || ("ID " + pedido.penal_id)}`);
    doc.text(`Pab/Celda: ${pedido.pabellon || ""} / ${pedido.celda || ""}`);
    doc.text(`Interno: ${pedido.nombre_interno || ""}`);
    doc.text(`DNI interno: ${pedido.dni_interno || ""}`);
    doc.text(`Comprador: ${pedido.nombre_comprador || ""}`);
    doc.text(`DNI comprador: ${pedido.dni_comprador || ""}`);
    doc.moveDown(0.5);

    doc.text("Productos:", { underline: true });
    doc.moveDown(0.2);

    const startX = doc.x;
    let y = doc.y;

    doc.fontSize(9);
    doc.text("Producto", startX, y);
    doc.text("Cant.", startX + 200, y);
    doc.text("Precio", startX + 240, y);
    doc.text("Subt.", startX + 290, y);
    y += 12;
    doc.moveTo(startX, y).lineTo(startX + 330, y).stroke();
    y += 4;

    items.forEach(it => {
      doc.text(it.producto_nombre, startX, y, { width: 190 });
      doc.text(String(it.cantidad), startX + 200, y, { width: 30, align: "right" });
      doc.text(`$ ${it.precio_unitario}`, startX + 240, y, { width: 45, align: "right" });
      doc.text(`$ ${it.subtotal}`, startX + 290, y, { width: 45, align: "right" });
      y += 12;
    });

    doc.moveDown(0.5);
    doc.fontSize(11).text(`TOTAL: $ ${pedido.total}`, { align: "right" });

    doc.end();
  } catch (err) {
    console.error("Error generando etiqueta PDF:", err);
    res.status(500).send("Error generando etiqueta PDF");
  }
});

module.exports = router;
