const bcrypt = require('bcryptjs');

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    passwordHash: { type: DataTypes.STRING, allowNull: false },
    role: { type: DataTypes.ENUM('SUPER_ADMIN', 'ADMIN_UNIDAD'), allowNull: false },
    unitId: { type: DataTypes.INTEGER, allowNull: true }
  }, {
    tableName: 'users',
    hooks: {
      beforeCreate: async (user) => {
        if (user.passwordHash) {
          const salt = await bcrypt.genSalt(10);
          user.passwordHash = await bcrypt.hash(user.passwordHash, salt);
        }
      }
    }
  });

  User.prototype.checkPassword = async function (plain) {
    return bcrypt.compare(plain, this.passwordHash);
  };

  return User;
};
