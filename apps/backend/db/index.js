const sequelize = require('../../../database/database');
const { QueryTypes } = require('sequelize');

async function query(text, params = []) {
  // Reemplaza cada ? por $1, $2, etc.
  let index = 0;
  const sql = text.replace(/\?/g, () => {
    index += 1;
    return `$${index}`;
  });

  // Determina si es SELECT
  const isSelect = /^\s*SELECT/i.test(sql.trim());

  const result = await sequelize.query(sql, {
    bind: params,
    type: isSelect ? QueryTypes.SELECT : QueryTypes.RAW,
  });

  // Para SELECT, devuelve [rows] para emular el driver de MySQL
  if (isSelect) {
    return [result];
  }

  // Para otros, devuelve tal cual
  return result;
}

module.exports = {
  query,
  sequelize,
};
