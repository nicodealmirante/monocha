const express = require("express");
const path = require("path");
const bcrypt = require("bcrypt");
const db = require("../sql/db");

const router = express.Router();

router.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "views", "login.html"));
});

router.post("/login", express.urlencoded({ extended: true }), async (req, res) => {
  const { email, password } = req.body;

  try {
    const { rows } = await db.query(
      "SELECT * FROM admins WHERE email = $1 AND activo = 1",
      [email]
    );

    if (rows.length === 0) {
      return res.send("Usuario o contraseña incorrectos");
    }

    const admin = rows[0];
    const ok = await bcrypt.compare(password, admin.password_hash);
    if (!ok) {
      return res.send("Usuario o contraseña incorrectos");
    }

    req.session.admin = {
      id: admin.id,
      email: admin.email,
      nombre: admin.nombre,
      rol: admin.rol,
      penal_id: admin.penal_id
    };

    if (admin.rol === "super") return res.redirect("/super");
    if (admin.rol === "penal") return res.redirect(`/penal/${admin.penal_id}`);

    return res.redirect("/login");
  } catch (err) {
    console.error("Error en login:", err);
    return res.status(500).send("Error en login");
  }
});

router.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
});

module.exports = router;
