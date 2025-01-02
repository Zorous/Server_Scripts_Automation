document.getElementById("addCommandForm").addEventListener("submit", function(event) {
    event.preventDefault(); // Prevent the default form submission

    // Get form data
    const name = document.getElementById("name").value;
    const command = document.getElementById("command").value;
    const description = document.getElementById("description").value;

    // Prepare data to send to the server
    const requestData = {
        name: name,
        command: command,
        description: description
    };

    // Send POST request to /add_command
    fetch("http://localhost:5000/add_command", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(requestData)
    })
    .then((response) => response.json())
    .then((data) => {
        const responseMessage = document.getElementById("responseMessage");
        if (data.message) {
            responseMessage.textContent = data.message; // Success message
            responseMessage.style.color = "green";
            localStorage.removeItem("scripts"); // Clear stored scripts to load the new one

            window.location.replace("/frontend/index.html");

        } else if (data.error) {
            responseMessage.textContent = `Error: ${data.error}`; // Error message
            responseMessage.style.color = "red";
        }
    })
    .catch((error) => {
        document.getElementById("responseMessage").textContent = `Error: ${error.message}`;
        document.getElementById("responseMessage").style.color = "red";
    });
});
