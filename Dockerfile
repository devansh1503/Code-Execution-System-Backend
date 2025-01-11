FROM node
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
RUN node worker.js
CMD ["npm", "start"]