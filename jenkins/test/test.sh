#!/bin/bash

echo "*******************"
echo "Testing application"
echo "*******************"

docker run --rm \
           --env-file $TEST_BACK_ENV_FILE \
           --env DB_HOST=$TEST_DB_CONTAINER_NAME \
           -w /usr/src \
           -v $WORKSPACE:/usr/src \
           -v cicd-trackoverload-back-node-modules:/usr/src/node_modules \
           --network $JENKINS_DOCKER_TEST_NET \
           node \
           npm run jenkins-test

# IMPORTANT!!!: DO NOT INCLUDE ANY COMMAND AFTER THIS LINE. IT COULD ALTER THE EXIT CODE OF THE SCRIPT AND,
# HENCE, LEAD TO A WRONG RESULT IN THE JENKINS JOB. MORE PRECISELY, THE PIPELINE COULD CONTINUE EVEN IF
# TESTS FAIL.
