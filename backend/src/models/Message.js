const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Message = sequelize.define('Message', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    matchId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    senderId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    readAt: {
      type: DataTypes.DATE
    },
    messageType: {
      type: DataTypes.ENUM('text', 'image'),
      defaultValue: 'text'
    }
  }, {
    tableName: 'messages',
    timestamps: true
  });

  return Message;
};
