const router = require('express').Router();
const ctrl = require('../controllers/message.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.get('/:matchId', authenticate, ctrl.getMessages);
router.post('/:matchId', authenticate, ctrl.sendMessage);

module.exports = router;
