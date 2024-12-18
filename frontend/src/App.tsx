import React, { useState, useEffect } from "react";
import axios from "axios";

// Dummy user for login
const USER = {
  username: "admin",
  password: "admin123",
};

const App = () => {
  const [scripts, setScripts] = useState([]);
  const [selectedScriptId, setSelectedScriptId] = useState("");
  const [output, setOutput] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [newCommand, setNewCommand] = useState("");
  const [newCommandName, setNewCommandName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (isLoggedIn) {
      axios
        .get("http://localhost:5004/scripts")
        .then((response) => setScripts(response.data))
        .catch((error) => console.error("Error fetching scripts:", error));
    }
  }, [isLoggedIn]);

  const runScript = () => {
    axios
      .post("http://localhost:5004/run_script", { script_id: selectedScriptId })
      .then((response) => setOutput(response.data.output))
      .catch((error) =>
        setOutput("Error: " + (error.response?.data?.error || error.message))
      );
  };

  const handleAddCommand = () => {
    if (!newCommand || !newCommandName) {
      alert("Please provide a name and command.");
      return;
    }

    axios
      .post("http://localhost:5004/add_command", {
        name: newCommandName,
        command: newCommand,
        description: newDescription
      })
      .then(() => {
        alert("Command added successfully!");
        setNewCommand("");
        setNewCommandName("");
        setNewDescription("");
        setShowModal(false); // Close modal on success
        axios
          .get("http://localhost:5004/scripts")
          .then((response) => setScripts(response.data))
          .catch((error) =>
            console.error("Error fetching scripts after adding:", error)
          );
      })
      .catch((error) =>
        alert("Error adding command: " + (error.response?.data?.error || error.message))
      );
  };

  const handleLogin = () => {
    if (username === USER.username && password === USER.password) {
      setIsLoggedIn(true);
    } else {
      alert("Invalid credentials");
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        width: "100vw",
        padding: "20px",
        backgroundColor: "#f4f4f4",
        fontFamily: "Arial, sans-serif",
      }}
    >
      {!isLoggedIn ? (
        <div
          style={{
            backgroundColor: "#fff",
            padding: "30px",
            borderRadius: "10px",
            boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
            width: "100%",
            maxWidth: "400px",
            textAlign: "center",
          }}
        >
          <h2>Login</h2>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{
              padding: "12px",
              width: "100%",
              marginBottom: "10px",
              border: "1px solid #ccc",
              borderRadius: "5px",
            }}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              padding: "12px",
              width: "100%",
              marginBottom: "20px",
              border: "1px solid #ccc",
              borderRadius: "5px",
            }}
          />
          <button
            onClick={handleLogin}
            style={{
              padding: "12px 20px",
              backgroundColor: "#4CAF50",
              color: "#fff",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
              width: "100%",
              fontSize: "16px",
            }}
          >
            Login
          </button>
        </div>
      ) : (
        <div
          style={{
            backgroundColor: "#fff",
            padding: "30px",
            borderRadius: "10px",
            boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
            width: "100%",
            maxWidth: "600px",
          }}
        >
          <h1 style={{ textAlign: "center", marginBottom: "20px" }}>
            Select a Job to Run
          </h1>
          <select
            onChange={(e) => setSelectedScriptId(e.target.value)}
            value={selectedScriptId}
            style={{
              padding: "12px",
              width: "100%",
              marginBottom: "20px",
              border: "1px solid #ccc",
              borderRadius: "5px",
            }}
          >
            <option value="">Select a job</option>
            {scripts?.map((script) => (
              <option key={script?.id} value={script?.id}>
                {script?.name}
              </option>
            ))}
          </select>
          <button
            onClick={runScript}
            disabled={!selectedScriptId}
            style={{
              padding: "12px 20px",
              backgroundColor: selectedScriptId ? "#4CAF50" : "#ccc",
              color: "#fff",
              border: "none",
              borderRadius: "5px",
              cursor: selectedScriptId ? "pointer" : "not-allowed",
              width: "100%",
              fontSize: "16px",
            }}
          >
            Run Job
          </button>
          <h3 style={{ marginTop: "20px", color: "blue" }}>Output:</h3>
          <div
            style={{
              backgroundColor: "#757575",
              padding: "10px",
              borderRadius: "5px",
              minHeight: "50px",
            }}
          >
            {output ? output : "Job output will appear here."}
          </div>
          <button
            onClick={() => setShowModal(true)}
            style={{
              padding: "12px 20px",
              backgroundColor: "#2196F3",
              color: "#fff",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
              width: "100%",
              fontSize: "16px",
              marginTop: "20px",
            }}
          >
            Add New Job
          </button>

          {showModal && (
            <div
              style={{
                position: "fixed",
                top: "0",
                left: "0",
                width: "100%",
                height: "100%",
                backgroundColor: "rgba(0,0,0,0.5)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  backgroundColor: "#fff",
                  padding: "20px",
                  borderRadius: "10px",
                  boxShadow: "0 4px 10px rgba(0, 0, 0, 0.3)",
                  width: "100%",
                  maxWidth: "400px",
                }}
              >
                <h2>Add a New Job</h2>
                <input
                  type="text"
                  placeholder="Command Name"
                  value={newCommandName}
                  onChange={(e) => setNewCommandName(e.target.value)}
                  style={{
                    padding: "12px",
                    width: "90%",
                    marginBottom: "10px",
                    border: "1px solid #ccc",
                    borderRadius: "5px",
                  }}
                />
                <input
                  type="text"
                  placeholder="Command"
                  value={newCommand}
                  onChange={(e) => setNewCommand(e.target.value)}
                  style={{
                    padding: "12px",
                    width: "90%",
                    marginBottom: "20px",
                    border: "1px solid #ccc",
                    borderRadius: "5px",
                  }}
                />
                <input
                  type="text"
                  placeholder="Description"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  style={{
                    padding: "12px",
                    width: "90%",
                    marginBottom: "20px",
                    border: "1px solid #ccc",
                    borderRadius: "5px",
                  }}
                />
                <button
                  onClick={handleAddCommand}
                  style={{
                    padding: "12px 20px",
                    backgroundColor: "#4CAF50",
                    color: "#fff",
                    border: "none",
                    borderRadius: "5px",
                    cursor: "pointer",
                    width: "90%",
                    fontSize: "16px",
                  }}
                >
                  Add Command
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  style={{
                    marginTop: "10px",
                    padding: "12px 20px",
                    backgroundColor: "#f44336",
                    color: "#fff",
                    border: "none",
                    borderRadius: "5px",
                    cursor: "pointer",
                    width: "90%",
                    fontSize: "16px",
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default App;
