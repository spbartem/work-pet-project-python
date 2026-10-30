# --- build ---
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# Vite вшивает VITE_* в статику на этапе сборки
ARG VITE_PYTHON_API_URL
ENV VITE_PYTHON_API_URL=$VITE_PYTHON_API_URL

RUN npm run build

# --- serve ---
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80