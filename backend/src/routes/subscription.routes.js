const router = require('express').Router();
const ctrl = require('../controllers/subscription.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.get('/plans', ctrl.getPlans);
router.get('/status', authenticate, ctrl.getStatus);
router.get('/history', authenticate, ctrl.getHistory);
router.post('/init', authenticate, ctrl.initTransaction);
router.post('/confirm', ctrl.confirmTransaction);

module.exports = router;
