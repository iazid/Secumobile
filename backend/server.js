const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { exec, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 4000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Stockage des processus d'attaque en cours
const attackProcesses = {
  xss: null,
  dos: null,
  sql_injection: null
};

// Stockage des logs
const attackLogs = {
  xss: [],
  dos: [],
  sql_injection: []
};

// Stockage des métriques en temps réel
const attackMetrics = {
  dos: {
    requestsPerSecond: [],
    responseTime: [],
    activeConnections: [],
    timestamps: []
  }
};

// Variables pour calculer req/sec
let requestCount = 0;
let lastRequestTime = Date.now();

// Fonction pour mesurer les métriques de la cible
let metricsInterval = null;

function startMetricsCollection() {
  if (metricsInterval) return;

  metricsInterval = setInterval(async () => {
    try {
      const targetUrl = process.env.TARGET_URL || 'http://target:80';
      const startTime = Date.now();

      // Faire plusieurs requêtes rapides pour mesurer le débit
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(
          fetch(targetUrl, {
            method: 'HEAD',
            signal: AbortSignal.timeout(5000)
          }).catch(() => null)
        );
      }

      const results = await Promise.allSettled(promises);
      const successCount = results.filter(r => r.status === 'fulfilled').length;
      const responseTime = Date.now() - startTime;

      // Calculer req/sec basé sur le temps réel
      const avgResponseTime = responseTime / 10;
      const requestsPerSecond = successCount > 0 ? Math.round((1000 / avgResponseTime) * successCount) : 0;
      const timestamp = new Date().toISOString();

      // Limiter à 50 points de données
      if (attackMetrics.dos.timestamps.length >= 50) {
        attackMetrics.dos.requestsPerSecond.shift();
        attackMetrics.dos.responseTime.shift();
        attackMetrics.dos.activeConnections.shift();
        attackMetrics.dos.timestamps.shift();
      }

      attackMetrics.dos.responseTime.push(Math.round(avgResponseTime));
      attackMetrics.dos.requestsPerSecond.push(requestsPerSecond);
      attackMetrics.dos.activeConnections.push(attackProcesses.dos ? Math.floor(Math.random() * 500 + 100) : 0);
      attackMetrics.dos.timestamps.push(timestamp);

    } catch (error) {
      // Timeout ou erreur - serveur probablement down
      const timestamp = new Date().toISOString();

      if (attackMetrics.dos.timestamps.length >= 50) {
        attackMetrics.dos.requestsPerSecond.shift();
        attackMetrics.dos.responseTime.shift();
        attackMetrics.dos.activeConnections.shift();
        attackMetrics.dos.timestamps.shift();
      }

      attackMetrics.dos.responseTime.push(5000); // Max timeout
      attackMetrics.dos.requestsPerSecond.push(0);
      attackMetrics.dos.activeConnections.push(attackProcesses.dos ? Math.floor(Math.random() * 500 + 300) : 0);
      attackMetrics.dos.timestamps.push(timestamp);
    }
  }, 1000); // Collecte toutes les secondes
}

function stopMetricsCollection() {
  if (metricsInterval) {
    clearInterval(metricsInterval);
    metricsInterval = null;
  }
}

// Créer le dossier logs si nécessaire
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Routes API

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'backend-orchestrator' });
});

// Obtenir le statut de toutes les attaques
app.get('/api/attacks/status', (req, res) => {
  res.json({
    xss: attackProcesses.xss !== null,
    dos: attackProcesses.dos !== null,
    sql_injection: attackProcesses.sql_injection !== null
  });
});

// Obtenir les métriques DoS en temps réel
app.get('/api/attacks/dos/metrics', (req, res) => {
  res.json(attackMetrics.dos);
});

// =======================
// XSS Attack Routes
// =======================

// Lancer l'attaque XSS
app.post('/api/attacks/xss/start', (req, res) => {
  if (attackProcesses.xss !== null) {
    return res.status(400).json({ error: 'XSS attack already running' });
  }

  // Récupérer les paramètres XSS depuis le body
  const { mode = 'auto', payloadType = 'mixed' } = req.body;

  attackLogs.xss = [];
  attackLogs.xss.push({ timestamp: new Date(), message: `Starting XSS attack (mode: ${mode}, payload: ${payloadType})...` });

  // Lancer le script bash avec les paramètres
  const scriptPath = path.join(__dirname, 'attack-scripts', 'xss', 'xss_attack.sh');
  const targetUrl = process.env.TARGET_URL || 'http://target:80';

  const attackProcess = spawn('bash', [scriptPath, targetUrl, mode, payloadType]);

  attackProcess.stdout.on('data', (data) => {
    const message = data.toString().trim();
    attackLogs.xss.push({ timestamp: new Date(), message });
    console.log(`[XSS] ${message}`);
  });

  attackProcess.stderr.on('data', (data) => {
    const message = data.toString().trim();
    attackLogs.xss.push({ timestamp: new Date(), message, type: 'error' });
    console.error(`[XSS ERROR] ${message}`);
  });

  attackProcess.on('close', (code) => {
    attackLogs.xss.push({ timestamp: new Date(), message: `Process exited with code ${code}` });
    attackProcesses.xss = null;
  });

  attackProcesses.xss = attackProcess;
  res.json({ success: true, message: 'XSS attack started' });
});

// Arrêter l'attaque XSS
app.post('/api/attacks/xss/stop', (req, res) => {
  if (attackProcesses.xss === null) {
    return res.status(400).json({ error: 'No XSS attack running' });
  }

  attackProcesses.xss.kill();
  attackProcesses.xss = null;
  attackLogs.xss.push({ timestamp: new Date(), message: 'XSS attack stopped by user' });

  res.json({ success: true, message: 'XSS attack stopped' });
});

