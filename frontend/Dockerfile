FROM node:18-alpine

WORKDIR /app

# Copy package.json first (better for caching)
COPY package.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]