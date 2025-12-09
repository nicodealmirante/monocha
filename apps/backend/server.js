const cors = require("cors");

const morgan = require('morgan');
require('dotenv').config();
const { sequelize, User, Unit } = require('../../packages/common/models');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/', (req, res) => {
  res.json({ ok: true, msg: 'Chavito admin backend funcionando' });
});

app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);

// Inicializar DB
async function start() {
  try {
    await sequelize.authenticate();
    console.log('✅ Conectado a la base de datos');

    // 👉 Primera vez en Railway podés usar:
    // await sequelize.sync({ alter: true });
    // Luego dejalo solo en sync() para no tocar esquema.
    await sequelize.sync();

    // Crear SUPER_ADMIN de prueba si no existe
    const superEmail = 'admin@chavito.local';
    const existing = await User.findOne({ where: { email: superEmail } });
    if (!existing) {
      const unit = await Unit.create({
        name: 'Unidad Demo',
        active: true,
        servicePrice: 25000
      });

      await User.create({
        name: 'Super Admin',
        email: superEmail,
        passwordHash: 'admin123', // se hashea en hook
        role: 'SUPER_ADMIN',
        unitId: unit.id
      });

      console.log('👤 SUPER_ADMIN creado:', superEmail, 'pass: admin123');
    }

    app.listen(3000, () => {
      console.log('Servidor escuchando en puerto', 3000);
    });
  } catch (err) {
    console.error('Error inicializando app:', err);
    process.exit(1);
  }
}

start();
