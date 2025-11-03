import React, { useState, useEffect } from 'react';
import './App.css';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const API_BASE_URL = 'http://localhost:4000/api';

function App() {
  const [attackStatus, setAttackStatus] = useState({
    xss: false,
    dos: false,
    sql_injection: false
  });

  const [selectedAttack, setSelectedAttack] = useState('xss');
  const [logs, setLogs] = useState([]);
  const [backendConnected, setBackendConnected] = useState(false);
  const [dosMetrics, setDosMetrics] = useState({
    requestsPerSecond: [],
    responseTime: [],
    activeConnections: [],
    timestamps: []
  });
  const [dosSettings, setDosSettings] = useState({
    sockets: 500,
    sleeptime: 5
  });
  const [xssSettings, setXssSettings] = useState({
    mode: 'auto',
    payloadType: 'mixed'
  });
  const [sqlSettings, setSqlSettings] = useState({
    level: 1,
    technique: 'BEUSTQ'
  });
  const [sqlDatabase, setSqlDatabase] = useState(null);
  const [showDatabase, setShowDatabase] = useState(false);
  const [xssResults, setXssResults] = useState(null);
  const [showXssResults, setShowXssResults] = useState(false);

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

  useEffect(() => {
    if (attackStatus.dos) {
      fetchDosMetrics();
      const interval = setInterval(fetchDosMetrics, 1000);
      return () => clearInterval(interval);
    }
  }, [attackStatus.dos]);

  const fetchAttackStatus = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/attacks/status`);
      if (!response.ok) throw new Error('Backend not responding');
      const data = await response.json();
      setAttackStatus(data);
      setBackendConnected(true);
    } catch (error) {
      console.error('Error fetching attack status:', error);
      setBackendConnected(false);
    }
  };

  const fetchLogs = async (attackType) => {
    try {
      const response = await fetch(`${API_BASE_URL}/attacks/${attackType}/logs`);
      if (!response.ok) throw new Error('Failed to fetch logs');
      const data = await response.json();
      setLogs(Array.isArray(data) ? data : []);

      // Extraire les infos de la base de données depuis les logs SQL
      if (attackType === 'sql_injection' && Array.isArray(data)) {
        const dbInfo = {
          users: []
        };
        let currentUser = null;

        data.forEach(log => {
          const msg = log.message || '';
          if (msg.includes('Database Version:')) {
            dbInfo.version = msg.match(/Database Version:\s*(.+)/)?.[1]?.trim();
          }
          if (msg.includes('Database Name:')) {
            dbInfo.name = msg.match(/Database Name:\s*(.+)/)?.[1]?.trim();
          }
          if (msg.includes('Database User:')) {
            dbInfo.user = msg.match(/Database User:\s*(.+)/)?.[1]?.trim();
          }
          if (msg.includes('User Count:')) {
            dbInfo.userCount = msg.match(/User Count:\s*(\d+)/)?.[1];
          }

          // Extraire les users et hash (format: "User: admin | Hash: 5f4dcc3b...")
          if (msg.includes('User:') && msg.includes('Hash:')) {
            // Peut contenir plusieurs users sur plusieurs lignes
            const userMatches = msg.matchAll(/User:\s*(\w+)\s*\|\s*Hash:\s*([a-f0-9]{32})/g);
            for (const match of userMatches) {
              // Vérifier si ce user n'existe pas déjà
              if (!dbInfo.users.some(u => u.username === match[1])) {
                dbInfo.users.push({
                  username: match[1],
                  hash: match[2]
                });
              }
            }
          }
        });

        if (Object.keys(dbInfo).length > 0 || dbInfo.users.length > 0) {
          setSqlDatabase(dbInfo);
        }
      }

      // Extraire les résultats XSS depuis les logs
      if (attackType === 'xss' && Array.isArray(data)) {
        const xssInfo = {
          payloadsTested: 0,
          payloadsSuccessful: 0,
          vulnerabilityConfirmed: false
        };
        data.forEach(log => {
          const msg = log.message || '';
          if (msg.includes('Payloads tested:')) {
            xssInfo.payloadsTested = parseInt(msg.match(/Payloads tested:\s*(\d+)/)?.[1]) || 0;
          }
          if (msg.includes('Successful/Likely vulnerable:')) {
            xssInfo.payloadsSuccessful = parseInt(msg.match(/Successful\/Likely vulnerable:\s*(\d+)/)?.[1]) || 0;
          }
          if (msg.includes('XSS VULNERABILITY CONFIRMED')) {
            xssInfo.vulnerabilityConfirmed = true;
          }
        });
        if (xssInfo.payloadsTested > 0) {
          setXssResults(xssInfo);
        }
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
      setLogs([]);
    }
  };

  const fetchDosMetrics = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/attacks/dos/metrics`);
      if (!response.ok) throw new Error('Failed to fetch metrics');
      const data = await response.json();
      setDosMetrics(data);
    } catch (error) {
      console.error('Error fetching DoS metrics:', error);
    }
  };

  const startAttack = async (attackType) => {
    try {
      let body = {};
      if (attackType === 'dos') {
        body = dosSettings;
      } else if (attackType === 'xss') {
        body = xssSettings;
      } else if (attackType === 'sql_injection') {
        body = sqlSettings;
      }

      const response = await fetch(`${API_BASE_URL}/attacks/${attackType}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
      if (!response.ok) throw new Error('Failed to start attack');
      const data = await response.json();
      if (data.success) {
        setLogs([{ timestamp: new Date(), message: `Starting ${attackType.toUpperCase()} attack...` }]);
        fetchAttackStatus();
      }
    } catch (error) {
      console.error('Error starting attack:', error);
      setLogs([{ timestamp: new Date(), message: `Error: ${error.message}`, type: 'error' }]);
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

  return (
    <div className="App">
      <div className="header">
        <svg className="logo-upc" width="206" height="60" viewBox="0 0 411.22 120" xmlns="http://www.w3.org/2000/svg">
          <g transform="matrix(1.3333 0 0 -1.3333 -200.77 986.13)">
            <g transform="matrix(2.2508 0 0 2.2508 -188.34 -925.07)">
              <g fill="#860b34">
                <path transform="matrix(.3571 -1.4147e-7 -3.0323e-8 .35807 150.58 699.61)" d="m92.497 88.108h17.933v-1.651h-5.56v-33.398c0-9.681-1.72-19.888-5.772-26.493l-3.451 4.578c3.376 7.806 2.401 17.562 2.476 21.915v33.398h-5.626z"/>
                <path transform="matrix(.3571 -1.4147e-7 -3.0323e-8 .35807 150.58 699.61)" d="m63.99 83.755h0.675c1.876-18.688 5.777-34.824 18.905-53.211 8.177-11.483 19.2-27.769 19.2-27.769h11.48s-16.577 20.939-22.879 30.396c-15.003 22.365-20.179 40.452-21.004 77.299v1.2h-9.603v-1.2c0.3-30.468-3.15-43.752-7.802-55.159-3.225-7.806-9.527-17.862-17.179-25.593 0-1.35 0.676-4.427 1.276-6.454 5.326 6.98 14.178 10.732 21.905 10.732 5.701 0 10.877-1.426 15.528-5.628 1.801-1.727 5.027-5.479 10.353-14.26-5.701-6.004-13.653-9.9817-23.106-9.9817-13.278 0-19.354 4.9533-23.855 11.333-4.051 5.854-6.227 14.56-6.227 28.069v42.929h5.102v1.651h-36.759v-1.651h5.2512v-31.371c0-17.862 3.8259-27.769 10.128-36.4 6.376-8.7808 19.654-18.687 44.41-18.687 13.053 0 22.055 5.7789 27.006 10.807 1.351-2.3268 3.001-5.1787 4.576-8.0306h8.552s-5.701 8.7056-14.328 21.09c-9.077 13.133-17.929 14.86-26.631 14.86-4.576 0-10.053-2.177-13.128-4.353l-0.3 0.225c5.701 6.529 9.377 14.334 11.702 20.188 2.401 6.154 6.302 19.138 6.752 28.97z"/>
              </g>
              <g>
                <path transform="matrix(.3571 -1.4147e-7 -3.0323e-8 .35807 150.58 699.61)" d="m166.84 49.382c10.2 0 15.83 4.803 15.83 13.584v25.142h-5.7v-25.067c0-5.929-3.45-9.081-9.98-9.081s-9.98 3.152-9.98 9.081v25.067h-6.15v-25.142c0-8.781 5.7-13.584 15.98-13.584z"/>
                <path transform="matrix(.3571 -1.4147e-7 -3.0323e-8 .35807 150.58 699.61)" d="m213.8 49.907v21.239c0 3.978-2.93 6.305-8.1 6.305-4.95 0-9.08-1.952-10.95-3.753v3.377l-5.33-0.225v-26.943h5.63v20.114c1.72 2.326 5.4 3.527 8.25 3.527 3.3 0 4.87-1.126 4.87-3.527v-20.114z"/>
                <path transform="matrix(.3571 -1.4147e-7 -3.0323e-8 .35807 150.58 699.61)" d="m220.18 81.053h5.55v5.103h-5.55z"/>
                <path transform="matrix(.3571 -1.4147e-7 -3.0323e-8 .35807 150.58 699.61)" d="m220.18 49.907h5.55v27.093l-5.55-0.075z"/>
                <path transform="matrix(.3571 -1.4147e-7 -3.0323e-8 .35807 150.58 699.61)" d="m245.23 49.907 10.35 26.643 0.16 0.375h-4.88l-8.03-21.539-7.8 21.314v0.225h-6l10.35-27.018z"/>
                <path transform="matrix(.3571 -1.4147e-7 -3.0323e-8 .35807 150.58 699.61)" d="m262.34 66.868c1.2 6.38 4.95 7.355 7.12 7.355 5.7 0 6.6-4.953 6.68-7.355zm18.68-14.409v4.203l-0.38-0.451c-1.57-1.501-5.1-3.077-8.85-3.077-6.45 0-9.68 3.453-9.68 10.207v0.225h19.36v0.225c0.07 0.526 0.07 1.651 0.07 2.102 0 7.355-4.42 11.558-12.08 11.558-6.45 0-12.97-4.353-12.97-14.11 0-8.556 5.32-13.959 13.95-13.959 6.15 0 9.38 2.101 10.5 3.002z"/>
                <path transform="matrix(.3571 -1.4147e-7 -3.0323e-8 .35807 150.58 699.61)" d="m292.04 68.745c1.28 2.927 4.28 4.052 6.68 4.052 1.35 0 2.7-0.225 3.23-0.6l0.37-0.225v4.503l-0.07 0.075c-0.6 0.525-1.65 0.826-3.15 0.826-2.78 0-5.56-1.727-7.36-4.428v4.127l-5.32-0.225v-26.943h5.62z"/>
                <path transform="matrix(.3571 -1.4147e-7 -3.0323e-8 .35807 150.58 699.61)" d="m315.3 65.668c-3.45 1.2-5.55 1.876-5.55 4.503 0 2.251 2.1 3.602 5.4 3.602 2.55 0 5.4-0.901 7.05-1.876l0.38-0.225v3.827l-0.15 0.075c-1.35 0.901-4.21 1.877-7.88 1.877-6.08 0-9.83-3.002-9.83-7.806 0-4.728 3.6-6.604 7.58-7.955l0.75-0.225c3.3-1.201 5.47-1.952 5.47-4.653 0-2.627-1.87-3.828-5.77-3.828-3.15 0-6.3 1.426-8.1 2.777l-0.45 0.375v-4.052l0.15-0.076c1.42-1.275 4.95-2.626 8.92-2.626 6.68 0 10.51 2.927 10.51 7.88 0 5.178-3.98 6.98-8.48 8.406z"/>
                <path transform="matrix(.3571 -1.4147e-7 -3.0323e-8 .35807 150.58 699.61)" d="m334.65 86.156h-5.55v-5.103h5.55z"/>
                <path transform="matrix(.3571 -1.4147e-7 -3.0323e-8 .35807 150.58 699.61)" d="m334.65 77-5.55-0.075v-27.018h5.55z"/>
                <path transform="matrix(.3571 -1.4147e-7 -3.0323e-8 .35807 150.58 699.61)" d="m350.26 49.382c3.07 0 5.77 0.975 6.75 1.951l0.07 0.075v3.753l-0.37-0.301c-1.05-0.9-2.85-1.501-4.5-1.501-2.55 0-3.68 1.051-3.68 3.228v16.661h7.95v3.677h-7.95v7.205l-5.47-2.402v-4.803l-3.83-0.6v-3.077h3.75v-17.712c0-3.978 2.63-6.154 7.28-6.154z"/>
                <path transform="matrix(.3571 -1.4147e-7 -3.0323e-8 .35807 150.58 699.61)" d="m378.16 89.459h-5.77l-3.75-8.256h3.75z"/>
                <path transform="matrix(.3571 -1.4147e-7 -3.0323e-8 .35807 150.58 699.61)" d="m371.71 74.223c5.7 0 6.53-4.953 6.6-7.355h-13.72c1.12 6.38 4.95 7.355 7.12 7.355zm0 3.228c-6.52 0-13.05-4.353-13.05-14.11 0-8.556 5.4-13.959 13.95-13.959 6.15 0 9.45 2.101 10.5 3.002l0.15 0.075v4.203l-0.45-0.451c-1.57-1.501-5.1-3.077-8.85-3.077-6.37 0-9.67 3.453-9.67 10.207v0.225h19.35v0.225c0.08 0.526 0.08 1.651 0.08 2.102 0 7.355-4.36 11.558-12.01 11.558z"/>
                <path transform="matrix(.3571 -1.4147e-7 -3.0323e-8 .35807 150.58 699.61)" d="m157.01 36.998h6.08c5.32 0 7.8-2.326 7.8-7.43 0-4.953-2.63-7.505-7.8-7.505h-6.08zm7.43 3.978h-13.58v-38.201h6.15v15.311h7.28c7.95 0 12.9 4.353 12.9 11.482 0 7.13-4.72 11.408-12.75 11.408z"/>
                <path transform="matrix(.3571 -1.4147e-7 -3.0323e-8 .35807 150.58 699.61)" d="m188.97 5.6273c-1.73 0-4.58 0.5253-4.58 4.1278 0 3.5269 2.7 4.4279 5.1 5.2539 0.23 0.075 0.38 0.15 0.6 0.15 2.18 0.825 3.76 1.651 4.58 2.476v-8.8556c-1.2-2.0263-3.3-3.1521-5.7-3.1521zm13.2 0.075c-1.35 0-1.95 0.6755-1.95 2.0264v16.811c0 3.903-3.3 5.704-9.98 5.704-4.27 0-7.8-1.201-9.3-2.327l-0.15-0.075v-3.527l0.38 0.225c2.25 1.276 4.87 1.951 7.57 1.951 4.21 0 5.93-0.825 5.93-2.852v-1.426c0-2.026-2.32-2.927-6.75-4.428l-0.3-0.075c-4.13-1.275-8.48-2.626-8.48-8.2551 0-4.2779 3.3-7.2049 8.25-7.2049 4.58 0 6.91 1.8763 8.03 3.5274 0.38-2.1765 2.25-3.5274 4.95-3.5274 1.95 0 3.6 0.5254 4.43 1.426l0.07 0.075v2.7769l-0.37-0.2252c-0.45-0.3002-1.35-0.6004-2.33-0.6004z"/>
                <path transform="matrix(.3571 -1.4147e-7 -3.0323e-8 .35807 150.58 699.61)" d="m220.78 30.244c-2.78 0-5.55-1.726-7.35-4.428v4.128l-5.33-0.226v-26.943h5.63v18.838c1.27 2.927 4.27 4.053 6.67 4.053 1.43 0 2.7-0.3 3.23-0.601l0.45-0.3v4.578l-0.15 0.075c-0.6 0.526-1.65 0.826-3.15 0.826z"/>
                <path transform="matrix(.3571 -1.4147e-7 -3.0323e-8 .35807 150.58 699.61)" d="m227.6 33.846h5.63v5.179h-5.63z"/>
                <path transform="matrix(.3571 -1.4147e-7 -3.0323e-8 .35807 150.58 699.61)" d="m227.6 2.7754h5.63v27.094l-5.63-0.151z"/>
                <path transform="matrix(.3571 -1.4147e-7 -3.0323e-8 .35807 150.58 699.61)" d="m249.88 18.536c-3.37 1.126-5.47 1.801-5.47 4.503 0 2.252 2.02 3.602 5.32 3.602 2.63 0 5.4-0.975 7.06-1.876l0.37-0.225v3.828l-0.07 0.075c-1.35 0.825-4.28 1.801-7.88 1.801-6.08 0-9.9-2.927-9.9-7.805 0-4.654 3.67-6.53 7.65-7.881l0.75-0.3c3.3-1.126 5.47-1.876 5.47-4.578 0-2.6267-1.87-3.9026-5.77-3.9026-3.15 0-6.38 1.426-8.1 2.8519l-0.45 0.3002v-3.9777l0.07-0.075c1.5-1.3509 5.03-2.6268 9-2.6268 6.68 0 10.51 2.8519 10.51 7.88 0 5.179-4.06 6.905-8.56 8.406z"/>
                <path transform="matrix(.3571 -1.4147e-7 -3.0323e-8 .35807 150.58 699.61)" d="m295.87 6.603c-8.78 0-14.7 6.154-14.7 15.31 0 9.231 5.85 15.235 14.85 15.235 4.2 0 7.58-1.05 10.43-3.302l0.37-0.375v4.803l-0.07 0.075c-2.18 1.501-5.4 3.152-11.26 3.152-12.3 0-20.63-7.88-20.63-19.588 0-11.783 8.11-19.663 20.11-19.663 5.18 0 9.23 1.2008 12.38 3.6024l0.15 0.0751v4.9535l-0.45-0.375c-3.23-2.6272-6.83-3.903-11.18-3.903z"/>
                <path transform="matrix(.3571 -1.4147e-7 -3.0323e-8 .35807 150.58 699.61)" d="m313.72 33.846h5.55v5.179h-5.55z"/>
                <path transform="matrix(.3571 -1.4147e-7 -3.0323e-8 .35807 150.58 699.61)" d="m313.72 2.7754h5.55v27.094l-5.55-0.151z"/>
                <path transform="matrix(.3571 -1.4147e-7 -3.0323e-8 .35807 150.58 699.61)" d="m336.83 6.2277c-2.55 0-3.68 1.0507-3.68 3.2272v16.661h7.96v3.602h-7.96v7.28l-5.47-2.401v-4.803l-3.83-0.601v-3.077h3.75v-17.712c0-3.9777 2.63-6.1542 7.28-6.1542 3.07 0 5.77 0.9757 6.75 1.9513l0.08 0.0751v3.7525l-0.38-0.3002c-1.05-0.9006-2.85-1.501-4.5-1.501z"/>
                <path transform="matrix(.3571 -1.4147e-7 -3.0323e-8 .35807 150.58 699.61)" d="m357.01 34.071 5.78 8.256h-5.78l-3.75-8.256z"/>
                <path transform="matrix(.3571 -1.4147e-7 -3.0323e-8 .35807 150.58 699.61)" d="m356.33 27.092c5.7 0 6.53-4.954 6.61-7.355h-13.73c1.12 6.379 4.95 7.355 7.12 7.355zm0 3.152c-6.52 0-13.05-4.278-13.05-14.035 0-8.6304 5.4-13.959 14.03-13.959 6.08 0 9.38 2.1014 10.43 3.002l0.15 0.0751v4.2028l-0.45-0.4503c-1.58-1.501-5.1-3.0771-8.86-3.0771-6.37 0-9.67 3.4524-9.67 10.132v0.301h19.35v0.225c0.08 0.525 0.08 1.651 0.08 2.101 0 7.28-4.35 11.483-12.01 11.483z"/>
              </g>
            </g>
          </g>
        </svg>
        <h1>Simulateur de Cyberattaques</h1>
      </div>

      <div className="main-panel">
        <div className="attack-options">
          <label>Type d'attaque</label>
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
                <label htmlFor="xss">XSS (Cross-Site Scripting)</label>
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
              <div className="attack-type">
                <input
                  type="radio"
                  name="attack"
                  id="dos"
                  checked={selectedAttack === 'dos'}
                  onChange={() => setSelectedAttack('dos')}
                />
                <label htmlFor="dos">DoS (Denial of Service)</label>
              </div>
            </div>
          </div>
        </div>

        {selectedAttack === 'xss' && !attackStatus.xss && (
          <div className="xss-settings">
            <label>Réglages XSS (XSSer)</label>
            <div className="settings-grid">
              <div className="setting-item">
                <label htmlFor="xss-mode">Mode d'attaque :</label>
                <select
                  id="xss-mode"
                  value={xssSettings.mode}
                  onChange={(e) => setXssSettings({...xssSettings, mode: e.target.value})}
                  className="setting-select"
                >
                  <option value="auto">Auto (Scan automatique)</option>
                  <option value="manual">Manuel (Payloads personnalisés)</option>
                </select>
              </div>
              <div className="setting-item">
                <label htmlFor="xss-payload">Type de payload :</label>
                <select
                  id="xss-payload"
                  value={xssSettings.payloadType}
                  onChange={(e) => setXssSettings({...xssSettings, payloadType: e.target.value})}
                  className="setting-select"
                >
                  <option value="basic">Basic (Script tags simples)</option>
                  <option value="mixed">Mixed (Détection automatique)</option>
                  <option value="advanced">Advanced (Obfuscation + Encoding)</option>
                </select>
              </div>
            </div>
            <div className="settings-info">
              <p>Basic = Rapide | Mixed = Équilibré | Advanced = Maximum de payloads</p>
            </div>
          </div>
        )}

        {selectedAttack === 'sql_injection' && !attackStatus.sql_injection && (
          <div className="sql-settings">
            <label>Réglages SQL Injection (SQLMap)</label>
            <div className="settings-grid">
              <div className="setting-item">
                <label htmlFor="sql-level">Niveau d'attaque (1-5) :</label>
                <input
                  type="range"
                  id="sql-level"
                  min="1"
                  max="5"
                  step="1"
                  value={sqlSettings.level}
                  onChange={(e) => setSqlSettings({...sqlSettings, level: parseInt(e.target.value)})}
                />
                <span className="setting-value">{sqlSettings.level}</span>
              </div>
              <div className="setting-item">
                <label htmlFor="sql-technique">Technique SQLMap :</label>
                <select
                  id="sql-technique"
                  value={sqlSettings.technique}
                  onChange={(e) => setSqlSettings({...sqlSettings, technique: e.target.value})}
                  className="setting-select"
                >
                  <option value="B">Boolean-based blind</option>
                  <option value="E">Error-based</option>
                  <option value="U">Union query-based</option>
                  <option value="S">Stacked queries</option>
                  <option value="T">Time-based blind</option>
                  <option value="Q">Inline queries</option>
                  <option value="BEUSTQ">ALL (Toutes techniques)</option>
                </select>
              </div>
            </div>
            <div className="settings-info">
              <p>Niveau 1-2 = Rapide | 3-4 = Approfondi | 5 = Maximum + Dump DB</p>
            </div>
          </div>
        )}

        {selectedAttack === 'dos' && !attackStatus.dos && (
          <div className="dos-settings">
            <label>Réglages DoS (Slowloris)</label>
            <div className="settings-grid">
              <div className="setting-item">
                <label htmlFor="sockets">Nombre de sockets :</label>
                <input
                  type="range"
                  id="sockets"
                  min="50"
                  max="1000"
                  step="50"
                  value={dosSettings.sockets}
                  onChange={(e) => setDosSettings({...dosSettings, sockets: parseInt(e.target.value)})}
                />
                <span className="setting-value">{dosSettings.sockets}</span>
              </div>
              <div className="setting-item">
                <label htmlFor="sleeptime">Sleeptime (secondes) :</label>
                <input
                  type="range"
                  id="sleeptime"
                  min="1"
                  max="30"
                  step="1"
                  value={dosSettings.sleeptime}
                  onChange={(e) => setDosSettings({...dosSettings, sleeptime: parseInt(e.target.value)})}
                />
                <span className="setting-value">{dosSettings.sleeptime}s</span>
              </div>
            </div>
            <div className="settings-info">
              <p>Plus de sockets = Plus puissant | Sleeptime plus bas = Plus agressif</p>
            </div>
          </div>
        )}

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
            ALLER À LA CIBLE
          </a>
        </div>

        <div className="status-section">
          <label>Statut des attaques</label>
          <div className="status-grid">
            <div className="status-item">
              <span>Backend</span>
              <div className={`status-led ${backendConnected ? 'active' : ''}`}></div>
            </div>
            <div className="status-item">
              <span>XSS</span>
              <div className={`status-led ${attackStatus.xss ? 'active pulse' : ''}`}></div>
            </div>
            <div className="status-item">
              <span>SQL Injection</span>
              <div className={`status-led ${attackStatus.sql_injection ? 'active pulse' : ''}`}></div>
            </div>
            <div className="status-item">
              <span>DoS</span>
              <div className={`status-led ${attackStatus.dos ? 'active pulse' : ''}`}></div>
            </div>
          </div>
        </div>

        {selectedAttack === 'dos' && attackStatus.dos && (
          <div className="metrics-section">
            <label>Métriques DoS en temps réel</label>
            <div className="charts-grid">
              <div className="chart-container full-width">
                <h3>Temps de réponse (ms)</h3>
                <Line
                  data={{
                    labels: dosMetrics.timestamps.map((t, i) => `${i}s`),
                    datasets: [
                      {
                        label: 'Temps de réponse',
                        data: dosMetrics.responseTime,
                        borderColor: '#2c3e50',
                        backgroundColor: 'transparent',
                        fill: false,
                        tension: 0,
                        borderWidth: 2,
                        pointRadius: 3
                      },
                      {
                        label: 'Seuil Normal (1500ms)',
                        data: Array(dosMetrics.timestamps.length).fill(1500),
                        borderColor: '#28a745',
                        backgroundColor: 'transparent',
                        borderDash: [5, 5],
                        borderWidth: 1,
                        pointRadius: 0
                      },
                      {
                        label: 'Seuil Alerte (6000ms)',
                        data: Array(dosMetrics.timestamps.length).fill(6000),
                        borderColor: '#ffc107',
                        backgroundColor: 'transparent',
                        borderDash: [5, 5],
                        borderWidth: 1,
                        pointRadius: 0
                      },
                      {
                        label: 'Seuil Critique (12000ms)',
                        data: Array(dosMetrics.timestamps.length).fill(12000),
                        borderColor: '#dc3545',
                        backgroundColor: 'transparent',
                        borderDash: [5, 5],
                        borderWidth: 1,
                        pointRadius: 0
                      }
                    ]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      x: {
                        title: { display: true, text: 'Temps écoulé' },
                        grid: { display: true, color: 'rgba(0,0,0,0.05)' }
                      },
                      y: {
                        beginAtZero: true,
                        title: { display: true, text: 'Temps (ms)' },
                        grid: { display: true, color: 'rgba(0,0,0,0.05)' }
                      }
                    },
                    plugins: {
                      legend: {
                        display: true,
                        position: 'bottom',
                        labels: { font: { size: 10 } }
                      }
                    }
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {selectedAttack === 'dos' && (
          <div className="attack-description">
            <label>Comment fonctionne l'attaque DoS (Denial of Service) ?</label>
            <div className="description-content">
              <h3>Principe de l'attaque</h3>
              <p>
                L'attaque par déni de service (DoS) vise à rendre un service indisponible en saturant ses ressources.
                Nous utilisons <strong>Slowloris</strong>, une technique qui maintient de nombreuses connexions HTTP ouvertes
                le plus longtemps possible en envoyant des requêtes partielles très lentement.
              </p>

              <h3>Étapes de l'attaque Slowloris</h3>
              <ol>
                <li><strong>Ouverture de multiples sockets</strong> : Création de centaines de connexions simultanées vers le serveur cible</li>
                <li><strong>Envoi de requêtes partielles</strong> : Chaque connexion envoie une requête HTTP incomplète</li>
                <li><strong>Maintien des connexions</strong> : Envoi périodique d'en-têtes HTTP pour garder les connexions actives</li>
                <li><strong>Saturation du serveur</strong> : Le serveur garde les connexions ouvertes en attendant la fin des requêtes, épuisant ainsi ses ressources</li>
              </ol>

              <h3>Paramètres configurables</h3>
              <div className="code-block">
                <code>slowloris --sockets {dosSettings.sockets} --sleeptime {dosSettings.sleeptime}</code>
              </div>
              <p className="explanation">
                Plus de sockets = plus de connexions simultanées. Sleeptime bas = envoi plus fréquent (plus agressif).
              </p>

              <h3>Impact observable</h3>
              <ul>
                <li>Augmentation du temps de réponse du serveur</li>
                <li>Connexions actives qui saturent le pool du serveur</li>
                <li>Réduction drastique des requêtes traitées par seconde</li>
                <li>Impossibilité pour les utilisateurs légitimes d'accéder au service</li>
              </ul>
            </div>
          </div>
        )}

        {selectedAttack === 'xss' && (
          <div className="attack-description">
            <label>Comment fonctionne l'attaque XSS (Cross-Site Scripting) ?</label>
            <div className="description-content">
              <h3>Principe de l'attaque</h3>
              <p>
                L'attaque XSS (Cross-Site Scripting) exploite les failles de validation des entrées utilisateur.
                Un attaquant injecte du code JavaScript malveillant dans une page web, qui sera exécuté dans
                le navigateur des victimes. Ici nous testons le <strong>XSS Réfléchi</strong> (Reflected XSS).
              </p>

              <h3>Étapes de l'attaque automatisée</h3>
              <ol>
                <li><strong>Tentative avec XSSer</strong> : Utilisation de l'outil XSSer pour scanner automatiquement</li>
                <li><strong>Tests manuels de payloads</strong> : Si XSSer échoue, envoi de payloads XSS variés via curl</li>
                <li><strong>Détection de la vulnérabilité</strong> : Vérification si les payloads sont reflétés sans échappement</li>
                <li><strong>Documentation</strong> : Génération d'instructions pour tests manuels complets dans le navigateur</li>
              </ol>

              <h3>Exemples de payloads testés</h3>
              <div className="code-block">
                <code>&lt;script&gt;alert('XSS')&lt;/script&gt;</code>
              </div>
              <div className="code-block">
                <code>&lt;img src=x onerror=alert('XSS')&gt;</code>
              </div>
              <div className="code-block">
                <code>&lt;svg/onload=alert('XSS')&gt;</code>
              </div>
              <p className="explanation">
                Ces payloads exploitent différents vecteurs : balises script, événements d'erreur d'image, et SVG inline.
              </p>

              <h3>Impact d'une vulnérabilité XSS</h3>
              <ul>
                <li>Vol de cookies de session (hijacking de compte)</li>
                <li>Keylogging et capture de données sensibles</li>
                <li>Redirection vers des sites de phishing</li>
                <li>Modification du contenu de la page (defacement)</li>
                <li>Exécution de code JavaScript arbitraire dans le contexte de l'utilisateur</li>
              </ul>

              <h3>Note importante</h3>
              <p>
                DVWA utilise des protections CSRF qui empêchent l'exploitation automatique complète.
                Les tests manuels dans le navigateur (après authentification) démontrent la vulnérabilité réelle.
              </p>
            </div>
          </div>
        )}

        {selectedAttack === 'sql_injection' && (
          <div className="attack-description">
            <label>Comment fonctionne l'attaque SQL Injection ?</label>
            <div className="description-content">
              <h3>Principe de l'attaque</h3>
              <p>
                L'injection SQL exploite les failles dans les requêtes SQL dynamiques. Quand une application
                concatène directement l'entrée utilisateur dans une requête SQL sans validation, un attaquant
                peut injecter du code SQL malveillant.
              </p>

              <h3>Étapes de l'attaque automatisée</h3>
              <ol>
             
                <li><strong>Configuration</strong> : Le niveau de sécurité est défini à "Low" pour maximiser la vulnérabilité</li>
                <li><strong>Test de vulnérabilité</strong> : Injection de <code>1' OR '1'='1</code> pour bypasser l'authentification</li>
                <li><strong>Extraction de données</strong> : Utilisation de UNION SELECT pour récupérer :
                  <ul>
                    <li>Version de la base de données</li>
                    <li>Nom de la base</li>
                    <li>Utilisateur MySQL</li>
                    <li>Liste des utilisateurs et leurs hash MD5</li>
                  </ul>
                </li>
              </ol>

              <h3>Exemple de payload</h3>
              <div className="code-block">
                <code>1' UNION SELECT user, password FROM users#</code>
              </div>
              <p className="explanation">
                Cette injection transforme la requête SQL pour récupérer tous les utilisateurs et leurs mots de passe hashés.
              </p>
            </div>
          </div>
        )}

        {selectedAttack === 'xss' && xssResults && (
          <div className="results-section">
            <div className="database-header">
              <label>Résultats de l'attaque XSS</label>
              <button
                className="btn-toggle-db"
                onClick={() => setShowXssResults(!showXssResults)}
              >
                {showXssResults ? 'MASQUER' : 'AFFICHER LES RÉSULTATS'}
              </button>
            </div>

            {showXssResults && (
              <div className="database-content">
                <div className="db-info-grid">
                  <div className="db-info-item">
                    <span className="db-label">Payloads testés :</span>
                    <span className="db-value">{xssResults.payloadsTested}</span>
                  </div>
                  <div className="db-info-item">
                    <span className="db-label">Payloads réussis :</span>
                    <span className="db-value">{xssResults.payloadsSuccessful}</span>
                  </div>
                  <div className="db-info-item">
                    <span className="db-label">Vulnérabilité :</span>
                    <span className={`db-value ${xssResults.vulnerabilityConfirmed ? 'vulnerable' : ''}`}>
                      {xssResults.vulnerabilityConfirmed ? 'CONFIRMÉE' : 'Non détectée'}
                    </span>
                  </div>
                  <div className="db-info-item">
                    <span className="db-label">Taux de succès :</span>
                    <span className="db-value">
                      {xssResults.payloadsTested > 0
                        ? Math.round((xssResults.payloadsSuccessful / xssResults.payloadsTested) * 100)
                        : 0}%
                    </span>
                  </div>
                </div>

                <div className="xss-example-section">
                  <h3>Exemple d'exploitation réussie</h3>
                  <div className="xss-screenshot">
                    <img src="/xss-example.png" alt="Exemple d'attaque XSS réussie sur DVWA" />
                  </div>
                  <p className="screenshot-caption">
                    Capture d'écran montrant une attaque XSS reflétée réussie sur DVWA avec affichage
                    d'informations sensibles (username: admin, security level: low, PHPIDs: disabled)
                  </p>
                </div>

                <div className="db-warning">
                  Pour une démonstration complète, testez les payloads manuellement dans le navigateur après connexion à DVWA
                </div>
              </div>
            )}
          </div>
        )}

        {selectedAttack === 'sql_injection' && sqlDatabase && (
          <div className="database-section">
            <div className="database-header">
              <label>Base de données extraite</label>
              <button
                className="btn-toggle-db"
                onClick={() => setShowDatabase(!showDatabase)}
              >
                {showDatabase ? 'MASQUER' : 'AFFICHER LA BDD'}
              </button>
            </div>

            {showDatabase && (
              <div className="database-content">
                <div className="db-info-grid">
                  <div className="db-info-item">
                    <span className="db-label">Version :</span>
                    <span className="db-value">{sqlDatabase.version || 'N/A'}</span>
                  </div>
                  <div className="db-info-item">
                    <span className="db-label">Nom de la BDD :</span>
                    <span className="db-value">{sqlDatabase.name || 'N/A'}</span>
                  </div>
                  <div className="db-info-item">
                    <span className="db-label">Utilisateur :</span>
                    <span className="db-value">{sqlDatabase.user || 'N/A'}</span>
                  </div>
                  <div className="db-info-item">
                    <span className="db-label">Nombre d'utilisateurs :</span>
                    <span className="db-value">{sqlDatabase.userCount || 'N/A'}</span>
                  </div>
                </div>

                {sqlDatabase.users && sqlDatabase.users.length > 0 && (
                  <div className="users-table-section">
                    <h3>Utilisateurs compromis ({sqlDatabase.users.length})</h3>
                    <div className="users-table">
                      <div className="users-table-header">
                        <div className="table-cell">Username</div>
                        <div className="table-cell">Hash MD5</div>
                      </div>
                      {sqlDatabase.users.map((user, index) => (
                        <div key={index} className="users-table-row">
                          <div className="table-cell username">{user.username}</div>
                          <div className="table-cell hash">{user.hash}</div>
                        </div>
                      ))}
                    </div>
                    <div className="hash-note">
                      Ces hash MD5 peuvent être cassés avec des outils comme hashcat ou des rainbow tables
                    </div>
                  </div>
                )}

                <div className="db-warning">
                  Données sensibles extraites via SQL Injection - Ceci démontre l'impact critique de cette vulnérabilité
                </div>
              </div>
            )}
          </div>
        )}

        <div className="logs-section">
          <label>Logs de l'attaque - {selectedAttack.toUpperCase()}</label>
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
        <span>Projet éducatif uniquement - Yazid, Ulrich, Jordan, Alexandre</span>
      </div>
    </div>
  );
}

export default App;
