FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
RUN ls node_modules | grep tailwind  # ← add this line temporarily
COPY . .
RUN npm run build

# 2️⃣ Production stage
FROM nginx:alpine
# Copy built files to Nginx html folder
COPY --from=builder /app/build /usr/share/nginx/html

# Optional: custom Nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]