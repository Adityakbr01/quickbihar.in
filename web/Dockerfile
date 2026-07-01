# Use Node.js LTS image
FROM node:18-alpine

WORKDIR /app

# Copy dependency definition files
COPY package.json package-lock.json* bun.lock* ./

# Install dependencies
RUN npm install

# Copy the rest of the application files
COPY . .

# Build the Next.js application
RUN npm run build

# Expose Next.js port
EXPOSE 3000

# Start the Next.js production server
CMD ["npm", "run", "start"]
