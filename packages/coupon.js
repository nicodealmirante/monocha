module.exports = (sequelize, DataTypes) => {
  const Coupon = sequelize.define('Coupon', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    code: { type: DataTypes.STRING, allowNull: false, unique: true },
    type: { type: DataTypes.ENUM('PORCENTAJE', 'FIJO'), allowNull: false },
    value: { type: DataTypes.INTEGER, allowNull: false },
    unitId: { type: DataTypes.INTEGER, allowNull: true },
    active: { type: DataTypes.BOOLEAN, defaultValue: true },
    expiresAt: { type: DataTypes.DATE, allowNull: true }
  }, {
    tableName: 'coupons'
  });

  return Coupon;
};
