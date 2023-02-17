FROM node:14-alpine AS common
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .

# Local development
FROM common AS dev
CMD ["npm", "start"]

# Production build
FROM common AS prod
CMD ["npm", "run", "build"]
