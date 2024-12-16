import pyodbc
import socket
import sys
from datetime import datetime

# Function to write logs
def write_log(log_message):
    log_file = __file__.replace('.py', '.txt')
    current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with open(log_file, "a") as log:
        log.write(f"[{current_time}] {log_message}\n")

# Function to execute the REXEC command
def rexec_command(host, port, username, password, command):
    try:
        # Connect to the REXEC service
        s = socket.create_connection((host, port))

        # Send the port value (0), username, password, and command
        s.sendall(b'\0')  # Port value (0) as a null byte
        s.sendall(username.encode() + b'\0')  # Username
        s.sendall(password.encode() + b'\0')  # Password
        s.sendall(command.encode() + b'\0')   # Command

        # Receive output
        response = b""
        while True:
            data = s.recv(1024)
            if not data:
                break
            response += data

        s.close()

        # Try decoding the response, but ignore errors with non-UTF-8 characters
        return response.decode('utf-8', errors='ignore')

    except Exception as e:
        return f"Error: {str(e)}"

# Replace these with your IBM i details
host = "172.20.4.1"  # Update with your IBM i IP address
port = 512            # Default REXEC port
username = "tareqprod"
password = "start123"

# SQL query to fetch job details (including job number, job name, and command)
query = """
SELECT JOB_NUMBER, JOB_NAME, COMMAND
FROM YOUR_JOB_TABLE
WHERE JOB_NAME = ?
ORDER BY JOB_NUMBER
LIMIT 100 OFFSET 0
"""

# Accept job name from command-line argument
job_name = sys.argv[1] if len(sys.argv) > 1 else None

if not job_name:
    print("Error: Job name not provided.")
    sys.exit(1)

# Connect to the ODBC source and fetch job details based on the job name
try:
    write_log("Script started.")

    connection = pyodbc.connect("DSN=Detttra1;UID=tareqprod;PWD=start123")
    cursor = connection.cursor()
    cursor.execute(query, (job_name,))  # Use the job name in the query

    jobs = cursor.fetchall()  # Fetch job numbers, names, and commands
    cursor.close()
    connection.close()

    if not jobs:
        write_log("No jobs found.")
        print("No jobs found.")
    else:
        for job in jobs:
            job_number = job[0]
            command = job[2]

            write_log(f"Ending job: {job_name} with number: {job_number}")
            end_command = f"ENDJOB JOB({job_number}/*N/{job_name}) OPTION(*IMMED)"
            output = rexec_command(host, port, username, password, end_command)
            write_log(f"Response for job {job_name}: {output}")

            # Submit the new job dynamically
            final_command = f"SBMJOB CMD(CALL PGM({command})) JOB({job_name}STR) JOBD(CFS2SCP/FRJDCOMP) USER(CFS) INLLIBL(*JOBD)"
            write_log(f"Submitting final job for {job_name}...")
            output = rexec_command(host, port, username, password, final_command)
            write_log(f"Response for final job submission: {output}")
            print(output)

    write_log("Script completed successfully.")

except pyodbc.Error as e:
    error_message = f"Database error: {str(e)}"
    write_log(error_message)
    print(error_message)
except Exception as e:
    error_message = f"An error occurred: {str(e)}"
    write_log(error_message)
    print(error_message)
