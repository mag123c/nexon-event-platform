FROM node:18-alpine AS builder
WORKDIR /usr/src/app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts
COPY . .
RUN npm run build:auth

FROM node:18-alpine AS production
WORKDIR /usr/src/app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --only=production --ignore-scripts
COPY --from=builder /usr/src/app/dist ./dist
CMD ["npm", "run", "start:prod:auth"]