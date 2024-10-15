#!/bin/bash


# TODO Create global directory for jenkins_home and system env variable with the path
WORKSPACE=/home/juan/hdd/webapps/trackoverload/jenkins_home/workspace/trackoverload-backend-pipeline

echo "***********************"
echo "Launching test database"
echo "***********************"

docker run --rm \
           --name $TEST_DB_CONTAINER_NAME \
           --env-file $TEST_DB_ENV_FILE \
           --network $JENKINS_DOCKER_TEST_NET \
           trackoverload-db-test

echo "**********************"
echo "Test database launched"
echo "**********************"
