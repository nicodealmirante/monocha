module.exports = (sequelize, DataTypes) => {
  const Order = sequelize.define('Order', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    unitId: { type: DataTypes.INTEGER, allowNull: false },
    status: {
      type: DataTypes.ENUM('PENDIENTE', 'PREPARANDO', 'ENVIADO', 'ENTREGADO', 'CANCELADO'),
      defaultValue: 'PENDIENTE'
    },
    createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    deliveryDate: { type: DataTypes.DATE, allowNull: true },
    total: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    couponId: { type: DataTypes.INTEGER, allowNull: true }
  }, {
    tableName: 'orders',
    updatedAt: false
  });

  return Order;
};
