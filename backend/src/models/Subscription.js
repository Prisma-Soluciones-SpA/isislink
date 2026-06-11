const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Subscription = sequelize.define('Subscription', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    planType: {
      type: DataTypes.ENUM('basic', 'medium', 'premium'),
      allowNull: false
    },
    likesLimit: {
      type: DataTypes.INTEGER,
      allowNull: true  // null = ilimitado (premium)
    },
    likesUsed: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    amount: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: false  // se activa al confirmar pago
    },
    transbankToken: {
      type: DataTypes.STRING
    },
    transbankOrderId: {
      type: DataTypes.STRING
    },
    transbankAuthCode: {
      type: DataTypes.STRING
    }
  }, {
    tableName: 'subscriptions',
    timestamps: true
  });

  return Subscription;
};
