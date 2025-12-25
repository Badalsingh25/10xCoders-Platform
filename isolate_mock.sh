#!/bin/bash
# Ultra-Robust Mock isolate for WSL2 Debugging
LOG_FILE="/tmp/isolate.log"
exec 3>>"$LOG_FILE"
printf "[$(date)] --- START isolate call ---\n" >&3
printf "[$(date)] UID: %s, GID: %s, USER: %s\n" "$(id -u)" "$(id -g)" "$(whoami)" >&3
printf "[$(date)] ARGS: %q\n" "$@" >&3
printf "[$(date)] PWD: %s\n" "$(pwd)" >&3

# Extract BOX_ID
BOX_ID="0"
ARGS=("$@")
for ((i=0; i<${#ARGS[@]}; i++)); do
    if [[ "${ARGS[$i]}" == "-b" || "${ARGS[$i]}" == "--box" ]]; then
        BOX_ID="${ARGS[$((i+1))]}"
    fi
done

SANDBOX_PATH="/box/$BOX_ID"
mkdir -p "$SANDBOX_PATH/box" >> "$LOG_FILE" 2>&1
chmod -R 777 "$SANDBOX_PATH" >> "$LOG_FILE" 2>&1

# Find the command to run
FOUND_RUN=false
RUN_CMD=()
for ((i=0; i<${#ARGS[@]}; i++)); do
    if [[ $FOUND_RUN == true ]]; then
        RUN_CMD+=("${ARGS[$i]}")
    elif [[ "${ARGS[$i]}" == "--run" ]]; then
        FOUND_RUN=true
    fi
done

# Action based on first arg or --init/--cleanup flags
if [[ "$*" == *"--version"* ]]; then
    printf "[$(date)] Action: version\n" >&3
    echo "The process isolator 1.8.1"
    exit 0
elif [[ "$*" == *"--init"* ]]; then
    printf "[$(date)] Action: init -> %s\n" "$BOX_ID" >&3
    echo "$SANDBOX_PATH"
    exit 0
elif [[ "$*" == *"--cleanup"* ]]; then
    printf "[$(date)] Action: cleanup -> %s\n" "$SANDBOX_PATH" >&3
    rm -rf "$SANDBOX_PATH"
    exit 0
elif [[ $FOUND_RUN == true ]]; then
    printf "[$(date)] Action: run in %s\n" "$SANDBOX_PATH/box" >&3
    printf "[$(date)] Run command: %q\n" "${RUN_CMD[@]}" >&3
    
    cd "$SANDBOX_PATH/box" || { printf "[$(date)] CD FAILED\n" >&3; exit 1; }
    
    # Export path explicitly just in case
    export PATH="/usr/local/ruby-2.7.0/bin:/opt/.gem/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
    
    # Try to execute the command directly
    exec "${RUN_CMD[@]}" 2>&3
    EXIT_CODE=$?
    printf "[$(date)] Exec failed with code: %s\n" "$EXIT_CODE" >&3
    exit $EXIT_CODE
else
    printf "[$(date)] Action: unknown/ignored\n" >&3
    exit 0
fi
