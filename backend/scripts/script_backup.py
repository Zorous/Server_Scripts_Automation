import pyodbc
import socket
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

# SQL query to fetch job numbers
query = """
SELECT JOB_NUMBER
FROM TABLE (
        QSYS2.ACTIVE_JOB_INFO(
            RESET_STATISTICS => 'NO',
            SUBSYSTEM_LIST_FILTER => '',
            JOB_NAME_FILTER => '*ALL',
            CURRENT_USER_LIST_FILTER => '',
            DETAILED_INFO => 'NONE'
        )
    )
WHERE UPPER(JOB_NAME_SHORT) LIKE '%CFS2REQUI%'
ORDER BY SUBSYSTEM,
         RUN_PRIORITY,
         JOB_NAME_SHORT,
         JOB_NUMBER
LIMIT 100 OFFSET 0
"""

# Connect to the ODBC source and fetch job numbers
try:
    write_log("Script started.")

    connection = pyodbc.connect("DSN=Detttra1;UID=tareqprod;PWD=start123")
    cursor = connection.cursor()
    cursor.execute(query)

    job_numbers = [row[0] for row in cursor.fetchall()]
    cursor.close()
    connection.close()

    write_log(f"Fetched job numbers: {job_numbers}")

    # End jobs one by one
    for job_number in job_numbers:
        command = f"ENDJOB JOB({job_number}/*N/CFS2REQUI) OPTION(*IMMED)"
        write_log(f"Ending job: {job_number}")
        output = rexec_command(host, port, username, password, command)
        write_log(f"Response for job {job_number}: {output}")

    # Submit the new job after ending all jobs
    final_command = "SBMJOB CMD(CALL PGM(CFS2OJP/FRCLIT215)) JOB(CFS2REQSTR) JOBD(CFS2SCP/FRJDCOMP) USER(CFS) INLLIBL(*JOBD)"
                    #"SBMJOB CMD(CALL PGM(CFS2OJP/FRCLIT215)) JOB(CFSREQUIE) JOBD(CFS2OJT/CFS2DLGT) USER(CFS) INLLIBL(*JOBD)"
    write_log("Submitting final job...")
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
   