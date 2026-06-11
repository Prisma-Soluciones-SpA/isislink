const { WebpayPlus, Options, IntegrationApiKeys, Environment, IntegrationCommerceCodes } = require('transbank-sdk');
const { Subscription, Transaction, User } = require('../models');
const { Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

const PLANS = {
  basic: { name: 'Plan Básico', amount: 3990, likesLimit: 50 },
  medium: { name: 'Plan Medio', amount: 5990, likesLimit: 250 },
  premium: { name: 'Plan Premium', amount: 10990, likesLimit: null }
};

const getWebpay = () => {
  if (process.env.TBK_ENVIRONMENT === 'production') {
    return new WebpayPlus.Transaction(new Options(
      process.env.TBK_COMMERCE_CODE,
      process.env.TBK_API_KEY,
      Environment.Production
    ));
  }
  return new WebpayPlus.Transaction(new Options(
    IntegrationCommerceCodes.WEBPAY_PLUS,
    IntegrationApiKeys.WEBPAY,
    Environment.Integration
  ));
};

exports.getPlans = async (req, res) => {
  res.json({ plans: PLANS });
};

exports.getStatus = async (req, res) => {
  try {
    if (req.user.gender !== 'male') {
      return res.json({ subscription: null, canLike: true, likesRemaining: null });
    }

    const subscription = await Subscription.findOne({
      where: { userId: req.user.id, isActive: true, endDate: { [Op.gt]: new Date() } },
      order: [['createdAt', 'DESC']]
    });

    const user = await User.findByPk(req.user.id);

    if (subscription) {
      const likesRemaining = subscription.likesLimit !== null
        ? subscription.likesLimit - subscription.likesUsed
        : null;
      return res.json({
        subscription,
        canLike: likesRemaining === null || likesRemaining > 0,
        likesRemaining
      });
    }

    const freemiumRemaining = 10 - user.freemiumLikesUsed;
    res.json({
      subscription: null,
      isFreemium: true,
      canLike: freemiumRemaining > 0,
      likesRemaining: freemiumRemaining
    });
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener estado de suscripción' });
  }
};

exports.initTransaction = async (req, res) => {
  try {
    if (req.user.gender !== 'male') {
      return res.status(403).json({ message: 'Solo usuarios masculinos requieren suscripción' });
    }

    const { planType } = req.body;
    const plan = PLANS[planType];
    if (!plan) return res.status(400).json({ message: 'Plan inválido' });

    const orderId = `AL-${Date.now()}-${uuidv4().substring(0, 8).toUpperCase()}`;
    const returnUrl = process.env.TBK_RETURN_URL || `${req.protocol}://${req.get('host')}/api/subscriptions/confirm`;

    const tx = getWebpay();
    const response = await tx.create(orderId, 'session_' + req.user.id, plan.amount, returnUrl);

    await Transaction.create({
      userId: req.user.id,
      planType,
      amount: plan.amount,
      status: 'pending',
      transbankToken: response.token,
      transbankOrderId: orderId
    });

    res.json({ url: response.url, token: response.token, orderId, plan });
  } catch (err) {
    console.error('Transbank init error:', err);
    res.status(500).json({ message: 'Error al iniciar pago con Transbank' });
  }
};

exports.confirmTransaction = async (req, res) => {
  try {
    const { token_ws, TBK_TOKEN } = req.body;
    const token = token_ws || TBK_TOKEN;

    if (!token) {
      return res.redirect(`${process.env.FRONTEND_URL}/plans?status=cancelled`);
    }

    const tx = getWebpay();
    const response = await tx.commit(token);

    const transaction = await Transaction.findOne({ where: { transbankToken: token } });

    if (!transaction) {
      return res.redirect(`${process.env.FRONTEND_URL}/plans?status=error`);
    }

    if (response.response_code === 0 && response.status === 'AUTHORIZED') {
      const plan = PLANS[transaction.planType];
      const now = new Date();
      const endDate = new Date(now);
      endDate.setMonth(endDate.getMonth() + 1);

      await Subscription.update(
        { isActive: false },
        { where: { userId: transaction.userId, isActive: true } }
      );

      const subscription = await Subscription.create({
        userId: transaction.userId,
        planType: transaction.planType,
        likesLimit: plan.likesLimit,
        likesUsed: 0,
        amount: plan.amount,
        startDate: now,
        endDate,
        isActive: true,
        transbankToken: token,
        transbankOrderId: transaction.transbankOrderId,
        transbankAuthCode: response.authorization_code
      });

      await transaction.update({
        status: 'approved',
        subscriptionId: subscription.id,
        transbankResponse: response
      });

      return res.redirect(`${process.env.FRONTEND_URL}/plans?status=success&plan=${transaction.planType}`);
    }

    await transaction.update({ status: 'rejected', transbankResponse: response });
    return res.redirect(`${process.env.FRONTEND_URL}/plans?status=failed`);
  } catch (err) {
    console.error('Transbank confirm error:', err);
    res.redirect(`${process.env.FRONTEND_URL}/plans?status=error`);
  }
};

exports.getHistory = async (req, res) => {
  try {
    const transactions = await Transaction.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
      limit: 20
    });
    res.json({ transactions });
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener historial' });
  }
};
