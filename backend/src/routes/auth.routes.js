const router = require('express').Router();
const ctrl = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { upload, processProfileImage } = require('../middleware/upload.middleware');

router.post('/register', upload.single('profileImage'), processProfileImage, ctrl.register);
router.post('/login', ctrl.login);
router.get('/me', authenticate, ctrl.me);
router.put('/profile', authenticate, upload.single('profileImage'), processProfileImage, ctrl.updateProfile);
router.put('/password', authenticate, ctrl.changePassword);

module.exports = router;
