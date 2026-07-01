FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build

FROM nginx:alpine
RUN apk update && apk upgrade --no-cache
COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx-main.conf /etc/nginx/nginx.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY proxy.inc /etc/nginx/conf.d/proxy.inc
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
