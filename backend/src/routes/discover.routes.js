const router = require('express').Router();
const ctrl = require('../controllers/discover.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.get('/suggestions', authenticate, ctrl.getSuggestions);
router.post('/like', authenticate, ctrl.likeUser);

module.exports = router;
