#!/bin/bash

# TODO Create global directory for jenkins_home and system env variable with the path
WORKSPACE=/home/juan/hdd/Cursos/Jenkins/jenkins-data/jenkins_home/workspace/trackoverload-backend-pipeline

#echo "Changing to workspace directory: $WORKSPACE"

echo "Installing dependencies"
docker run --rm -v /app/node_modules node npm install
