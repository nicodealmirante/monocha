function requireLogin(req, res, next) {
  if (!req.session || !req.session.admin) {
    return res.redirect("/login");
  }
  next();
}

function requireSuper(req, res, next) {
  if (!req.session || !req.session.admin || req.session.admin.rol !== "super") {
    return res.status(403).send("Acceso denegado");
  }
  next();
}

function requirePenal(req, res, next) {
  if (!req.session || !req.session.admin || req.session.admin.rol !== "penal") {
    return res.status(403).send("Acceso denegado");
  }
  next();
}

module.exports = { requireLogin, requireSuper, requirePenal };
