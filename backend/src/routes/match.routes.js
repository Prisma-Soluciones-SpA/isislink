const router = require('express').Router();
const ctrl = require('../controllers/match.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.get('/', authenticate, ctrl.getMatches);
router.get('/:matchId', authenticate, ctrl.getMatchById);

module.exports = router;
