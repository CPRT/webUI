#!/bin/bash

LOCAL_IP=""
while [ -z "$LOCAL_IP" ]; do
  LOCAL_IP=$(hostname -I | awk '{print $1}')
  sleep 1
done
TILING_SERVER_PORT=80
echo "Local IP address: $LOCAL_IP"

if docker ps -a --format '{{.Names}}' | grep -wq "tiling-server-container"; then
  echo "Tiling container exists, removing..."
  docker stop tiling-server-container
fi

docker run --rm --name tiling-server-container -d \
  -p $TILING_SERVER_PORT:$TILING_SERVER_PORT \
  cprtsoftware/tiling-server || { echo "Failed to start tiling server container"; }


docker run --rm --name cprt-webserver \
  -p 3000:3000 \
  -e NEXT_PUBLIC_TILE_SERVER="$LOCAL_IP:$TILING_SERVER_PORT" \
  -e NEXT_PUBLIC_LAUNCHSERVER="$LOCAL_IP:8080" \
  cprtsoftware/web-ui:latest

