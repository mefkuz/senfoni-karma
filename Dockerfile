FROM node:20-alpine

WORKDIR /app
ENV NODE_ENV=production

# Copy server files
COPY server/package*.json ./
RUN npm install

# Copy built frontend
COPY dist /app/dist

# Copy server source
COPY server/index.js server/crypto.js ./

EXPOSE 80

CMD ["node", "index.js"]
