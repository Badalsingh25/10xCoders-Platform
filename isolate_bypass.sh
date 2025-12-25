#!/bin/bash
LOG_FILE="/api/isolate.log"
printf "[$(date)] isolate args: %s\n" "$*" >> "$LOG_FILE" 2>&1

while [[ "$#" -gt 0 ]]; do
    case $1 in
        --init)
            echo "/"
            exit 0
            ;;
        --cleanup)
            exit 0
            ;;
        --run)
            shift
            # Execute the remaining arguments
            echo "[$(date)] executing: $*" >> "$LOG_FILE" 2>&1
            exec "$@"
            ;;
        *)
            shift
            ;;
    esac
done
exit 0
