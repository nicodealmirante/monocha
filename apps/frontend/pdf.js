const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

function generarEtiquetaPedido(pedido, items) {
  const dir = path.join(__dirname, "labels");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);
  const filePath = path.join(dir, `pedido-${pedido.numero}.pdf`);

  const doc = new PDFDocument({ size: "A6", margin: 10 });
  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);

  doc.fontSize(12).text("CHAVITO – ETIQUETA DE ENCOMIENDA", { align: "center" });
  doc.moveDown();

  doc.fontSize(10).text(`N° Pedido: ${pedido.numero}`);
  doc.text(`Penal: ${pedido.penal_nombre || pedido.penal_id}`);
  doc.text(`Entrega estimada: ${pedido.fecha_entrega_estimada}`);
  doc.moveDown();

  doc.text(`Comprador: ${pedido.nombre_comprador || ""} (DNI ${pedido.dni_comprador})`);
  doc.text(`Interno: ${pedido.nombre_interno || ""} (DNI ${pedido.dni_interno})`);
  doc.text(`Pabellón: ${pedido.pabellon}  Celda: ${pedido.celda}`);
  doc.moveDown();

  doc.text("Productos:", { underline: true });
  items.forEach(it => {
    doc.text(`- ${it.nombre} x${it.cantidad}  $${it.subtotal}`);
  });
  doc.moveDown();
  doc.text(`TOTAL: $${pedido.total}`, { align: "right" });

  doc.end();
  return filePath;
}

module.exports = { generarEtiquetaPedido };
