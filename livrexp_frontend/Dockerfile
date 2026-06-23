# Use Node 22 Alpine as the base image
FROM node:22-alpine

# Set working directory inside the container
WORKDIR /app

# Copy package configurations
COPY package.json package-lock.json ./

# Install dependencies inside the container
RUN npm install

# Copy all frontend files
COPY . .

# Expose Vite dev server port
EXPOSE 5173

# Start Vite dev server binding to all network interfaces
CMD ["npm", "run", "dev", "--", "--host"]
