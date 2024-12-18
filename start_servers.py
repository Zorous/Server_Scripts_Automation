import subprocess
import os

# Start the backend
backend = subprocess.Popen(["python", "main.py"], cwd="backend")

# Start the frontend
frontend = subprocess.Popen(["npm", "run", "dev"], cwd="frontend")

# Wait for the processes to finish, run : python start_servers.py
backend.wait()
frontend.wait()



