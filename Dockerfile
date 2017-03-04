FROM node:7.6.0

RUN mkdir -p /opt/nevera
RUN mkdir -p /opt/nevera/data
WORKDIR /opt/nevera

COPY package.json /opt/nevera/
COPY bin/ /opt/nevera/bin/
COPY public/ /opt/nevera/public/
COPY app/ /opt/nevera/app/
RUN npm install

VOLUME /opt/nevera/data/
EXPOSE 3000

CMD ["npm", "start"]
