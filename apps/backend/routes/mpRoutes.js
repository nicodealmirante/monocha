const express = require("express");
const mercadopago = require("mercadopago");
const router = express.Router();

const accessToken = process.env.MP_ACCESS_TOKEN;

// Configurar SDK (v1)
mercadopago.configure({
  access_token: accessToken
});

// GET /mp/crear?monto=1234&pedido=ABC123
router.get("/crear", async (req, res) => {
  try {
    const monto = Number(req.query.monto);
    const pedido = req.query.pedido;

    // Validaciones
    if (!pedido) {
      return res.status(400).json({ error: "Falta el pedido" });
    }

    if (!monto || isNaN(monto) || monto <= 0) {
      return res.status(400).json({ error: "Monto inválido" });
    }

    const preference = await mercadopago.preferences.create({
      items: [
        {
          title: `Pedido CHAVITO #${pedido}`,
          quantity: 1,
          unit_price: monto,
          currency_id: "ARS"
        },
                {
          title: `SERVICIO CHAVITO`,
          quantity: 1,
          unit_price: 25000,
          currency_id: "ARS"
        }
      ],
      back_urls: {
        success: `https://chavito.com.ar/pago-ok?pedido=${pedido}`,
        pending: `https://chavito.com.ar/pago-pendiente?pedido=${pedido}`,
        failure: `https://chavito.com.ar/pago-error?pedido=${pedido}`
      },
      auto_return: "approved",
      external_reference: pedido
    });

    return res.json({
      pedido,
      monto,
      id_preferencia: preference.body.id,
      link_pago: preference.body.init_point
    });

  } catch (err) {
    console.error("Error creando preferencia:", err);
    return res.status(500).json({ error: "Error creando preferencia" });
  }
});

module.exports = router;


