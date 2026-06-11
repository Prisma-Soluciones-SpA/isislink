require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { sequelize } = require('../models');

sequelize.sync({ force: false, alter: true })
  .then(() => { console.log('✅ Base de datos sincronizada'); process.exit(0); })
  .catch(err => { console.error('❌ Error:', err); process.exit(1); });
