from flask import Flask, jsonify, request
from flask_cors import CORS
import os
import subprocess

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

SCRIPTS_FOLDER = './scripts/'  # Adjust to your folder path
USER_CREDENTIALS = {'username': 'admin', 'password': 'admin12'}  # Hardcoded admin credentials

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
    # List all Python files in the 'scripts' folder
    scripts = [f for f in os.listdir(SCRIPTS_FOLDER) if f.endswith('.py')]
    return jsonify(scripts)

@app.route('/run_script', methods=['POST'])
def run_script():
    script_name = request.json.get('script_name')
    if not script_name or not script_name.endswith('.py'):
        return jsonify({'error': 'Invalid script name'}), 400

    script_path = os.path.join(SCRIPTS_FOLDER, script_name)
    try:
        result = subprocess.run(['python', script_path], capture_output=True, text=True, check=True)
        return jsonify({'output': result.stdout})
    except subprocess.CalledProcessError as e:
        return jsonify({'error': e.stderr}), 500
    
if __name__ == '__main__':
    app.run(debug=True, port=5004)
