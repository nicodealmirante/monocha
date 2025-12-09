const express = require("express");
const router = express.Router();

const { Product } = require("../models");

// GET /api/producto-json → lista todo
router.get("/", async (req, res) => {
  try {
    const productos = await Product.findAll({
      order: [["id", "ASC"]],
    });

    res.json({
      total: productos.length,
      productos,
    });
  } catch (err) {
    console.error("Error al obtener productos:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// POST /api/producto-json → crea en tabla products
router.post("/", async (req, res) => {
  try {
    const {
      nombre,
      precio,
      imagen,
      supermercado,
      descripcion,
      // lo que venga extra en el body se ignora si no está en el modelo
    } = req.body;

    if (!nombre || !precio) {
      return res.status(400).json({ error: "Falta nombre o precio" });
    }

    const nuevo = await Product.create({
      name: nombre,                 // ← columna name
      price: precio,                // ← columna price (int)
      image: imagen,                // ← columna image
      supermercado,                 // ← columna supermercado
      description: descripcion || "", // ← lleno description
      descripcion: descripcion || ""  // ← y también descripcion
      // unitId lo podés setear después si querés
    });

    res.status(201).json({
      ok: true,
      producto: nuevo,
    });
  } catch (err) {
    console.error("Error creando producto:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

module.exports = router;
