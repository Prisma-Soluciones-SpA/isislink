const { User, Like, Match, Subscription } = require('../models');
const { Op, Sequelize } = require('sequelize');

const FREEMIUM_LIMIT = 10;
const PLAN_LIMITS = { basic: 50, medium: 250, premium: null };

const calculateCompatibility = (user1, user2) => {
  let score = 0;
  const prefs1 = user1.esotericPreferences || [];
  const prefs2 = user2.esotericPreferences || [];

  const commonPrefs = prefs1.filter(p => prefs2.includes(p));
  score += (commonPrefs.length / Math.max(prefs1.length, prefs2.length, 1)) * 50;

  const ZODIAC_COMPATIBILITY = {
    'Aries': ['Leo', 'Sagitario', 'Géminis', 'Acuario'],
    'Tauro': ['Virgo', 'Capricornio', 'Cáncer', 'Piscis'],
    'Géminis': ['Libra', 'Acuario', 'Aries', 'Leo'],
    'Cáncer': ['Escorpio', 'Piscis', 'Tauro', 'Virgo'],
    'Leo': ['Aries', 'Sagitario', 'Géminis', 'Libra'],
    'Virgo': ['Tauro', 'Capricornio', 'Cáncer', 'Escorpio'],
    'Libra': ['Géminis', 'Acuario', 'Leo', 'Sagitario'],
    'Escorpio': ['Cáncer', 'Piscis', 'Virgo', 'Capricornio'],
    'Sagitario': ['Aries', 'Leo', 'Libra', 'Acuario'],
    'Capricornio': ['Tauro', 'Virgo', 'Escorpio', 'Piscis'],
    'Acuario': ['Géminis', 'Libra', 'Aries', 'Sagitario'],
    'Piscis': ['Cáncer', 'Escorpio', 'Tauro', 'Capricornio']
  };

  const compatible = ZODIAC_COMPATIBILITY[user1.zodiacSign] || [];
  if (compatible.includes(user2.zodiacSign)) score += 30;

  return Math.min(Math.round(score), 100);
};

const haiku = (user) => ({
  id: user.id,
  firstName: user.firstName,
  lastName: user.lastName,
  zodiacSign: user.zodiacSign,
  esotericPreferences: user.esotericPreferences,
  profileImage: user.profileImage,
  bio: user.bio,
  city: user.city,
  age: user.birthDate
    ? Math.floor((Date.now() - new Date(user.birthDate)) / (365.25 * 24 * 3600 * 1000))
    : null
});

exports.getSuggestions = async (req, res) => {
  try {
    const { page = 0, limit = 20 } = req.query;
    const currentUser = req.user;

    const targetGender = currentUser.gender === 'male' ? 'female' : 'male';

    const alreadyLiked = await Like.findAll({
      where: { fromUserId: currentUser.id },
      attributes: ['toUserId']
    });
    const excludeIds = [currentUser.id, ...alreadyLiked.map(l => l.toUserId)];

    const whereClause = {
      id: { [Op.notIn]: excludeIds },
      gender: targetGender,
      isActive: true
    };

    const users = await User.findAll({
      where: whereClause,
      attributes: { exclude: ['password', 'email', 'phone'] },
      limit: parseInt(limit),
      offset: parseInt(page) * parseInt(limit),
      order: [['createdAt', 'DESC']]
    });

    const suggestions = users.map(u => ({
      ...haiku(u),
      compatibilityScore: calculateCompatibility(currentUser, u)
    })).sort((a, b) => b.compatibilityScore - a.compatibilityScore);

    res.json({ suggestions, page: parseInt(page) });
  } catch (err) {
    console.error('Get suggestions error:', err);
    res.status(500).json({ message: 'Error al obtener sugerencias' });
  }
};

exports.likeUser = async (req, res) => {
  try {
    const { targetUserId } = req.body;
    const currentUser = req.user;

    if (currentUser.gender === 'male') {
      const activeSubscription = await Subscription.findOne({
        where: { userId: currentUser.id, isActive: true, endDate: { [Op.gt]: new Date() } },
        order: [['createdAt', 'DESC']]
      });

      if (activeSubscription) {
        if (activeSubscription.likesLimit !== null) {
          if (activeSubscription.likesUsed >= activeSubscription.likesLimit) {
            return res.status(403).json({
              message: 'Has alcanzado el límite de likes de tu plan',
              requiresUpgrade: true
            });
          }
          await activeSubscription.increment('likesUsed');
        }
      } else {
        const freshUser = await User.findByPk(currentUser.id);
        if (freshUser.freemiumLikesUsed >= FREEMIUM_LIMIT) {
          return res.status(403).json({
            message: 'Has agotado tus likes gratuitos. ¡Suscríbete para continuar!',
            requiresSubscription: true
          });
        }
        await freshUser.increment('freemiumLikesUsed');
      }
    }

    const [like, created] = await Like.findOrCreate({
      where: { fromUserId: currentUser.id, toUserId: targetUserId },
      defaults: { fromUserId: currentUser.id, toUserId: targetUserId }
    });

    if (!created) {
      return res.json({ liked: true, isMatch: like.isMatch });
    }

    const reciprocalLike = await Like.findOne({
      where: { fromUserId: targetUserId, toUserId: currentUser.id }
    });

    let isMatch = false;
    let match = null;

    if (reciprocalLike) {
      isMatch = true;
      await like.update({ isMatch: true });
      await reciprocalLike.update({ isMatch: true });

      const targetUser = await User.findByPk(targetUserId, {
        attributes: ['zodiacSign', 'esotericPreferences']
      });
      const score = calculateCompatibility(currentUser, targetUser || { zodiacSign: '', esotericPreferences: [] });

      match = await Match.create({
        user1Id: currentUser.id,
        user2Id: targetUserId,
        compatibilityScore: score
      });
    }

    res.json({ liked: true, isMatch, matchId: match?.id });
  } catch (err) {
    console.error('Like error:', err);
    res.status(500).json({ message: 'Error al dar like' });
  }
};
