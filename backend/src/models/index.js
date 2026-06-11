const sequelize = require('../config/database');
const User = require('./User')(sequelize);
const Subscription = require('./Subscription')(sequelize);
const Like = require('./Like')(sequelize);
const Match = require('./Match')(sequelize);
const Message = require('./Message')(sequelize);
const Tip = require('./Tip')(sequelize);
const Transaction = require('./Transaction')(sequelize);

// User - Subscription (1:N)
User.hasMany(Subscription, { foreignKey: 'userId', as: 'subscriptions' });
Subscription.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User - Transaction (1:N)
User.hasMany(Transaction, { foreignKey: 'userId', as: 'transactions' });
Transaction.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User - Like (from / to)
User.hasMany(Like, { foreignKey: 'fromUserId', as: 'sentLikes' });
User.hasMany(Like, { foreignKey: 'toUserId', as: 'receivedLikes' });
Like.belongsTo(User, { foreignKey: 'fromUserId', as: 'fromUser' });
Like.belongsTo(User, { foreignKey: 'toUserId', as: 'toUser' });

// Match - Users
User.hasMany(Match, { foreignKey: 'user1Id', as: 'matchesAsUser1' });
User.hasMany(Match, { foreignKey: 'user2Id', as: 'matchesAsUser2' });
Match.belongsTo(User, { foreignKey: 'user1Id', as: 'user1' });
Match.belongsTo(User, { foreignKey: 'user2Id', as: 'user2' });

// Match - Messages
Match.hasMany(Message, { foreignKey: 'matchId', as: 'messages' });
Message.belongsTo(Match, { foreignKey: 'matchId', as: 'match' });

// Message - User (sender)
User.hasMany(Message, { foreignKey: 'senderId', as: 'sentMessages' });
Message.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });

module.exports = { sequelize, User, Subscription, Like, Match, Message, Tip, Transaction };
