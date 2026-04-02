FROM node:22-alpine AS build

WORKDIR /app

ARG VITE_APP_NAME=TravelBook
ARG VITE_API_BASE_URL=/mock-api
ARG VITE_API_URL=http://localhost:8000/api/v1
ARG VITE_DEFAULT_THEME=light

ENV VITE_APP_NAME=$VITE_APP_NAME
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_DEFAULT_THEME=$VITE_DEFAULT_THEME

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:1.27-alpine AS runtime

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
