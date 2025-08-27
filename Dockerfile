FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (all, including dev for build)
RUN npm install --legacy-peer-deps

# Copy rest of the source code
COPY src ./src
COPY public ./public
COPY next* ./
COPY tsconfig.json ./

RUN npm run build

# Expose default SSR port
EXPOSE 3000

# Start the SSR app
CMD ["npm", "run", "start"]
