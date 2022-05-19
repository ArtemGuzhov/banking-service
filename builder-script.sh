#!/bin/bash

echo "Start builder script!"
echo "---------------------"

echo "1. Transaction microservice build"

cd ./service/transaction

echo "1) npm i"
npm i
echo "2)npm run build"
npm run build

echo "2. Wallet_User microservice build"
cd ../wallet_user

echo "1) npm i"
npm i
echo "2)npm run build"
npm run build

echo "3. docker-compose up"

cd ../../

sudo docker-compose up --build -d

echo "4. pm2 start pm2.config.js"
sudo npm i pm2 -g

pm2 start pm2.config.js

echo "End builder script..."