// Obtenir les logs XSS
app.get('/api/attacks/xss/logs', (req, res) => {
  res.json(attackLogs.xss);
});

// =======================
// Dos Attack Routes
// =======================

// Lancer l'attaque DoS
app.post('/api/attacks/dos/start', (req, res) => {
  if (attackProcesses.dos !== null) {
    return res.status(400).json({ error: 'DoS attack already running' });
  }

  // Récupérer les paramètres DoS depuis le body
  const { sockets = 500, sleeptime = 5 } = req.body;

  attackLogs.dos = [];
  attackLogs.dos.push({ timestamp: new Date(), message: `Starting DoS attack with ${sockets} sockets, sleeptime ${sleeptime}s...` });

  // Démarrer la collecte de métriques
  startMetricsCollection();

  // Lancer le script DoS avec les paramètres
  const scriptPath = path.join(__dirname, 'attack-scripts', 'dos', 'dos_attack.sh');
  const targetUrl = process.env.TARGET_URL || 'http://target:80';

  const attackProcess = spawn('bash', [scriptPath, targetUrl, sockets.toString(), sleeptime.toString()]);

  attackProcess.stdout.on('data', (data) => {
    const message = data.toString().trim();
    attackLogs.dos.push({ timestamp: new Date(), message });
    console.log(`[DoS] ${message}`);
  });

  attackProcess.stderr.on('data', (data) => {
    const message = data.toString().trim();
    attackLogs.dos.push({ timestamp: new Date(), message, type: 'error' });
    console.error(`[DoS ERROR] ${message}`);
  });

  attackProcess.on('close', (code) => {
    attackLogs.dos.push({ timestamp: new Date(), message: `Process exited with code ${code}` });
    attackProcesses.dos = null;
  });

  attackProcesses.dos = attackProcess;
  res.json({ success: true, message: 'DoS attack started' });
});

// Arrêter l'attaque DoS
app.post('/api/attacks/dos/stop', (req, res) => {
  if (attackProcesses.dos === null) {
    return res.status(400).json({ error: 'No DoS attack running' });
  }

  attackProcesses.dos.kill();
  attackProcesses.dos = null;
  attackLogs.dos.push({ timestamp: new Date(), message: 'DoS attack stopped by user' });

  // Arrêter la collecte de métriques
  stopMetricsCollection();

  res.json({ success: true, message: 'DoS attack stopped' });
});

// Obtenir les logs DoS
app.get('/api/attacks/dos/logs', (req, res) => {
  res.json(attackLogs.dos);
});

// =======================
// SQL Injection Attack Routes
// =======================

// Lancer l'attaque SQL Injection
app.post('/api/attacks/sql_injection/start', (req, res) => {
  if (attackProcesses.sql_injection !== null) {
    return res.status(400).json({ error: 'SQL Injection attack already running' });
  }

  // Récupérer les paramètres SQL Injection depuis le body
  const { level = 1, technique = 'BEUSTQ' } = req.body;

  attackLogs.sql_injection = [];
  attackLogs.sql_injection.push({ timestamp: new Date(), message: `Starting SQL Injection attack (level: ${level}, technique: ${technique})...` });

  // Lancer le script Bash avec les paramètres
  const scriptPath = path.join(__dirname, 'attack-scripts', 'sql_injection', 'sql_attack.sh');
  const targetUrl = process.env.TARGET_URL || 'http://target:80';

  const attackProcess = spawn('bash', [scriptPath, targetUrl, level.toString(), technique]);

  attackProcess.stdout.on('data', (data) => {
    const message = data.toString().trim();
    attackLogs.sql_injection.push({ timestamp: new Date(), message });
    console.log(`[SQL Injection] ${message}`);
  });

  attackProcess.stderr.on('data', (data) => {
    const message = data.toString().trim();
    attackLogs.sql_injection.push({ timestamp: new Date(), message, type: 'error' });
    console.error(`[SQL Injection ERROR] ${message}`);
  });

  attackProcess.on('close', (code) => {
    attackLogs.sql_injection.push({ timestamp: new Date(), message: `Process exited with code ${code}` });
    attackProcesses.sql_injection = null;
  });

  attackProcesses.sql_injection = attackProcess;
  res.json({ success: true, message: 'SQL Injection attack started' });
});

// Arrêter l'attaque SQL Injection
app.post('/api/attacks/sql_injection/stop', (req, res) => {
  if (attackProcesses.sql_injection === null) {
    return res.status(400).json({ error: 'No SQL Injection attack running' });
  }

  attackProcesses.sql_injection.kill();
  attackProcesses.sql_injection = null;
  attackLogs.sql_injection.push({ timestamp: new Date(), message: 'SQL Injection attack stopped by user' });

  res.json({ success: true, message: 'SQL Injection attack stopped' });
});

// Obtenir les logs SQL Injection
app.get('/api/attacks/sql_injection/logs', (req, res) => {
  res.json(attackLogs.sql_injection);
});


// =======================
// Reset Environment
// =======================

app.post('/api/reset', (req, res) => {
  // Arrêter toutes les attaques
  Object.keys(attackProcesses).forEach(key => {
    if (attackProcesses[key] !== null) {
      try {
        attackProcesses[key].kill();
      } catch (err) {
        console.error(`Error killing ${key} process:`, err);
      }
      attackProcesses[key] = null;
    }
  });

  // Réinitialiser les logs
  Object.keys(attackLogs).forEach(key => {
    attackLogs[key] = [];
  });

  res.json({ success: true, message: 'Environment reset complete' });
});

// Démarrage du serveur
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🎮 Backend Orchestrator running on http://localhost:${PORT}`);
});
