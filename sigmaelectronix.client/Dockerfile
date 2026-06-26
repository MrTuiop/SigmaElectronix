# Этап 1: Сборка Angular приложения
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build -- --configuration=production

# Этап 2: Запуск Nginx и копирование статики в подпапку
FROM nginx:alpine
# Создаём нужную структуру папок
RUN mkdir -p /usr/share/nginx/html/projects/sigmaelectronix
# Копируем содержимое собранного приложения в подпапку
COPY --from=build /app/dist/sigmaelectronix.client/browser/. /usr/share/nginx/html/projects/sigmaelectronix/
# Копируем кастомный конфиг Nginx (если есть)
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
