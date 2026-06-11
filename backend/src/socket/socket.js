const jwt = require('jsonwebtoken');
const { Message, Match, User } = require('../models');
const { Op } = require('sequelize');

const onlineUsers = new Map();

module.exports = (io) => {
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) return next(new Error('Autenticación requerida'));

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch {
      next(new Error('Token inválido'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.userId;
    onlineUsers.set(userId, socket.id);
    socket.broadcast.emit('user:online', { userId });

    socket.on('chat:join', (matchId) => {
      socket.join(`match:${matchId}`);
    });

    socket.on('chat:leave', (matchId) => {
      socket.leave(`match:${matchId}`);
    });

    socket.on('chat:message', async (data) => {
      try {
        const { matchId, content } = data;

        const match = await Match.findOne({
          where: {
            id: matchId,
            [Op.or]: [{ user1Id: userId }, { user2Id: userId }]
          }
        });
        if (!match) return;

        const message = await Message.create({
          matchId,
          senderId: userId,
          content,
          messageType: 'text'
        });

        await match.update({ lastMessageAt: new Date() });

        const fullMessage = await Message.findByPk(message.id, {
          include: [{ model: User, as: 'sender', attributes: ['id', 'firstName', 'profileImage'] }]
        });

        io.to(`match:${matchId}`).emit('chat:message', fullMessage);

        const otherUserId = match.user1Id === userId ? match.user2Id : match.user1Id;
        const otherSocketId = onlineUsers.get(otherUserId);
        if (otherSocketId) {
          io.to(otherSocketId).emit('notification:message', {
            matchId,
            senderId: userId,
            preview: content.substring(0, 50)
          });
        }
      } catch (err) {
        console.error('Socket message error:', err);
      }
    });

    socket.on('chat:typing', ({ matchId, isTyping }) => {
      socket.to(`match:${matchId}`).emit('chat:typing', { userId, isTyping });
    });

    socket.on('disconnect', () => {
      onlineUsers.delete(userId);
      socket.broadcast.emit('user:offline', { userId });
    });
  });

  return { onlineUsers };
};
