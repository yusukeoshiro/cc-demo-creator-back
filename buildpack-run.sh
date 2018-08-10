#!/bin/bash
mkdir ~/.ssh

echo "--- RUNNING CUSTOM BUILD SCRIPT!!"

echo "--- installing ssh private key"

[ -z $SSH_AUTH_SOCK ] && `eval ssh-agent` && ssh-keyscan github.com >> ~/.ssh/known_hosts && ssh-add - <<< "${GITHUB_PRIVATE_KEY}"

# eval `ssh-agent`
# sleep 10s
# ssh-keyscan github.com >> ~/.ssh/known_hosts & ssh-add - <<< "${GITHUB_PRIVATE_KEY}"

echo "--- cloning build suite private repo!!"
cd ~/
git clone git@github.com:yusukeoshiro/build-suite.git
