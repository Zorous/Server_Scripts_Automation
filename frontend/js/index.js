let scripts = [];

// Initialize app
document.addEventListener("DOMContentLoaded", () => {
  const isLoggedIn = localStorage.getItem("isLoggedIn");

  // If not logged in, redirect to login page
  if (!isLoggedIn) {
    window.location.href = "login.html"; // Redirect to the login page if not logged in
    return;
  }

  const app = document.getElementById("app");
  // Load scripts only if they are not loaded already
  if (!sessionStorage.getItem('scriptsLoaded')) {
    loadScripts();
  } else {
    // Retrieve from sessionStorage if already loaded
    scripts = JSON.parse(sessionStorage.getItem('scripts'));
    console.log("Scripts retrieved from sessionStorage:", scripts);
    populateScriptDropdown(scripts);
  }

  renderApp(app); // Render the job selection interface
});

function renderApp(app) {
  app.innerHTML = `
    <div class="app-container">
      <h1>Select a Job to Run</h1>
      <select id="scriptDropdown">
        <option value="">Select a job</option>
        ${scripts.length > 0
          ? scripts.map((script) => `<option value="${script.id}">${script.name}</option>`).join("")
          : "<option value=''>No jobs available</option>"}
      </select>
      <button id="run-btn">Run Job</button>
      <h3>Output:</h3>
      <div id="output">Job output will appear here.</div>
      <button id="logout-btn">Logout</button>
    </div>
  `;

  // Event listeners
  document.getElementById("run-btn").addEventListener("click", runScript);
  document.getElementById("logout-btn").addEventListener("click", handleLogout);
}

function loadScripts() {
  console.log("Fetching scripts...");

  fetch("http://localhost:5000/scripts") // Replace with your server's URL
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to fetch scripts, server returned non-200 status.");
      }
      return response.json();
    })
    .then((data) => {
      scripts = data; // Load the list of scripts
      console.log("Scripts loaded:", scripts);

      // Save to sessionStorage
      sessionStorage.setItem('scripts', JSON.stringify(scripts));
      sessionStorage.setItem('scriptsLoaded', true);

      populateScriptDropdown(scripts); // Populate the dropdown menu with available scripts
    })
    .catch((error) => {
      console.error("Error fetching scripts:", error);
      document.getElementById("output").innerText = "Error: Could not load scripts."; // Inform user of the error
    });
}

function populateScriptDropdown(scripts) {
  const dropdown = document.getElementById("scriptDropdown");
  console.log("Dropdown element:", dropdown); // Check if dropdown exists

  if (!dropdown) {
    console.error("Dropdown element not found!");
    return;
  }

  // Only update the dropdown if there are scripts
  if (scripts.length === 0) {
    dropdown.innerHTML = `<option value="">No jobs available</option>`;
    return;
  }

  dropdown.innerHTML = ""; // Clear any previous entries
  scripts.forEach((script) => {
    const option = document.createElement("option");
    option.value = script.id;
    option.textContent = script.name;
    dropdown.appendChild(option);
  });
}


function runScript() {
  const selectedScriptId = document.getElementById("scriptDropdown").value;
  if (!selectedScriptId) {
    alert("Please select a script to run.");
    return;
  }

  const output = `Running script with ID: ${selectedScriptId}`;
  document.getElementById("output").innerText = output;

  const requestData = { script_id: selectedScriptId };

  fetch("http://localhost:5004/run_script", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestData),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.output) {
        document.getElementById("output").innerText = data.output;
      } else {
        document.getElementById("output").innerText = "Error: " + data.error;
      }
    })
    .catch((error) => {
      document.getElementById("output").innerText = "Error: " + error.message;
    });
}

function handleLogout() {
  localStorage.removeItem("isLoggedIn");
  window.location.href = "login.html"; // Redirect to login page on logout
}
