const { Match, User, Message } = require('../models');
const { Op } = require('sequelize');

const userAttrs = ['id', 'firstName', 'lastName', 'profileImage', 'zodiacSign', 'city', 'birthDate', 'esotericPreferences'];

exports.getMatches = async (req, res) => {
  try {
    const userId = req.user.id;

    const matches = await Match.findAll({
      where: {
        [Op.or]: [{ user1Id: userId }, { user2Id: userId }]
      },
      include: [
        { model: User, as: 'user1', attributes: userAttrs },
        { model: User, as: 'user2', attributes: userAttrs }
      ],
      order: [['lastMessageAt', 'DESC NULLS LAST'], ['createdAt', 'DESC']]
    });

    const result = matches.map(m => {
      const otherUser = m.user1Id === userId ? m.user2 : m.user1;
      return {
        matchId: m.id,
        createdAt: m.createdAt,
        lastMessageAt: m.lastMessageAt,
        compatibilityScore: m.compatibilityScore,
        user: otherUser
      };
    });

    res.json({ matches: result });
  } catch (err) {
    console.error('Get matches error:', err);
    res.status(500).json({ message: 'Error al obtener matches' });
  }
};

exports.getMatchById = async (req, res) => {
  try {
    const { matchId } = req.params;
    const userId = req.user.id;

    const match = await Match.findOne({
      where: {
        id: matchId,
        [Op.or]: [{ user1Id: userId }, { user2Id: userId }]
      },
      include: [
        { model: User, as: 'user1', attributes: userAttrs },
        { model: User, as: 'user2', attributes: userAttrs }
      ]
    });

    if (!match) return res.status(404).json({ message: 'Match no encontrado' });

    const otherUser = match.user1Id === userId ? match.user2 : match.user1;
    res.json({ match, otherUser });
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener match' });
  }
};
