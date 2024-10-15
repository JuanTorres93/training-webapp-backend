#!/bin/bash


# TODO Create global directory for jenkins_home and system env variable with the path
WORKSPACE=/home/juan/hdd/webapps/trackoverload/jenkins_home/workspace/trackoverload-backend-pipeline

echo "*******************"
echo "Testing application"
echo "*******************"


docker run --rm \
           --env-file $TEST_ENV_FILE \
           -w /usr/src \
           -v $WORKSPACE:/usr/src \
           -v cicd-trackoverload-back-node-modules:/usr/src/node_modules \
           node \
           npm run jenkins-test

echo "****************"
echo "Testing finished"
echo "****************"
