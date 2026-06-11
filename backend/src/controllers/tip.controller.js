const { Tip } = require('../models');

exports.getTips = async (req, res) => {
  try {
    const tips = await Tip.findAll({
      where: { isActive: true },
      order: [['order', 'ASC'], ['createdAt', 'DESC']]
    });
    res.json({ tips });
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener tips' });
  }
};

exports.getTipById = async (req, res) => {
  try {
    const tip = await Tip.findByPk(req.params.id);
    if (!tip) return res.status(404).json({ message: 'Tip no encontrado' });
    res.json({ tip });
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener tip' });
  }
};

exports.createTip = async (req, res) => {
  try {
    const { title, description, videoUrl, category, order } = req.body;
    const tipData = { title, description, videoUrl, category, order: order || 0 };

    if (req.file) {
      tipData.imageUrl = `/uploads/profiles/${req.file.filename}`;
    }

    const tip = await Tip.create(tipData);
    res.status(201).json({ tip });
  } catch (err) {
    res.status(500).json({ message: 'Error al crear tip' });
  }
};

exports.updateTip = async (req, res) => {
  try {
    const { title, description, videoUrl, category, order, isActive } = req.body;
    const tip = await Tip.findByPk(req.params.id);
    if (!tip) return res.status(404).json({ message: 'Tip no encontrado' });

    const updateData = { title, description, videoUrl, category, order, isActive };
    if (req.file) updateData.imageUrl = `/uploads/profiles/${req.file.filename}`;

    await tip.update(updateData);
    res.json({ tip });
  } catch (err) {
    res.status(500).json({ message: 'Error al actualizar tip' });
  }
};

exports.deleteTip = async (req, res) => {
  try {
    const tip = await Tip.findByPk(req.params.id);
    if (!tip) return res.status(404).json({ message: 'Tip no encontrado' });
    await tip.destroy();
    res.json({ message: 'Tip eliminado' });
  } catch (err) {
    res.status(500).json({ message: 'Error al eliminar tip' });
  }
};
