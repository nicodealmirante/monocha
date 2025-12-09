"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class PenalProduct extends Model {
    static associate(models) {
      // Opcional: relaciones
      // PenalProduct.belongsTo(models.Product, { foreignKey: "productId" });
      // PenalProduct.belongsTo(models.Unit, { foreignKey: "penalId", as: "penal" });
    }
  }

  PenalProduct.init(
    {
      productId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      penalId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      visible: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      sequelize,
      modelName: "PenalProduct",
      tableName: "penal_products",
      timestamps: true,
    }
  );

  return PenalProduct;
};
