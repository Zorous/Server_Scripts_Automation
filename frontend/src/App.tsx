import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Dummy user for login
const USER = {
  username: 'admin',
  password: 'admin123',
};

const App = () => {
  const [scripts, setScripts] = useState([]);
  const [selectedScript, setSelectedScript] = useState('');
  const [output, setOutput] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (isLoggedIn) {
      axios.get('http://localhost:5004/scripts')
        .then(response => setScripts(response.data))
        .catch(error => console.error("Error fetching scripts:", error));
    }
  }, [isLoggedIn]);

  const runScript = () => {
    axios.post('http://localhost:5004/run_script', { script_name: selectedScript })
      .then(response => setOutput(response.data.output))
      .catch(error => setOutput('Error: ' + error.response?.data?.error || error.message));
  };

  const handleLogin = () => {
    if (username === USER.username && password === USER.password) {
      setIsLoggedIn(true);
    } else {
      alert("Invalid credentials");
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      width: "100vw",
      padding: '20px',
      backgroundColor: '#f4f4f4',
      fontFamily: 'Arial, sans-serif',
    }}>
      {!isLoggedIn ? (
        <div style={{
          backgroundColor: '#fff',
          padding: '30px',
          borderRadius: '10px',
          boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
          width: '100%',
          maxWidth: '400px',
          textAlign: 'center',
        }}>
          <h2>Login</h2>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{
              padding: '12px',
              width: '100%',
              marginBottom: '10px',
              border: '1px solid #ccc',
              borderRadius: '5px',
            }}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              padding: '12px',
              width: '100%',
              marginBottom: '20px',
              border: '1px solid #ccc',
              borderRadius: '5px',
            }}
          />
          <button
            onClick={handleLogin}
            style={{
              padding: '12px 20px',
              backgroundColor: '#4CAF50',
              color: '#fff',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              width: '100%',
              fontSize: '16px',
            }}
          >
            Login
          </button>
        </div>
      ) : (
        <div style={{
          backgroundColor: '#fff',
          padding: '30px',
          borderRadius: '10px',
          boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
          width: '100%',
          maxWidth: '600px',
        }}>
          <h1 style={{ textAlign: 'center', marginBottom: '20px' }}>Select a Python Script to Run</h1>
          <select
            onChange={(e) => setSelectedScript(e.target.value)}
            value={selectedScript}
            style={{
              padding: '12px',
              width: '100%',
              marginBottom: '20px',
              border: '1px solid #ccc',
              borderRadius: '5px',
            }}
          >
            <option value="">Select a script</option>
            {scripts.map(script => (
              <option key={script} value={script}>{script}</option>
            ))}
          </select>
          <button
            onClick={runScript}
            disabled={!selectedScript}
            style={{
              padding: '12px 20px',
              backgroundColor: selectedScript ? '#4CAF50' : '#ccc',
              color: '#fff',
              border: 'none',
              borderRadius: '5px',
              cursor: selectedScript ? 'pointer' : 'not-allowed',
              width: '100%',
              fontSize: '16px',
            }}
          >
            Run Script
          </button>
          <h3 style={{ marginTop: '20px', color: "blue" }}>Output:</h3>
          <div style={{
            backgroundColor: '#f9f9f9',
            padding: '15px',
            border: '1px solid #ddd',
            borderRadius: '5px',
            textAlign: 'left',
            whiteSpace: 'pre-wrap',
            height: '150px',
            overflowY: 'auto',
            color : "orange"
          }}>
            {output || "No output yet"}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
