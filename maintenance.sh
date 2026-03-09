#!/bin/bash
# Toggle maintenance mode via Redis
# Usage: ./maintenance.sh on|off|status
#
# This connects to Redis and sets/clears the maintenance:enabled key.
# Adjust REDIS_CMD below to match your environment.

# Default: connect to the Redis container in your Docker stack
# For prod (stack):      docker exec stack-redis-1 redis-cli
# For staging (stg-stack): docker exec stg-stack-redis-1 redis-cli
# Or if Redis is exposed locally: redis-cli -h localhost -p 6379

REDIS_CMD="${REDIS_CMD:-docker exec stack-redis-1 redis-cli}"
MAINTENANCE_KEY="maintenance:enabled"

case "$1" in
  on)
    $REDIS_CMD SET "$MAINTENANCE_KEY" 1 > /dev/null
    echo "Maintenance mode ENABLED"
    ;;
  off)
    $REDIS_CMD DEL "$MAINTENANCE_KEY" > /dev/null
    echo "Maintenance mode DISABLED"
    ;;
  status)
    VALUE=$($REDIS_CMD GET "$MAINTENANCE_KEY" 2>/dev/null)
    if [ "$VALUE" = "1" ]; then
      echo "Maintenance mode is ON"
    else
      echo "Maintenance mode is OFF"
    fi
    ;;
  *)
    echo "Usage: $0 {on|off|status}"
    echo ""
    echo "Environment:"
    echo "  REDIS_CMD  Override the redis-cli command"
    echo "             Default: docker exec stack-redis-1 redis-cli"
    echo ""
    echo "Examples:"
    echo "  $0 on                                          # Enable maintenance"
    echo "  $0 off                                         # Disable maintenance"
    echo "  REDIS_CMD='docker exec stg-stack-redis-1 redis-cli' $0 on  # Staging"
    exit 1
    ;;
esac
