#!/bin/bash

npm install
#might be out of date...
sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv EA312927
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu xenial/mongodb-org/3.6 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-3.6.list
sudo apt-get update
sudo apt-get install mongodb-org --force-yes -y
sudo cp mongod.service /lib/systemd/system/
sudo mkdir -p /data/db
sudo systemctl daemon-reload
sudo systemctl start mongod
sudo systemctl enable mongod
netstat -plntu | grep mongod