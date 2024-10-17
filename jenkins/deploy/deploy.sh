#!/bin/bash

echo "**********************"
echo "Deploying docker image"
echo "**********************"

# Since Environment variables are not expanded in the Kubernetes configuration files, we need to use envsubst
# Specifically, this is used to get the value of $BUILD_NUMBER
envsubst < $KUBERNETES_CONFIG_PATH/backend-deployment.yml > /tmp/backend-deployment.yml

# TODO NEXT connect kubernetes to the cluster
kubectl apply -f /tmp/backend-deployment.yml -f $KUBERNETES_CONFIG_PATH/backend-service.yml

# IMPORTANT!!!: DO NOT INCLUDE ANY COMMAND AFTER THIS LINE. IT COULD ALTER THE EXIT CODE OF THE SCRIPT AND,
# HENCE, LEAD TO A WRONG RESULT IN THE JENKINS JOB. MORE PRECISELY, THE PIPELINE COULD CONTINUE EVEN IF
# TESTS FAIL.
