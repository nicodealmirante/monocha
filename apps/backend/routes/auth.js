const express = require('express');
const { sign } = require('../utils/jwt');
const { User, Unit } = require('../../../packages/common/models');

const router = express.Router();

router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: 'Email y password son requeridos' });
  }

  try {
    const user = await User.findOne({ where: { email }, include: [{ model: Unit }] });
    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const valid = await user.checkPassword(password);
    if (!valid) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
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
