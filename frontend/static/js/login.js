const USER = {
  username: "admin",
  password: "admin123",
};

// Wait for the DOM to be fully loaded
document.addEventListener("DOMContentLoaded", function() {
  const loginButton = document.getElementById("login-btn");

  loginButton.addEventListener("click", function () {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const errorMessage = document.getElementById("error-message");

    // Basic validation for username and password
    if (username === USER.username && password === USER.password) {
      // Store login status in localStorage
      localStorage.setItem("isLoggedIn", "true");
      // Redirect to main app page
      window.location.href = "index.html";
    } else {
      // Show error message if credentials don't match
      errorMessage.textContent = "Invalid username or password.";
      errorMessage.style.display = "block"; // Make error message visible
    }
  });
});
