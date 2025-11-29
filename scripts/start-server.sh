#!/bin/bash
cd "$(dirname "$0")"
while true; do
  npm run dev
  echo "Servidor se cerró, reiniciando..."
  sleep 2
done
