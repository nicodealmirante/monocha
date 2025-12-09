const axios = require("axios");
const cheerio = require("cheerio");

function detectarCategoria(nombre = "") {
  const n = nombre.toLowerCase();
  if (n.includes("yerba") || n.includes("azúcar") || n.includes("harina") || n.includes("fideo")) return "Almacén";
  if (n.includes("shampoo") || n.includes("jabón") || n.includes("detergente") || n.includes("lavandina")) return "Higiene y Limpieza";
  if (n.includes("cerveza") || n.includes("vino") || n.includes("gaseosa") || n.includes("jugo")) return "Bebidas";
  if (n.includes("leche") || n.includes("yogur") || n.includes("manteca") || n.includes("queso")) return "Lácteos";
  return "Varios";
}

async function obtenerDatosCarrefour(url) {
  const { data: html } = await axios.get(url);
  const $ = cheerio.load(html);

  let nombre = "";
  let precioBase = 0;
  let imagen = "";
  let descripcion = "";

  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const txt = $(el).contents().text().trim();
      if (!txt) return;
      const json = JSON.parse(txt);
      const arr = Array.isArray(json) ? json : [json];
      for (const item of arr) {
        if (!item) continue;
        const type = item["@type"];
        if (type === "Product" || (Array.isArray(type) && type.includes("Product"))) {
          if (!nombre && item.name) nombre = item.name;
          if (!descripcion && item.description) descripcion = item.description;
          if (!imagen && item.image) {
            imagen = Array.isArray(item.image) ? item.image[0] : item.image;
          }
          if (item.offers && item.offers.price) {
            const p = parseFloat(String(item.offers.price).replace(",", "."));
            if (!isNaN(p)) precioBase = p;
          }
        }
      }
    } catch (e) {}
  });

  if (!nombre) {
    nombre = $("h1").first().text().trim() || "Producto sin nombre";
  }

  if (!precioBase) {
    const metaPrice = $("meta[itemprop='price']").attr("content");
    if (metaPrice) {
      const num = parseFloat(metaPrice.replace(",", "."));
      if (!isNaN(num)) precioBase = num;
    }
  }

  if (!imagen) {
    imagen = $("meta[property='og:image']").attr("content") || "";
  }

  const categoria = detectarCategoria(nombre);
  return { nombre, precioBase, imagen, descripcion, categoria };
}

module.exports = { obtenerDatosCarrefour };
