# frontend/Dockerfile
FROM node:20-bullseye

WORKDIR /app
COPY package*.json ./

# Limpiar cualquier resto y forzar instalación desde cero
RUN rm -rf node_modules package-lock.json || true
RUN npm install --build-from-source

COPY . .
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
