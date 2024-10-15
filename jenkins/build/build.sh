#!/bin/bash

# TODO Create global directory for jenkins_home and system env variable with the path
WORKSPACE=/home/juan/hdd/webapps/trackoverload/jenkins_home/workspace/trackoverload-backend-pipeline

echo "***********************"
echo "Installing dependencies"
echo "***********************"

docker run -it --rm \
           -w /usr/src \
           -v $WORKSPACE:/usr/src \
           -v cicd-trackoverload-back-node-modules:/usr/src/node_modules \
           node \
           npm install

echo "***********************************"
echo "Dependencies successfully installed"
echo "***********************************"