# Use a Node.js base image
FROM node:18-alpine

# Set working directory
WORKDIR /src

# Copy package.json and package-lock.json to the container
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the port the app runs on
EXPOSE 5173

# Start the Vite app using the "dev" script
CMD ["npm", "run", "dev", "--", "--host"]
