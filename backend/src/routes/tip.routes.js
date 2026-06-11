const router = require('express').Router();
const ctrl = require('../controllers/tip.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.get('/', authenticate, ctrl.getTips);
router.get('/:id', authenticate, ctrl.getTipById);

module.exports = router;
