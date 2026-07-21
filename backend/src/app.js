const path = require('path');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const compression = require('compression');
require('dotenv').config();

const themeRoutes = require('./routes/themes');
const nodeRoutes = require('./routes/nodes');
const edgeRoutes = require('./routes/edges');
const feedRoutes = require('./routes/feeds');
const commentRoutes = require('./routes/comments');
const snapshotRoutes = require('./routes/snapshots');
const analysisRoutes = require('./routes/analyses');

const app = express();
const PORT = process.env.PORT || 3001;

// ---- Middleware ----
app.use(compression({ level: 9 }));
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// ---- Health Check ----
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'trend-forge-api',
    timestamp: new Date().toISOString(),
  });
});

// ---- API Routes ----
app.use('/api/themes', themeRoutes);
app.use('/api/nodes', nodeRoutes);
app.use('/api/edges', edgeRoutes);
app.use('/api/feeds', feedRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/snapshots', snapshotRoutes);
app.use('/api/analyses', analysisRoutes);

// ---- Serve Frontend Static Files (with gzip) ----
const publicDir = path.join(__dirname, '../public');
const fs = require('fs');
if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir, {
    setHeaders: (res) => {
      res.removeHeader('Content-Length');
    },
  }));
  app.get('*', (req, res) => {
    res.sendFile(path.join(publicDir, 'index.html'));
  });
}

// ---- Error Handler ----
app.use((err, req, res, next) => {
  console.error('[Error]', err.message);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Trend Forge API running on http://localhost:${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
