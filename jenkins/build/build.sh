#!/bin/bash

echo "***********************"
echo "Installing dependencies"
echo "***********************"

docker run --rm \
           -w /usr/src \
           -v $WORKSPACE:/usr/src \
           -v cicd-trackoverload-back-node-modules:/usr/src/node_modules \
           node \
           npm install

# IMPORTANT!!!: DO NOT INCLUDE ANY COMMAND AFTER THIS LINE. IT COULD ALTER THE EXIT CODE OF THE SCRIPT AND,
# HENCE, LEAD TO A WRONG RESULT IN THE JENKINS JOB. MORE PRECISELY, THE PIPELINE COULD CONTINUE EVEN IF
# TESTS FAIL.