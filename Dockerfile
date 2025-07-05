FROM node:latest

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci 

# Copy app source
COPY . .

ENV PORT=8080

# Expose the port the app will run on
EXPOSE 8080

# Start the application
CMD ["node", "server.js"]
