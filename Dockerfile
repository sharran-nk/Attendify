
# ==========================================
# STAGE 1: BUILD APPLICATION
# ==========================================

FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# EmailJS configuration

# Make build arguments available to Vite
ENV VITE_FIREBASE_API_KEY=$VITE_FIREBASE_API_KEY
ENV VITE_FIREBASE_AUTH_DOMAIN=$VITE_FIREBASE_AUTH_DOMAIN
ENV VITE_FIREBASE_PROJECT_ID=$VITE_FIREBASE_PROJECT_ID
ENV VITE_FIREBASE_STORAGE_BUCKET=$VITE_FIREBASE_STORAGE_BUCKET
ENV VITE_FIREBASE_MESSAGING_SENDER_ID=$VITE_FIREBASE_MESSAGING_SENDER_ID
ENV VITE_FIREBASE_APP_ID=$VITE_FIREBASE_APP_ID


# Build production application
RUN npm run build


# ==========================================
# STAGE 2: PRODUCTION SERVER
# ==========================================

FROM nginx:alpine AS production

# Copy Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy production files
COPY --from=builder /app/dist /usr/share/nginx/html

# Container port
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
