const express = require("express");
const path = require("path");
const app = express();
app.use(express.static(path.join(__dirname, "public")));

/* ====== Start ====== */

const PORT = process.env.PORT || 3001;
app.listen(3008, () => {
  console.log("Servidor Chavito Penales escuchando en puerto", 3008);
});
