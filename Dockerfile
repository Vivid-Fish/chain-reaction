FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
COPY VERSION .
COPY platform/ platform/
COPY games/ games/
RUN mkdir -p data/sessions && cat VERSION
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget -qO /dev/null http://localhost:3000/ || exit 1
CMD ["node", "platform/server.js"]
