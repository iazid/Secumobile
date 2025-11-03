const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { exec, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 4000;
app.use(cors());
app.use(bodyParser.json());
const attackProcesses = {
  xss: null,
  dos: null,
  sql_injection: null
};
const attackLogs = {
  xss: [],
  dos: [],
  sql_injection: []
};
const attackMetrics = {
  dos: {
    requestsPerSecond: [],
    responseTime: [],
    activeConnections: [],
    timestamps: []
  }
};
let requestCount = 0;
let lastRequestTime = Date.now();
let metricsInterval = null;

function startMetricsCollection() {
  if (metricsInterval) return;

  metricsInterval = setInterval(async () => {
    const targetUrl = process.env.TARGET_URL || 'http://target:80';
    let totalTime = 0;
    for (let i = 0; i < 3; i++) {
      const startTime = Date.now();
      try {
        await fetch(targetUrl, {
          method: 'HEAD',
          signal: AbortSignal.timeout(5000)
        });
        totalTime += Date.now() - startTime;
      } catch (err) {

        totalTime += 5000;
      }
    }
    if (attackMetrics.dos.timestamps.length >= 50) {
      attackMetrics.dos.requestsPerSecond.shift();
      attackMetrics.dos.responseTime.shift();
      attackMetrics.dos.activeConnections.shift();
      attackMetrics.dos.timestamps.shift();
    }

    attackMetrics.dos.responseTime.push(totalTime);
    attackMetrics.dos.requestsPerSecond.push(0);
    attackMetrics.dos.activeConnections.push(0);
    attackMetrics.dos.timestamps.push(attackMetrics.dos.timestamps.length);

  }, 2000); 
}

function stopMetricsCollection() {
  if (metricsInterval) {
    clearInterval(metricsInterval);
    metricsInterval = null;
  }
}
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'backend-orchestrator' });
});
app.get('/api/attacks/status', (req, res) => {
  res.json({
    xss: attackProcesses.xss !== null,
    dos: attackProcesses.dos !== null,
    sql_injection: attackProcesses.sql_injection !== null
  });
});
app.get('/api/attacks/dos/metrics', (req, res) => {
  res.json(attackMetrics.dos);
});
app.post('/api/attacks/xss/start', (req, res) => {
  if (attackProcesses.xss !== null) {
    return res.status(400).json({ error: 'XSS attack already running' });
  }
  const { mode = 'auto', payloadType = 'mixed' } = req.body;

  attackLogs.xss = [];
  attackLogs.xss.push({ timestamp: new Date(), message: `Starting XSS attack (mode: ${mode}, payload: ${payloadType})...` });
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
app.post('/api/attacks/xss/stop', (req, res) => {
  if (attackProcesses.xss === null) {
    return res.status(400).json({ error: 'No XSS attack running' });
  }

  attackProcesses.xss.kill();
  attackProcesses.xss = null;
  attackLogs.xss.push({ timestamp: new Date(), message: 'XSS attack stopped by user' });

  res.json({ success: true, message: 'XSS attack stopped' });
});
app.get('/api/attacks/xss/logs', (req, res) => {
  res.json(attackLogs.xss);
});
app.post('/api/attacks/dos/start', (req, res) => {
  if (attackProcesses.dos !== null) {
    return res.status(400).json({ error: 'DoS attack already running' });
  }
  const { sockets = 500, sleeptime = 5 } = req.body;

  attackLogs.dos = [];
  attackLogs.dos.push({ timestamp: new Date(), message: `Starting DoS attack with ${sockets} sockets, sleeptime ${sleeptime}s...` });
  startMetricsCollection();
  const scriptPath = path.join(__dirname, 'attack-scripts', 'dos', 'dos_attack.sh');
  const targetUrl = process.env.TARGET_URL || 'http://target:80';

  const attackProcess = spawn('bash', [scriptPath, targetUrl, sockets.toString(), sleeptime.toString()], {
    detached: true
  });

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
app.post('/api/attacks/dos/stop', (req, res) => {
  if (attackProcesses.dos === null) {
    return res.status(400).json({ error: 'No DoS attack running' });
  }
  try {
    process.kill(-attackProcesses.dos.pid);
  } catch (err) {
    attackProcesses.dos.kill();
  }
  attackProcesses.dos = null;
  attackLogs.dos.push({ timestamp: new Date(), message: 'DoS attack stopped by user' });
  stopMetricsCollection();

  res.json({ success: true, message: 'DoS attack stopped' });
});
app.get('/api/attacks/dos/logs', (req, res) => {
  res.json(attackLogs.dos);
});
app.post('/api/attacks/sql_injection/start', (req, res) => {
  if (attackProcesses.sql_injection !== null) {
    return res.status(400).json({ error: 'SQL Injection attack already running' });
  }
  const { level = 1, technique = 'BEUSTQ' } = req.body;

  attackLogs.sql_injection = [];
  attackLogs.sql_injection.push({ timestamp: new Date(), message: `Starting SQL Injection attack (level: ${level}, technique: ${technique})...` });
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
app.post('/api/attacks/sql_injection/stop', (req, res) => {
  if (attackProcesses.sql_injection === null) {
    return res.status(400).json({ error: 'No SQL Injection attack running' });
  }

  attackProcesses.sql_injection.kill();
  attackProcesses.sql_injection = null;
  attackLogs.sql_injection.push({ timestamp: new Date(), message: 'SQL Injection attack stopped by user' });

  res.json({ success: true, message: 'SQL Injection attack stopped' });
});
app.get('/api/attacks/sql_injection/logs', (req, res) => {
  res.json(attackLogs.sql_injection);
});
app.post('/api/reset', (req, res) => {

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
  Object.keys(attackLogs).forEach(key => {
    attackLogs[key] = [];
  });

  res.json({ success: true, message: 'Environment reset complete' });
});
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend Orchestrator running on http://localhost:${PORT}`);
});
