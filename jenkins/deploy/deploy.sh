#!/bin/bash

echo "**********************"
echo "Deploying docker image"
echo "**********************"

# TODO remove when stop debugging
ls $KUBERNETES_CONFIG_PATH
cat $KUBERNETES_CONFIG_PATH/backend-deployment.yml

kubectl apply -f $KUBERNETES_CONFIG_PATH/backend-deployment.yml -f $KUBERNETES_CONFIG_PATH/backend-service.yml

# IMPORTANT!!!: DO NOT INCLUDE ANY COMMAND AFTER THIS LINE. IT COULD ALTER THE EXIT CODE OF THE SCRIPT AND,
# HENCE, LEAD TO A WRONG RESULT IN THE JENKINS JOB. MORE PRECISELY, THE PIPELINE COULD CONTINUE EVEN IF
# TESTS FAIL.
