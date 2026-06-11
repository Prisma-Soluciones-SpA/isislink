const router = require('express').Router();
const ctrl = require('../controllers/tip.controller');
const { authenticate, requireAdmin } = require('../middleware/auth.middleware');
const { upload, processProfileImage } = require('../middleware/upload.middleware');

router.get('/', authenticate, ctrl.getTips);
router.get('/:id', authenticate, ctrl.getTipById);
router.post('/', authenticate, requireAdmin, upload.single('image'), processProfileImage, ctrl.createTip);
router.put('/:id', authenticate, requireAdmin, upload.single('image'), processProfileImage, ctrl.updateTip);
router.delete('/:id', authenticate, requireAdmin, ctrl.deleteTip);

module.exports = router;
