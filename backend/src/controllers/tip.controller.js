const soapService = require('../services/soap.service');

exports.getTips = async (req, res) => {
  try {
    const tips = await soapService.getConsejos();
    res.json({ tips });
  } catch (err) {
    console.error('Tips SOAP error:', err.message);
    res.status(500).json({ message: 'Error al obtener tips' });
  }
};

exports.getTipById = async (req, res) => {
  try {
    const tips = await soapService.getConsejos();
    const tip = tips.find(t => t.id === req.params.id);
    if (!tip) return res.status(404).json({ message: 'Tip no encontrado' });
    res.json({ tip });
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener tip' });
  }
};
