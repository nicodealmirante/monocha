module.exports = (sequelize, DataTypes) => {
  const Unit = sequelize.define('Unit', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    active: { type: DataTypes.BOOLEAN, defaultValue: true },
    servicePrice: { type: DataTypes.INTEGER, defaultValue: 25000 } // valor servicio base
  }, {
    tableName: 'units'
  });

  return Unit;
};
