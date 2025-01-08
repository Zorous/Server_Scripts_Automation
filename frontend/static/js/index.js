document.addEventListener("DOMContentLoaded", () => {
  const isLoggedIn = localStorage.getItem("isLoggedIn");

  // Redirect to login page if not logged in
  if (!isLoggedIn) {
    if (window.location.pathname !== "/login.html") {
      window.location.href = "login.html";
    }
    return;
  }

  // If logged in and on the login page, redirect to the main page
  if (isLoggedIn && window.location.pathname === "/login.html") {
    window.location.href = "index.html"; // Main page
    return;
  }

  // Initialize the app container
  const app = document.getElementById("app");
  renderApp(app);

  // Check localStorage for scripts and handle appropriately
  const storedScripts = localStorage.getItem("scripts");

  if (storedScripts) {
    try {
      scripts = JSON.parse(storedScripts);
      if (Array.isArray(scripts) && scripts.length > 0) {
        console.log("Scripts loaded from localStorage:", scripts);
        populateScriptDropdown(scripts);
      } else {
        console.warn("Scripts in localStorage are empty or invalid. Refetching...");
        fetchAndStoreScripts();
      }
    } catch (error) {
      console.error("Error parsing scripts from localStorage:", error);
      fetchAndStoreScripts();
    }
  } else {
    console.log("No scripts found in localStorage. Fetching from server...");
    fetchAndStoreScripts();
  }
});

function renderApp(app) {
  app.innerHTML = `
    <div class="app-container">
      <h1>Select a Job to Run</h1>
      <select id="scriptDropdown">
        <option value="">Loading jobs...</option> <!-- Placeholder while fetching -->
      </select>
      <button id="run-btn">Run Job</button>
      <h3>Output:</h3>
      <div id="output">Job output will appear here.</div>
      <button id="logout-btn">Logout</button>
    </div>
  `;

  // Add event listeners after rendering the DOM
  document.getElementById("run-btn").addEventListener("click", runScript);
  document.getElementById("logout-btn").addEventListener("click", handleLogout);
}

function fetchAndStoreScripts() {
  console.log("Fetching scripts from server...");

  fetch("http://localhost:5000/scripts") // Replace with your server's URL
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to fetch scripts, server returned non-200 status.");
      }
      return response.json();
    })
    .then((data) => {
      if (data.jobs && Array.isArray(data.jobs)) {
        scripts = data.jobs; // Assuming the jobs are returned under the 'jobs' key
        console.log("Scripts fetched and stored:", scripts);

        // Store scripts in localStorage
        localStorage.setItem("scripts", JSON.stringify(scripts));

        populateScriptDropdown(scripts); // Populate the dropdown menu
      } else {
        throw new Error("Unexpected data structure from server.");
      }
    })
    .catch((error) => {
      console.error("Error fetching scripts:", error);
      const dropdown = document.getElementById("scriptDropdown");
      if (dropdown) {
        dropdown.innerHTML = `<option value="">Failed to load jobs</option>`;
      }
    });
}

function populateScriptDropdown(scripts) {
  const dropdown = document.getElementById("scriptDropdown");

  if (!dropdown) {
    console.error("Dropdown element not found!");
    return;
  }

  // Clear existing options
  dropdown.innerHTML = `<option value="">Select a job</option>`;

  if (scripts.length === 0) {
    dropdown.innerHTML = `<option value="">No jobs available</option>`;
    return;
  }

  scripts.forEach((script) => {
    const option = document.createElement("option");
    option.value = script.id; // Ensure `id` exists in your server response
    option.textContent = script.name; // Ensure `name` exists in your server response
    dropdown.appendChild(option);
  });
}

function runScript() {
  const selectedScriptId = document.getElementById("scriptDropdown").value;
  if (!selectedScriptId) {
    alert("Please select a job to run.");
    return;
  }

  const outputElement = document.getElementById("output");
  outputElement.innerText = `Running script with ID: ${selectedScriptId}...`;

  const requestData = { script_id: selectedScriptId };

  fetch("http://localhost:5000/run_script", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestData),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to execute script, server returned non-200 status.");
      }
      return response.json();
    })
    .then((data) => {
      if (data.output) {
        outputElement.innerText = data.output;
      } else {
        outputElement.innerText = "Error: " + (data.error || "Unknown error occurred.");
      }
    })
    .catch((error) => {
      outputElement.innerText = "Error: " + error.message;
    });
}

function handleLogout() {
  localStorage.removeItem("isLoggedIn");
  localStorage.removeItem("scripts"); // Clear stored scripts on logout
  window.location.href = "login.html"; // Redirect to login page
}
