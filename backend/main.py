from flask import Flask, jsonify, request
from flask_cors import CORS
import mysql.connector
import subprocess
import pyodbc
import socket
from datetime import datetime

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Hardcoded admin credentials
USER_CREDENTIALS = {'username': 'admin', 'password': 'admin12'}

# MySQL Database configuration
MYSQL_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': '',
    'database': 'SSA',
    'port': 3307
}

# IBM i REXEC Configuration
IBM_CONFIG = {
    'host': '172.20.4.1',
    'port': 512,
    'username': 'tareqprod',
    'password': 'start123',
}

# Logging function to write logs with timestamps
def write_log(log_message):
    """
    Write a log message to the server log file with a timestamp.
    
    Args:
        log_message (str): The message to log.
    """
    log_file = "server_logs.txt"
    current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with open(log_file, "a") as log:
        log.write(f"[{current_time}] {log_message}\n")

# MySQL Database connection function
def get_db_connection():
    """
    Establishes a connection to the MySQL database using the configured credentials.

    Returns:
        connection: MySQL database connection object.
    """
    return mysql.connector.connect(
        host=MYSQL_CONFIG['host'],
        user=MYSQL_CONFIG['user'],
        password=MYSQL_CONFIG['password'],
        database=MYSQL_CONFIG['database'],
        port=MYSQL_CONFIG['port']
    )

# REXEC command execution function for IBM i
def rexec_command(host, port, username, password, command):
    """
    Executes a REXEC command on an IBM i system and returns the output.

    Args:
        host (str): IBM i host address.
        port (int): Port number for REXEC.
        username (str): REXEC username.
        password (str): REXEC password.
        command (str): Command to be executed.

    Returns:
        str: Command output or error message.
    """
    try:
        s = socket.create_connection((host, port))
        s.sendall(b'\0')  # Port value (0) as a null byte
        s.sendall(username.encode() + b'\0')  # Username
        s.sendall(password.encode() + b'\0')  # Password
        s.sendall(command.encode() + b'\0')   # Command

        response = b""
        while True:
            data = s.recv(1024)
            if not data:
                break
            response += data

        s.close()
        return response.decode('utf-8', errors='ignore')
    except Exception as e:
        return f"Error: {str(e)}"

# Route for user login
@app.route('/login', methods=['POST'])
def login():
    """
    Handle login request. Returns a success message if credentials are correct, 
    otherwise returns an error.

    Returns:
        JSON response: success or error message.
    """
    data = request.json
    username = data.get('username')
    password = data.get('password')

    if username == USER_CREDENTIALS['username'] and password == USER_CREDENTIALS['password']:
        return jsonify({'message': 'Login successful'}), 200
    else:
        return jsonify({'error': 'Invalid credentials'}), 401

# Route to list all available scripts/jobs from the database
@app.route('/scripts', methods=['GET'])
def list_scripts():
    """
    Fetches a list of jobs/scripts from the database and returns it.

    Returns:
        JSON response: List of job names and descriptions.
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT Id, JobName, Description FROM Jobs")
        jobs = cursor.fetchall()
        cursor.close()
        conn.close()

        job_list = [{"id": job['Id'], "name": f"{job['JobName']} ({job['Description']})"} for job in jobs]
        return jsonify(job_list)
    except mysql.connector.Error as err:
        return jsonify({'error': f"Error fetching data: {err}"}), 500

# Route to run a script based on its ID
@app.route('/run_script', methods=['POST'])
def run_script():
    """
    Runs a script from the Jobs table based on the provided script ID.

    Returns:
        JSON response: Output of the script execution.
    """
    script_id = request.json.get('script_id')
    if not script_id:
        return jsonify({'error': 'Invalid script ID'}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT CallCmd FROM Jobs WHERE Id = %s", (script_id,))
        job = cursor.fetchone()
        if job:
         print("____SELECTED JOB :____" + job['CallCmd'])
        else:
         print("No job found with the given ID")        
        cursor.close()
        conn.close()

        if not job:
            return jsonify({'error': 'Job not found'}), 404

        # Run the command using subprocess
        result = subprocess.run(job['CallCmd'].split(), capture_output=True, text=True, check=True)
        return jsonify({'output': result.stdout})

    except mysql.connector.Error as err:
        return jsonify({'error': f"Database error: {err}"}), 500
    except subprocess.CalledProcessError as e:
        return jsonify({'error': e.stderr}), 500

# Route to end specific jobs on IBM i system
@app.route('/end_jobs', methods=['POST'])
def end_jobs():
    """
    Fetches active jobs from the IBM i system and ends jobs that match a pattern.

    Returns:
        JSON response: Confirmation of job terminations.
    """
    try:
        connection = pyodbc.connect("DSN=Detttra1;UID=tareqprod;PWD=start123")
        cursor = connection.cursor()
        query = """
        SELECT JOB_NUMBER
        FROM TABLE (
                QSYS2.ACTIVE_JOB_INFO(
                    RESET_STATISTICS => 'NO',
                    JOB_NAME_FILTER => '*ALL'
                )
            )
        WHERE UPPER(JOB_NAME_SHORT) LIKE '%CFS2REQUI%'
        ORDER BY JOB_NUMBER
        """
        cursor.execute(query)
        job_numbers = [row[0] for row in cursor.fetchall()]
        cursor.close()
        connection.close()

        write_log(f"Fetched job numbers: {job_numbers}")
        for job_number in job_numbers:
            command = f"ENDJOB JOB({job_number}/*N/CFS2REQUI) OPTION(*IMMED)"
            output = rexec_command(IBM_CONFIG['host'], IBM_CONFIG['port'], IBM_CONFIG['username'], IBM_CONFIG['password'], command)
            write_log(f"Response for job {job_number}: {output}")

        return jsonify({'message': 'All jobs ended successfully'})

    except pyodbc.Error as e:
        error_message = f"Database error: {str(e)}"
        write_log(error_message)
        return jsonify({'error': error_message}), 500
    except Exception as e:
        error_message = f"An error occurred: {str(e)}"
        write_log(error_message)
        return jsonify({'error': error_message}), 500

# Route to submit a job to IBM i system
@app.route('/submit_job', methods=['POST'])
def submit_job():
    """
    Submits a job to the IBM i system using a predefined command.

    Returns:
        JSON response: Confirmation of job submission.
    """
    try:
        command = "SBMJOB CMD(CALL PGM(CFS2OJP/FRCLIT215)) JOB(CFS2REQSTR)"
        output = rexec_command(IBM_CONFIG['host'], IBM_CONFIG['port'], IBM_CONFIG['username'], IBM_CONFIG['password'], command)
        write_log(f"Submitted job response: {output}")
        return jsonify({'message': 'Job submitted successfully', 'output': output})

    except Exception as e:
        error_message = f"Error: {str(e)}"
        write_log(error_message)
        return jsonify({'error': error_message}), 500

# Route to add a new command to the Jobs table
@app.route('/add_command', methods=['POST'])
def add_command():
    """
    Adds a new command to the Jobs table in the database.

    Returns:
        JSON response: Confirmation of command addition.
    """
    data = request.get_json()
    name = data.get('name')
    command = data.get('command')
    description = data.get('description')

    if not name or not command:
        return jsonify({"error": "Name and command are required"}), 400
    
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("INSERT INTO Jobs (JobName, CallCmd, Description) VALUES (%s, %s,%s)", (name, command, description))
        conn.commit()
        return jsonify({"message": "Command added successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

# Start the Flask application
if __name__ == '__main__':
    app.run(debug=True, port=5004)
