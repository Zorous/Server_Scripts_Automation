# Use a lightweight Python image
FROM python:3.11-slim

# Set the working directory in the container
WORKDIR /app

# Copy the backend files to the container
COPY . .

# Install Python dependencies (make sure you have requirements.txt in the backend folder)
RUN pip install --no-cache-dir -r requirements.txt

# Expose the backend port
EXPOSE 5004

# Command to run your backend app
CMD ["python", "main.py"]
