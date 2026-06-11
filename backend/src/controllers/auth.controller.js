const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Subscription } = require('../models');
const { Op } = require('sequelize');

const FREEMIUM_LIMIT = 10;

const generateToken = (user) => jwt.sign(
  { id: user.id, email: user.email, role: user.role, gender: user.gender },
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
);

const getZodiacSign = (birthDate) => {
  const date = new Date(birthDate);
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return 'Aries';
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return 'Tauro';
  if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return 'Géminis';
  if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return 'Cáncer';
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return 'Leo';
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return 'Virgo';
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return 'Libra';
  if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return 'Escorpio';
  if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return 'Sagitario';
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return 'Capricornio';
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return 'Acuario';
  return 'Piscis';
};

const parsePreferences = (raw) => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try { const p = JSON.parse(raw); return Array.isArray(p) ? p : []; } catch { return []; }
};

exports.register = async (req, res) => {
  try {
    const {
      email, password, firstName, lastName, gender,
      birthDate, esotericPreferences, bio, phone, city
    } = req.body;

    if (!email || !password || !firstName || !lastName || !gender || !birthDate) {
      return res.status(400).json({ message: 'Faltan campos obligatorios' });
    }

    const existing = await User.findOne({ where: { email } });
    if (existing) return res.status(400).json({ message: 'El email ya está registrado' });

    const zodiacSign = getZodiacSign(birthDate);
    const hashed = await bcrypt.hash(password, 12);

    const userData = {
      email,
      password: hashed,
      firstName,
      lastName,
      gender,
      birthDate,
      zodiacSign,
      esotericPreferences: parsePreferences(esotericPreferences),
      bio: bio || null,
      phone: phone || null,
      city: city || null
    };

    if (req.file) {
      userData.profileImage = `/uploads/profiles/${req.file.filename}`;
    }

    const user = await User.create(userData);
    const token = generateToken(user);

    const userResponse = user.toJSON();
    delete userResponse.password;

    res.status(201).json({ user: userResponse, token, zodiacSign });
  } catch (err) {
    console.error('Register error:', err.message, err.stack);
    res.status(500).json({ message: 'Error al registrar usuario', detail: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(401).json({ message: 'Credenciales inválidas' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: 'Credenciales inválidas' });

    if (!user.isActive) return res.status(403).json({ message: 'Cuenta desactivada' });

    await user.update({ lastSeen: new Date() });

    let activeSubscription = null;
    if (user.gender === 'male') {
      activeSubscription = await Subscription.findOne({
        where: { userId: user.id, isActive: true, endDate: { [Op.gt]: new Date() } },
        order: [['createdAt', 'DESC']]
      });
    }

    const token = generateToken(user);
    const userResponse = user.toJSON();
    delete userResponse.password;

    res.json({ user: userResponse, token, subscription: activeSubscription });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Error al iniciar sesión' });
  }
};

exports.me = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });

    let activeSubscription = null;
    let canLike = true;
    let likesRemaining = null;

    if (user.gender === 'male') {
      activeSubscription = await Subscription.findOne({
        where: { userId: user.id, isActive: true, endDate: { [Op.gt]: new Date() } },
        order: [['createdAt', 'DESC']]
      });

      if (activeSubscription) {
        if (activeSubscription.likesLimit !== null) {
          likesRemaining = activeSubscription.likesLimit - activeSubscription.likesUsed;
          canLike = likesRemaining > 0;
        }
      } else {
        likesRemaining = FREEMIUM_LIMIT - user.freemiumLikesUsed;
        canLike = likesRemaining > 0;
      }
    }

    res.json({ user, subscription: activeSubscription, canLike, likesRemaining });
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener perfil' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, bio, phone, city, esotericPreferences, latitude, longitude } = req.body;

    const updateData = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (bio !== undefined) updateData.bio = bio;
    if (phone) updateData.phone = phone;
    if (city) updateData.city = city;
    if (esotericPreferences) updateData.esotericPreferences = esotericPreferences;
    if (latitude) updateData.latitude = parseFloat(latitude);
    if (longitude) updateData.longitude = parseFloat(longitude);

    if (req.file) {
      updateData.profileImage = `/uploads/profiles/${req.file.filename}`;
    }

    await User.update(updateData, { where: { id: req.user.id } });
    const updated = await User.findByPk(req.user.id, { attributes: { exclude: ['password'] } });

    res.json({ user: updated });
  } catch (err) {
    console.error('Update error:', err);
    res.status(500).json({ message: 'Error al actualizar perfil' });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findByPk(req.user.id);

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return res.status(400).json({ message: 'Contraseña actual incorrecta' });

    const hashed = await bcrypt.hash(newPassword, 12);
    await user.update({ password: hashed });

    res.json({ message: 'Contraseña actualizada' });
  } catch (err) {
    res.status(500).json({ message: 'Error al cambiar contraseña' });
  }
};
