#!/bin/bash

# Exit on error
set -e

print_logo() {
    if [ -t 1 ] && [ "${TERM:-dumb}" != "dumb" ] && [ -z "${NO_COLOR:-}" ]; then
        color='\033[1;36m'
        reset='\033[0m'
        delay='0.08'
    else
        color=''
        reset=''
        delay='0'
    fi

    while IFS= read -r line; do
        printf "%b%s%b\n" "$color" "$line" "$reset"
        if [ "$delay" != '0' ]; then
            sleep "$delay"
        fi
    done <<'LOGO'
  ▄█▄                                                                                                  ▄▄█▒
 ▐███▄▄▄      ▄▄▄██▀▀▀█▌  ▄▄▄██▀▀▀█  ▄▄▄████▄   ▄▄▄██▀▀▄▄   ▄▄▄██▀▀▀█▌  ▄▄▄██▀▀▀█▌  ▄▄▄████▄    ▄▄▄██▀▀▀█▀   ▄▄▄██▀▀▀█▌  ▄▄▄████▄    ▄▄▄██▀▀▀█▌  ▄▄▄██▀▀▀█▌
░▐██▌  ▄▄▄  ░▐███▀ ▄▄██░ ▐███▀  ▐█▌ ▐███▀▀ ▐█▌ ▀▀███▄▄▄▄▄ ░▐███▀  ▀▀█░░▐███▀▄▄██▀░ ▐███▀▀ ▐█▌ ░▐███▀  ▐█▌  ░▐███▀▄▄██▀░ ▐███▀▀ ▐█▌ ░▐███▀  ▀▀█░░▐███▀▄▄██▀░
▐█▄▓█▒  ▐█▌░▐█▄▓▌   ▀▀  ▒█▄▓█  ░▐█ ▐█▄▓█  ░▐██░▄▄▄▄▄ ░▐██▌▐█▄▓█   ▄▄  ▐█▄▓█▀▀▀▄▄  ▐█▄▓█  ░▐██░▐█▄▓█  ░▐█   ▐█▄▓█▀▀▀▄▄  ▐█▄▓█  ░▐██░▐█▄▓█   ▄▄  ▐█▄▓█▀▀▀▄▄
 ▀▀███▄▄█▀▀  ▀▀▀█        ▀▀▀▀█▄▄██▒░████ ▄▄██▌ ░▀▀██▄▄██▀  ▀▀▀▀█▄▄██▌  ▀▀▀▀█▄▄██▌ ░████ ▄▄██▌  ▀▀▀▀█▄▄██▌   ▀▀▀▀█▄▄██▌ ░████ ▄▄██▌  ▀▀▀▀█▄▄██▌  ▀▀▀▀█▄▄██▌
    ▀▀▀▀                        ▀▀  ▀▀▀▀  ▀▀▀▀                   ▀▀▀         ▀▀▀   ▀▀▀▀  ▀▀▀▀         ▀▀▀         ▀▀▀   ▀▀▀▀  ▀▀▀▀        ▀▀▀         ▀▀▀
LOGO
    echo
}

print_logo

echo "Running make setup..."
make setup

echo "------------------------------------------------"
echo "GitHub OAuth Configuration"
echo "------------------------------------------------"
echo "Create a GitHub OAuth App at:"
echo "https://github.com/settings/applications/new"
echo
echo "Use these values:"
echo "  Application name: Transcendence (or any name you prefer)"
echo "  Homepage URL:      https://localhost"
echo "  Callback URL:      https://localhost/api/auth/github/callback"
echo
echo "After registering the app, copy the Client ID and generate a new"
echo "Client Secret, then enter both values below."
echo
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
