import React, { useState, useEffect } from 'react';
import './App.css';

const API_BASE_URL = 'http://localhost:4000/api';

function App() {
  const [attackStatus, setAttackStatus] = useState({
    xss: false,
    dos: false,
    sql_injection: false
  });

  const [selectedAttack, setSelectedAttack] = useState('xss');
  const [logs, setLogs] = useState([]);
  const [targetIP, setTargetIP] = useState('192.168.1.50');

  useEffect(() => {
    fetchAttackStatus();
    const interval = setInterval(fetchAttackStatus, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedAttack) {
      fetchLogs(selectedAttack);
      const interval = setInterval(() => fetchLogs(selectedAttack), 2000);
      return () => clearInterval(interval);
    }
  }, [selectedAttack]);

  const fetchAttackStatus = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/attacks/status`);
      const data = await response.json();
      setAttackStatus(data);
    } catch (error) {
      console.error('Error fetching attack status:', error);
    }
  };

  const fetchLogs = async (attackType) => {
    try {
      const response = await fetch(`${API_BASE_URL}/attacks/${attackType}/logs`);
      const data = await response.json();
      setLogs(data);
    } catch (error) {
      console.error('Error fetching logs:', error);
    }
  };

  const startAttack = async (attackType) => {
    try {
      const response = await fetch(`${API_BASE_URL}/attacks/${attackType}/start`, {
        method: 'POST'
      });
      const data = await response.json();
      if (data.success) {
        fetchAttackStatus();
      }
    } catch (error) {
      console.error('Error starting attack:', error);
    }
  };

  const stopAttack = async (attackType) => {
    try {
      const response = await fetch(`${API_BASE_URL}/attacks/${attackType}/stop`, {
        method: 'POST'
      });
      const data = await response.json();
      if (data.success) {
        fetchAttackStatus();
      }
    } catch (error) {
      console.error('Error stopping attack:', error);
    }
  };

  const resetEnvironment = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/reset`, {
        method: 'POST'
      });
      const data = await response.json();
      if (data.success) {
        setLogs([]);
        fetchAttackStatus();
      }
    } catch (error) {
      console.error('Error resetting environment:', error);
    }
  };

  const generateRandomIP = () => {
    const randomOctet = () => Math.floor(Math.random() * 255) + 1;
    const newIP = `${randomOctet()}.${randomOctet()}.${randomOctet()}.${randomOctet()}`;
    setTargetIP(newIP);
  };

  const isAnyAttackRunning = attackStatus.xss || attackStatus.sql_injection || attackStatus.dos;

  return (
    <div className="App">
      <div className="header">
        <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Ccircle cx='30' cy='30' r='25' fill='%23333' stroke='%23666' stroke-width='2'/%3E%3Cpath d='M 15 25 L 30 15 L 45 25 L 30 35 Z' fill='%2300ff00'/%3E%3C/svg%3E" alt="logo" className="logo" />
        <h1>Simulateur de Cyberattaques</h1>
      </div>

      <div className="main-panel">
        <div className="target-section">
          <label>Sélectionnez votre cible</label>
          <div className="target-box">
            <span className="protocol">URL:</span>
            <input type="text" value={`http://${targetIP}:3000`} readOnly className="target-input" />
            <button className="lock-btn" onClick={generateRandomIP}>Nouvelle IP</button>
          </div>
          <div className="selected-target">
            <label>Cible sélectionnée</label>
            <div className="target-display">{targetIP}</div>
          </div>
        </div>

        <div className="attack-options">
          <label>Options d'attaque</label>
          <div className="attack-grid">
            <div className="attack-row">
              <div className="attack-type">
                <input
                  type="radio"
                  name="attack"
                  id="xss"
                  checked={selectedAttack === 'xss'}
                  onChange={() => setSelectedAttack('xss')}
                />
                <label htmlFor="xss">XSS</label>
              </div>
              <div className="attack-type">
                <input
                  type="radio"
                  name="attack"
                  id="dos"
                  checked={selectedAttack === 'dos'}
                  onChange={() => setSelectedAttack('dos')}
                />
                <label htmlFor="dos">DoS</label>
              </div>
              <div className="attack-type">
                <input
                  type="radio"
                  name="attack"
                  id="sql_injection"
                  checked={selectedAttack === 'sql_injection'}
                  onChange={() => setSelectedAttack('sql_injection')}
                />
                <label htmlFor="sql_injection">SQL Injection</label>
              </div>
            </div>

            <div className="attack-controls">
              <div className="control-group">
                <label>Méthode</label>
                <select className="method-select">
                  <option>{selectedAttack.toUpperCase()}</option>
                </select>
              </div>
              <div className="control-group">
                <label>Threads</label>
                <input type="number" defaultValue="10" className="threads-input" />
              </div>
              <div className="control-group">
                <label>Vitesse</label>
                <input type="range" min="1" max="100" defaultValue="50" className="speed-slider" />
              </div>
            </div>
          </div>
        </div>

        <div className="action-buttons">
          {!attackStatus[selectedAttack] ? (
            <button className="btn-fire" onClick={() => startAttack(selectedAttack)}>
              LANCER L'ATTAQUE
            </button>
          ) : (
            <button className="btn-stop" onClick={() => stopAttack(selectedAttack)}>
              ARRÊTER L'ATTAQUE
            </button>
          )}
          <button className="btn-reset" onClick={resetEnvironment}>
            RÉINITIALISER
          </button>
          <a
            href="http://localhost:3000"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-target-link"
          >
            OUVRIR LA CIBLE
          </a>
        </div>

        <div className="status-section">
          <label>Statut de l'attaque</label>
          <div className="status-grid">
            <div className="status-item">
              <span>Inactif</span>
              <div className="status-led"></div>
            </div>
            <div className="status-item">
              <span>Connexion</span>
              <div className="status-led"></div>
            </div>
            <div className="status-item">
              <span>Requête</span>
              <div className={`status-led ${isAnyAttackRunning ? 'active' : ''}`}></div>
            </div>
            <div className="status-item">
              <span>Téléchargement</span>
              <div className="status-led"></div>
            </div>
            <div className="status-item">
              <span>Téléchargement</span>
              <div className="status-led"></div>
            </div>
            <div className="status-item">
              <span>Requête envoyée</span>
              <div className={`status-led ${isAnyAttackRunning ? 'active pulse' : ''}`}></div>
            </div>
            <div className="status-item">
              <span>Échec</span>
              <div className="status-led"></div>
            </div>
          </div>
        </div>

        <div className="logs-section">
          <label>Logs de l'attaque</label>
          <div className="terminal">
            {logs.length === 0 ? (
              <div className="log-line">&gt; En attente du lancement de l'attaque...</div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className={`log-line ${log.type === 'error' ? 'error' : ''}`}>
                  <span className="log-time">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                  <span className="log-msg">{log.message}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="footer">
        <span>Praetox.com</span>
        <span>À des fins éducatives uniquement - Yazid, Ulrich, Jordan, Alexandre</span>
      </div>
    </div>
  );
}

export default App;
