require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const { sequelize } = require('./models');
const setupSocket = require('./socket/socket');

const app = express();
app.set('trust proxy', 1);
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: process.env.FRONTEND_URL || '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });
app.use('/api', limiter);

app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/discover', require('./routes/discover.routes'));
app.use('/api/matches', require('./routes/match.routes'));
app.use('/api/messages', require('./routes/message.routes'));
app.use('/api/tips', require('./routes/tip.routes'));
app.use('/api/subscriptions', require('./routes/subscription.routes'));

app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ message: err.message || 'Error interno del servidor' });
});

setupSocket(io);

const PORT = process.env.PORT || 3000;

const start = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ PostgreSQL conectado');
    await sequelize.sync({ alter: true });
    console.log('✅ Modelos sincronizados');
    server.listen(PORT, () => console.log(`🚀 Servidor corriendo en puerto ${PORT}`));
  } catch (err) {
    console.error('❌ Error al iniciar:', err);
    process.exit(1);
  }
};

start();
