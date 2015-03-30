FROM ubuntu:14.04

RUN apt-get update
RUN apt-get -y install curl

RUN curl https://raw.githubusercontent.com/creationix/nvm/v0.11.1/install.sh | bash && \
    . ~/.profile && \
    nvm install 0.10.36 && \
    nvm alias default v0.10.36

ENV PATH /root/.nvm/current/bin:$PATH

# Update npm
RUN npm install -g npm

RUN mkdir -p /app/service
COPY . /app/service

WORKDIR /app/service
ENTRYPOINT ["node", "server.js"]
