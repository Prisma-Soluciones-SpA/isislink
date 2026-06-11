const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Match = sequelize.define('Match', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    user1Id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    user2Id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    compatibilityScore: {
      type: DataTypes.FLOAT,
      defaultValue: 0
    },
    lastMessageAt: {
      type: DataTypes.DATE
    }
  }, {
    tableName: 'matches',
    timestamps: true
  });

  return Match;
};
