const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Like = sequelize.define('Like', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    fromUserId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    toUserId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    isMatch: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    tableName: 'likes',
    timestamps: true,
    indexes: [
      { unique: true, fields: ['fromUserId', 'toUserId'] }
    ]
  });

  return Like;
};
