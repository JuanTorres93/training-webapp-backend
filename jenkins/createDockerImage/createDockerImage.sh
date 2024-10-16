#!/bin/bash

echo "*********************"
echo "Creating docker image"
echo "*********************"

cd /var/jenkins_home/workspace/trackoverload-backend-pipeline

echo -e ${TRACKOVERLOAD_BACKEND_DOCKERFILE_CONTENT} > Dockerfile

docker build \
            -t $FINAL_DOCKER_IMAGE_NAME:$BUILD_NUMBER \
            .

# IMPORTANT!!!: DO NOT INCLUDE ANY COMMAND AFTER THIS LINE. IT COULD ALTER THE EXIT CODE OF THE SCRIPT AND,
# HENCE, LEAD TO A WRONG RESULT IN THE JENKINS JOB. MORE PRECISELY, THE PIPELINE COULD CONTINUE EVEN IF
# TESTS FAIL.
