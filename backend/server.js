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
  mitm: null,
  ddos: null,
  sql_injection: null
};

// Stockage des logs
const attackLogs = {
  xss: [],
  mitm: [],
  ddos: [],
  sql_injection: []
};

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
    mitm: attackProcesses.mitm !== null,
    ddos: attackProcesses.ddos !== null,
    sql_injection: attackProcesses.sql_injection !== null
  });
});

// =======================
// XSS Attack Routes
// =======================

// Lancer l'attaque XSS
app.post('/api/attacks/xss/start', (req, res) => {
  if (attackProcesses.xss !== null) {
    return res.status(400).json({ error: 'XSS attack already running' });
  }

  attackLogs.xss = [];
  attackLogs.xss.push({ timestamp: new Date(), message: 'Starting XSS attack...' });

  // Lancer le script Python de Jordan
  const scriptPath = path.join(__dirname, 'attack-scripts', 'xss', 'xss_attack.sh');

  const process = spawn('bash', [scriptPath, process.env.TARGET_URL || 'http://target:3000']);

  process.stdout.on('data', (data) => {
    const message = data.toString().trim();
    attackLogs.xss.push({ timestamp: new Date(), message });
    console.log(`[XSS] ${message}`);
  });

  process.stderr.on('data', (data) => {
    const message = data.toString().trim();
    attackLogs.xss.push({ timestamp: new Date(), message, type: 'error' });
    console.error(`[XSS ERROR] ${message}`);
  });

  process.on('close', (code) => {
    attackLogs.xss.push({ timestamp: new Date(), message: `Process exited with code ${code}` });
    attackProcesses.xss = null;
  });

  attackProcesses.xss = process;
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
// MitM Attack Routes
// =======================

// Lancer l'attaque MitM
app.post('/api/attacks/mitm/start', (req, res) => {
  if (attackProcesses.mitm !== null) {
    return res.status(400).json({ error: 'MitM attack already running' });
  }

  attackLogs.mitm = [];
  attackLogs.mitm.push({ timestamp: new Date(), message: 'Starting MitM attack...' });

  // Lancer le script de Jordan
  const scriptPath = path.join(__dirname, 'attack-scripts', 'mitm', 'mitm_attack.py');

  const process = spawn('python3', [scriptPath, process.env.TARGET_URL || 'http://target:3000']);

  process.stdout.on('data', (data) => {
    const message = data.toString().trim();
    attackLogs.mitm.push({ timestamp: new Date(), message });
    console.log(`[MitM] ${message}`);
  });

  process.stderr.on('data', (data) => {
    const message = data.toString().trim();
    attackLogs.mitm.push({ timestamp: new Date(), message, type: 'error' });
    console.error(`[MitM ERROR] ${message}`);
  });

  process.on('close', (code) => {
    attackLogs.mitm.push({ timestamp: new Date(), message: `Process exited with code ${code}` });
    attackProcesses.mitm = null;
  });

  attackProcesses.mitm = process;
  res.json({ success: true, message: 'MitM attack started' });
});

// Arrêter l'attaque MitM
app.post('/api/attacks/mitm/stop', (req, res) => {
  if (attackProcesses.mitm === null) {
    return res.status(400).json({ error: 'No MitM attack running' });
  }

  attackProcesses.mitm.kill();
  attackProcesses.mitm = null;
  attackLogs.mitm.push({ timestamp: new Date(), message: 'MitM attack stopped by user' });

  res.json({ success: true, message: 'MitM attack stopped' });
});

// Obtenir les logs MitM
app.get('/api/attacks/mitm/logs', (req, res) => {
  res.json(attackLogs.mitm);
});

// =======================
// DDoS Attack Routes
// =======================

// Lancer l'attaque DDoS
app.post('/api/attacks/ddos/start', (req, res) => {
  if (attackProcesses.ddos !== null) {
    return res.status(400).json({ error: 'DDoS attack already running' });
  }

  attackLogs.ddos = [];
  attackLogs.ddos.push({ timestamp: new Date(), message: 'Starting DDoS attack...' });

  // Lancer le script de Jordan
  const scriptPath = path.join(__dirname, 'attack-scripts', 'ddos', 'ddos_attack.py');

  const process = spawn('python3', [scriptPath, process.env.TARGET_URL || 'http://target:3000']);

  process.stdout.on('data', (data) => {
    const message = data.toString().trim();
    attackLogs.ddos.push({ timestamp: new Date(), message });
    console.log(`[DDoS] ${message}`);
  });

  process.stderr.on('data', (data) => {
    const message = data.toString().trim();
    attackLogs.ddos.push({ timestamp: new Date(), message, type: 'error' });
    console.error(`[DDoS ERROR] ${message}`);
  });

  process.on('close', (code) => {
    attackLogs.ddos.push({ timestamp: new Date(), message: `Process exited with code ${code}` });
    attackProcesses.ddos = null;
  });

  attackProcesses.ddos = process;
  res.json({ success: true, message: 'DDoS attack started' });
});

// Arrêter l'attaque DDoS
app.post('/api/attacks/ddos/stop', (req, res) => {
  if (attackProcesses.ddos === null) {
    return res.status(400).json({ error: 'No DDoS attack running' });
  }

  attackProcesses.ddos.kill();
  attackProcesses.ddos = null;
  attackLogs.ddos.push({ timestamp: new Date(), message: 'DDoS attack stopped by user' });

  res.json({ success: true, message: 'DDoS attack stopped' });
});

// Obtenir les logs DDoS
app.get('/api/attacks/ddos/logs', (req, res) => {
  res.json(attackLogs.ddos);
});

// =======================
// SQL Injection Attack Routes
// =======================

// Lancer l'attaque SQL Injection
app.post('/api/attacks/sql_injection/start', (req, res) => {
  if (attackProcesses.sql_injection !== null) {
    return res.status(400).json({ error: 'SQL Injection attack already running' });
  }

  attackLogs.sql_injection = [];
  attackLogs.sql_injection.push({ timestamp: new Date(), message: 'Starting SQL Injection attack...' });

  // Lancer le script Bash de Jordan
  const scriptPath = path.join(__dirname, 'attack-scripts', 'sql_injection', 'sql_attack.sh');

  const process = spawn('bash', [scriptPath, process.env.TARGET_URL || 'http://target:3000']);

  process.stdout.on('data', (data) => {
    const message = data.toString().trim();
    attackLogs.sql_injection.push({ timestamp: new Date(), message });
    console.log(`[SQL Injection] ${message}`);
  });

  process.stderr.on('data', (data) => {
    const message = data.toString().trim();
    attackLogs.sql_injection.push({ timestamp: new Date(), message, type: 'error' });
    console.error(`[SQL Injection ERROR] ${message}`);
  });

  process.on('close', (code) => {
    attackLogs.sql_injection.push({ timestamp: new Date(), message: `Process exited with code ${code}` });
    attackProcesses.sql_injection = null;
  });

  attackProcesses.sql_injection = process;
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

app.post('/api/reset', async (req, res) => {
  // Arrêter toutes les attaques
  Object.keys(attackProcesses).forEach(key => {
    if (attackProcesses[key] !== null) {
      attackProcesses[key].kill();
      attackProcesses[key] = null;
    }
  });

  // Réinitialiser les logs
  Object.keys(attackLogs).forEach(key => {
    attackLogs[key] = [];
  });

  // Réinitialiser la base de données de la cible
  try {
    const targetUrl = process.env.TARGET_URL || 'http://target:3000';
    const response = await fetch(`${targetUrl}/api/reset`, {
      method: 'POST'
    });

    res.json({ success: true, message: 'Environment reset complete' });
  } catch (error) {
    res.json({ success: true, message: 'Environment reset (database reset failed)' });
  }
});

// Démarrage du serveur
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🎮 Backend Orchestrator running on http://localhost:${PORT}`);
});
