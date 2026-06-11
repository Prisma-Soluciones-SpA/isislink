const { Message, Match, User } = require('../models');
const { Op } = require('sequelize');

exports.getMessages = async (req, res) => {
  try {
    const { matchId } = req.params;
    const { page = 0, limit = 50 } = req.query;
    const userId = req.user.id;

    const match = await Match.findOne({
      where: { id: matchId, [Op.or]: [{ user1Id: userId }, { user2Id: userId }] }
    });
    if (!match) return res.status(404).json({ message: 'Match no encontrado' });

    const messages = await Message.findAll({
      where: { matchId },
      include: [{ model: User, as: 'sender', attributes: ['id', 'firstName', 'profileImage'] }],
      order: [['createdAt', 'ASC']],
      limit: parseInt(limit),
      offset: parseInt(page) * parseInt(limit)
    });

    await Message.update(
      { readAt: new Date() },
      { where: { matchId, senderId: { [Op.ne]: userId }, readAt: null } }
    );

    res.json({ messages });
  } catch (err) {
    console.error('Get messages error:', err);
    res.status(500).json({ message: 'Error al obtener mensajes' });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { matchId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    const match = await Match.findOne({
      where: { id: matchId, [Op.or]: [{ user1Id: userId }, { user2Id: userId }] }
    });
    if (!match) return res.status(404).json({ message: 'Match no encontrado' });

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

    res.status(201).json({ message: fullMessage });
  } catch (err) {
    console.error('Send message error:', err);
    res.status(500).json({ message: 'Error al enviar mensaje' });
  }
};
