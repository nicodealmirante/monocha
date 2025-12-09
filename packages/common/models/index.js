const sequelize = require('../../../database/database');
const { DataTypes } = require('sequelize');

const User = require('./user')(sequelize, DataTypes);
const Unit = require('./unit')(sequelize, DataTypes);
const Product = require('./product')(sequelize, DataTypes);
const Order = require('./order')(sequelize, DataTypes);
const OrderItem = require('./orderItem')(sequelize, DataTypes);
const Coupon = require('./coupon')(sequelize, DataTypes);

// Relaciones
Unit.hasMany(User, { foreignKey: 'unitId' });
User.belongsTo(Unit, { foreignKey: 'unitId' });

Unit.hasMany(Product, { foreignKey: 'unitId' });
Product.belongsTo(Unit, { foreignKey: 'unitId' });

Unit.hasMany(Order, { foreignKey: 'unitId' });
Order.belongsTo(Unit, { foreignKey: 'unitId' });

Order.hasMany(OrderItem, { foreignKey: 'orderId' });
OrderItem.belongsTo(Order, { foreignKey: 'orderId' });

Product.hasMany(OrderItem, { foreignKey: 'productId' });
OrderItem.belongsTo(Product, { foreignKey: 'productId' });

Coupon.hasMany(Order, { foreignKey: 'couponId' });
Order.belongsTo(Coupon, { foreignKey: 'couponId' });

module.exports = {
  sequelize,
  User,
  Unit,
  Product,
  Order,
  OrderItem,
  Coupon
};
