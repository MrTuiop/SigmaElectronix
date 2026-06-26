# Этап 1: Сборка Angular приложения
FROM node:20-alpine AS build
WORKDIR /app

# Копируем package.json и устанавливаем зависимости
COPY package*.json ./
RUN npm install

# Копируем исходники и собираем
COPY . .
RUN npm run build -- --configuration=production

# Этап 2: Запуск Nginx и копирование статики
FROM nginx:alpine

# Путь сборки зависит от angular.json: обычно dist/название-проекта/browser
COPY --from=build /app/dist/sigmaelectronix.client/browser /usr/share/nginx/html

# Копируем кастомный конфиг Nginx (файл должен лежать в этой же папке)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
