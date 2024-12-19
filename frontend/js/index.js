const USER = {
  username: "admin",
  password: "admin123",
};

let scripts = [];

// Initialize app
document.addEventListener("DOMContentLoaded", () => {
  const app = document.getElementById("app");
  const isLoggedIn = !!localStorage.getItem("isLoggedIn");

  if (isLoggedIn) {
    loadScripts();
    renderApp(app);
  } else {
    renderLogin(app);
  }
});

function renderLogin(app) {
  app.innerHTML = `
    <div class="login-container">
      <h2>Login</h2>
      <input type="text" id="username" placeholder="Username" />
      <input type="password" id="password" placeholder="Password" />
      <button id="login-btn">Login</button>
    </div>
  `;

  document.getElementById("login-btn").addEventListener("click", handleLogin);
}

function handleLogin() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  if (username === USER.username && password === USER.password) {
    localStorage.setItem("isLoggedIn", true);
    loadScripts();
    renderApp(document.getElementById("app"));
  } else {
    alert("Invalid credentials");
  }
}

function renderApp(app) {
  app.innerHTML = `
    <div class="app-container">
      <h1>Select a Job to Run</h1>
      <select id="scriptDropdown">
        <option value="">Select a job</option>
        ${scripts
          .map((script) => `<option value="${script.id}">${script.name}</option>`)
          .join("")}
      </select>
      <button id="run-btn">Run Job</button>
      <h3>Output:</h3>
      <div id="output">Job output will appear here.</div>
      <button id="logout-btn">Logout</button>
    </div>
  `;

  document.getElementById("run-btn").addEventListener("click", runScript);
  document.getElementById("logout-btn").addEventListener("click", handleLogout);
}

function loadScripts() {
  fetch("http://localhost:5004/scripts") // Replace with your Flask server's URL
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok " + response.statusText);
      }
      return response.json();
    })
    .then((data) => {
      scripts = data; // Assigning fetched scripts to the global `scripts` variable
      console.log("Scripts loaded:", scripts);
      populateScriptDropdown(scripts); // Optionally update the UI with scripts
    })
    .catch((error) => {
      console.error("There was a problem with the fetch operation:", error);
    });
}

function populateScriptDropdown(scripts) {
  const dropdown = document.getElementById("scriptDropdown"); // Replace with your dropdown's ID
  dropdown.innerHTML = ""; // Clear any existing options

  scripts.forEach((script) => {
    const option = document.createElement("option");
    option.value = script.id;
    option.textContent = script.name;
    dropdown.appendChild(option);
  });
}


function runScript() {
  const selectedScriptId = document.getElementById("scriptDropdown").value;
  
  // Debug log to confirm selected script ID
  console.log("Selected Script ID:", selectedScriptId);
  
  if (!selectedScriptId) {
    console.error("Error: No script selected.");
    alert("Please select a script to run.");
    return;
  }

  // Show immediate output in the UI (before actual server call)
  const output = `Running script with ID: ${selectedScriptId}`;
  document.getElementById("output").innerText = output;

  // Prepare data to send to the server
  const requestData = { script_id: selectedScriptId };

  console.log("Request Data for script execution:", requestData);

  // Make the fetch request to the server
  fetch('http://localhost:5004/run_script', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestData),
  })
  .then(response => {
    console.log("Server response status:", response.status);
    
    // Check if the server responded with success
    if (!response.ok) {
      console.error("Error: Server responded with status:", response.status);
      return response.text().then(text => {
        console.error("Error details:", text);
        throw new Error(`Server error: ${text}`);
      });
    }
  
    return response.json();
  })
  .then(data => {
    console.log("Server response data:", data);
    
    // Check if there's an output in the server response
    if (data.output) {
      console.log("Script execution output:", data.output);
      document.getElementById("output").innerText = data.output;
    } else if (data.error) {
      console.error("Error in script execution:", data.error);
      document.getElementById("output").innerText = `Error: ${data.error}`;
    }
  })
  .catch(error => {
    console.error("Error during fetch operation:", error);
    document.getElementById("output").innerText = `Error: ${error.message}`;
  });
  
}

function handleLogout() {
  console.log("Logging out...");
  localStorage.removeItem("isLoggedIn");
  console.log("Logged out. Rendering login page...");
  renderLogin(document.getElementById("app"));
}
