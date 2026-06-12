#!/bin/bash

# Exit on error
set -e

echo "Running make setup..."
make setup

echo "------------------------------------------------"
echo "GitHub OAuth Configuration"
echo "------------------------------------------------"
printf "Enter GitHub Client ID: "
read -r github_id
printf "Enter GitHub Client Secret: "
read -r github_secret

# Update backend/dev/.env.docker
# We use a temporary file to ensure compatibility across different sed versions
sed -e "s|^GITHUB_CLIENT_ID=.*$|GITHUB_CLIENT_ID=$github_id|" \
    -e "s|^GITHUB_CLIENT_SECRET=.*$|GITHUB_CLIENT_SECRET=$github_secret|" \
    backend/dev/.env.docker > backend/dev/.env.docker.tmp && mv backend/dev/.env.docker.tmp backend/dev/.env.docker

echo "Updated backend/dev/.env.docker with GitHub credentials."

echo "Running make certs..."
make certs

echo "Running make up..."
make up
