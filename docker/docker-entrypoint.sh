#!/bin/sh
set -e

# Inject runtime env into /usr/share/nginx/html/env.js
ENV_FILE="/usr/share/nginx/html/env.js"
API_URL_ESC=$(printf %s "$API_URL" | sed 's/[&/]/\\&/g')
WS_URL_ESC=$(printf %s "$WS_URL" | sed 's/[&/]/\\&/g')

if [ -f "$ENV_FILE" ]; then
  sed -i "s|API_URL: .*|API_URL: '$API_URL_ESC',|" "$ENV_FILE" || true
  sed -i "s|WS_URL: .*|WS_URL: '$WS_URL_ESC',|" "$ENV_FILE" || true
fi

exit 0


