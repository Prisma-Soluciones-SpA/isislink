const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Transaction = sequelize.define('Transaction', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    subscriptionId: {
      type: DataTypes.UUID
    },
    planType: {
      type: DataTypes.STRING,
      allowNull: false
    },
    amount: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected', 'failed'),
      defaultValue: 'pending'
    },
    transbankToken: {
      type: DataTypes.STRING
    },
    transbankOrderId: {
      type: DataTypes.STRING
    },
    transbankResponse: {
      type: DataTypes.JSONB
    }
  }, {
    tableName: 'transactions',
    timestamps: true
  });

  return Transaction;
};
