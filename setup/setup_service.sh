#!/bin/bash
SCRIPT_DIR="$(dirname "$0")"
CURRENT_DIR="$(pwd)"
CURRENT_USER=$(whoami)

if [ "$SCRIPT_DIR" == "$CURRENT_DIR" ] || [ "$SCRIPT_DIR" == "." ]; then
    echo "The script is being run from its own directory."
else
    echo "The script is NOT being run from its own directory."
    exit 1
fi

sudo cp start_ui.service /etc/systemd/system/start_ui.service
sudo sed -i "s|User=%i|User=${CURRENT_USER}|" /etc/systemd/system/start_ui.service
sudo chmod 644 /etc/systemd/system/start_ui.service
cd ..
sudo ln -s $PWD/start.sh /usr/local/bin/start_ui.sh

sudo systemctl daemon-reload
sudo systemctl enable start_ui.service
sudo systemctl start start_ui.service
