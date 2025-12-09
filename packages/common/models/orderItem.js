module.exports = (sequelize, DataTypes) => {
  const OrderItem = sequelize.define('OrderItem', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    orderId: { type: DataTypes.INTEGER, allowNull: false },
    productId: { type: DataTypes.INTEGER, allowNull: true }, // null si es servicio base
    name: { type: DataTypes.STRING, allowNull: false },
    unitPrice: { type: DataTypes.INTEGER, allowNull: false },
    quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    isService: { type: DataTypes.BOOLEAN, defaultValue: false }
  }, {
    tableName: 'order_items',
    timestamps: false
  });

  return OrderItem;
};
