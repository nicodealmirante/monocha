const express = require('express');
const { sign } = require('../utils/jwt');
// Importa User y Unit desde el bridge
const { User, Unit } = require('../models');

const router = express.Router();

router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: 'Email y password son requeridos' });
  }

  try {
    // Busca al usuario e incluye su unidad
    const user = await User.findOne({
      where: { email },
      include: [{ model: Unit }],
    });

    // Verifica existencia y contraseña
    if (!user || !(await user.checkPassword(password))) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({ error: 'JWT_SECRET no configurado' });
    }

    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      unitId: user.unitId,
      name: user.name,
    };

    const token = sign(payload, secret, { expiresIn: '12h' });

    return res.json({
      token,
      admin: payload,
      unidad: user.Unit ? user.Unit.name : null,
    });
  } catch (err) {
    console.error('Error en /auth/login:', err);
    return res.status(500).json({ error: 'Error al iniciar sesión' });
  }
});

module.exports = router;
