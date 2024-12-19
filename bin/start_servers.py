import subprocess
import os
import sys

def start_process(command, cwd):
    """
    Starts a subprocess with error handling.
    """
    try:
        # Ensure the directory exists
        abs_path = os.path.abspath(cwd)
        if not os.path.exists(abs_path):
            raise FileNotFoundError(f"Directory not found: {abs_path}")

        # Start the process
        process = subprocess.Popen(command, cwd=abs_path)
        print(f"Started process: {' '.join(command)} in {abs_path}")
        return process
    except FileNotFoundError as e:
        print(f"Error: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"Unexpected error: {e}")
        sys.exit(1)


# Start the backend
backend = start_process(["python", "main.py"], cwd="backend")

# Start the frontend
frontend = start_process(["npm.cmd" if os.name == "nt" else "npm", "run", "dev"], cwd="frontend")

try:
    # Wait for both processes to finish
    backend.wait()
    frontend.wait()
except KeyboardInterrupt:
    # Handle manual interruption (Ctrl+C)
    print("\nTerminating servers...")
    backend.terminate()
    frontend.terminate()
    backend.wait()
    frontend.wait()
    print("Servers terminated.")
