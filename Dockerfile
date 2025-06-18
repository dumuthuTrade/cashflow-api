FROM node:latest

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy app source
COPY . .

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8080

# Expose the port the app will run on
EXPOSE 8080

# Start the application
CMD ["node", "server.js"]
