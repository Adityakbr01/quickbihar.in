# Use the official Bun image
FROM oven/bun:1

WORKDIR /app

# Copy dependency definition files
COPY package.json bun.lock ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy the rest of the application files
COPY . .

# Expose the API port
EXPOSE 8000

# Start the server
CMD ["bun", "run", "src/server.ts"]
