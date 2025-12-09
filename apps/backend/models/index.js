*** Begin Patch
*** Add File: apps/backend/models/index.js
+// Bridge file to re-export Sequelize models from packages/common/models.
+// This allows route files under apps/backend to import '../models' and access
+// models (User, Unit, Product, etc.) as well as the Sequelize instance.
+const models = require('../../packages/common/models');
+
+module.exports = models;
+
*** End Patch

*** Begin Patch
*** Add File: apps/backend/db/index.js
+// Bridge database query helper for legacy routes.
+// Converts '?' placeholders to '$1', '$2', etc. and executes the query via
+// Sequelize.  For SELECT statements, it returns [rows] so old code using
+// `const [rows] = await db.query(...)` still works.
+
+const sequelize = require('../../../database/database');
+const { QueryTypes } = require('sequelize');
+
+async function query(text, params = []) {
+  // Convert '?' placeholders to numbered parameters for Postgres.
+  let index = 0;
+  const sql = text.replace(/\?/g, () => {
+    index += 1;
+    return `$${index}`;
+  });
+
+  // Basic heuristic: treat statements starting with 'SELECT' as a SELECT query.
+  const isSelect = /^\s*SELECT/i.test(sql.trim());
+
+  const result = await sequelize.query(sql, {
+    bind: params,
+    type: isSelect ? QueryTypes.SELECT : QueryTypes.RAW,
+  });
+
+  // For SELECT queries, wrap the result array in another array to mimic
+  // MySQL's [rows] signature used in legacy code.
+  if (isSelect) {
+    return [result];
+  }
+  // Non-SELECT queries return [result, metadata] as per sequelize.query
+  return result;
+}
+
+module.exports = {
+  query,
+  sequelize,
+};
+
*** End Patch

*** Begin Patch
*** Update File: apps/backend/routes/auth.js
@@
-const { User, Unit } = require('../../../packages/common/models');
+// Import models from the local bridge so routes remain decoupled from deep package paths.
+const { User, Unit } = require('../models');
@@ router.post('/login', async (req, res) => {
-    const { rows } = await db.query(
-      "SELECT * FROM admins WHERE email = $1 AND activo = 1",
-      [email]
-    );
-
-    if (rows.length === 0) {
-      return res.send("Usuario o contraseña incorrectos");
-    }
-
-    const secret = process.env.JWT_SECRET;
-    if (!secret) {
-      return res.status(500).json({ error: 'JWT_SECRET no configurado' });
-    }
-
-    const payload = {
-      id: user.id,
-      email: user.email,
-      role: user.role,
-      unitId: user.unitId,
-      name: user.name,
-    };
-
-    const token = sign(payload, secret, { expiresIn: '12h' });
-
-    return res.json({
-      token,
-      admin: payload,
-      unidad: user.Unit ? user.Unit.name : null,
-    });
+    // Find the user by email and include the associated Unit.
+    const user = await User.findOne({
+      where: { email },
+      include: [{ model: Unit }],
+    });
+
+    // If no user exists or the password does not match, return a 401 error.
+    if (!user || !(await user.checkPassword(password))) {
+      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
+    }
+
+    const secret = process.env.JWT_SECRET;
+    if (!secret) {
+      return res.status(500).json({ error: 'JWT_SECRET no configurado' });
+    }
+
+    // Build the JWT payload using fields from the User model.
+    const payload = {
+      id: user.id,
+      email: user.email,
+      role: user.role,
+      unitId: user.unitId,
+      name: user.name,
+    };
+
+    const token = sign(payload, secret, { expiresIn: '12h' });
+
+    return res.json({
+      token,
+      admin: payload,
+      unidad: user.Unit ? user.Unit.name : null,
+    });
*** End Patch
