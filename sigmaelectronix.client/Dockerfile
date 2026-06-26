# Этап 1: Сборка Angular приложения
FROM node:20-alpine AS build
WORKDIR /app
COPY sigmaelectronix.client/package*.json ./
RUN npm install
COPY sigmaelectronix.client/ .
RUN npm run build -- --configuration=production

# Этап 2: Запуск Nginx и копирование статики
FROM nginx:alpine
# Путь внутри dist зависит от angular.json (обычно dist/название-проекта/browser)
COPY --from=build /app/dist/sigmaelectronix.client/browser /usr/share/nginx/html
# Копируем наш кастомный конфиг Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
