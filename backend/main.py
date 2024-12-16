from flask import Flask, jsonify, request
from flask_cors import CORS
import mysql.connector
import subprocess

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

USER_CREDENTIALS = {'username': 'admin', 'password': 'admin12'}  # Hardcoded admin credentials

# MySQL Database configuration
MYSQL_CONFIG = {
    'host': 'localhost',
    'user': 'root',  # Change to your MySQL username
    'password': '',  # Change to your MySQL password
    'database': 'SSA',
    'port': 3306  # Default port for MySQL
}

# Function to connect to the MySQL database
def get_db_connection():
    return mysql.connector.connect(
        host=MYSQL_CONFIG['host'],
        user=MYSQL_CONFIG['user'],
        password=MYSQL_CONFIG['password'],
        database=MYSQL_CONFIG['database'],
        port=MYSQL_CONFIG['port']
    )

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')

    if username == USER_CREDENTIALS['username'] and password == USER_CREDENTIALS['password']:
        return jsonify({'message': 'Login successful'}), 200
    else:
        return jsonify({'error': 'Invalid credentials'}), 401

@app.route('/scripts', methods=['GET'])
def list_scripts():
    # Fetch jobs from MySQL database
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT Id, JobName, Description FROM Jobs")  
        jobs = cursor.fetchall()
        cursor.close()
        conn.close()

        # Format the data to return JobName (Description)
        job_list = [{"id": job['Id'], "name": f"{job['JobName']} ({job['Description']})"} for job in jobs]
        return jsonify(job_list)
    except mysql.connector.Error as err:
        return jsonify({'error': f"Error fetching data: {err}"}), 500

@app.route('/run_script', methods=['POST'])
def run_script():
    script_id = request.json.get('script_id')
    if not script_id:
        return jsonify({'error': 'Invalid script ID'}), 400

    try:
        # Fetch the job command (CallCmd) from the database
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT CallCmd FROM Jobs WHERE Id = %s", (script_id,))
        job = cursor.fetchone()
        cursor.close()
        conn.close()

        if not job:
            return jsonify({'error': 'Job not found'}), 404

        # Run the script based on the command
        result = subprocess.run(job['CallCmd'].split(), capture_output=True, text=True, check=True)
        return jsonify({'output': result.stdout})

    except mysql.connector.Error as err:
        return jsonify({'error': f"Database error: {err}"}), 500
    except subprocess.CalledProcessError as e:
        return jsonify({'error': e.stderr}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5004)
