#!/bin/bash

# TODO BORRAR
echo "TEST_VAR"
echo $TEST_VAR

# TODO Create global directory for jenkins_home and system env variable with the path
WORKSPACE=/home/juan/hdd/webapps/trackoverload/jenkins_home/workspace/trackoverload-backend-pipeline

echo "*******************"
echo "Testing application"
echo "*******************"

docker run --rm \
           -w /usr/src \
           -v $WORKSPACE:/usr/src \
           -v cicd-trackoverload-back-node-modules:/usr/src/node_modules \
           node \
           npm run docker-test

echo "****************"
echo "Testing finished"
echo "****************"
