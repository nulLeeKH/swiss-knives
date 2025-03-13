#!/bin/bash

# Focus only on port 3000 which is the primary Next.js port
PORT=3000

echo "=== Freeing up port ${PORT} ==="

# Step 1: Kill Linux processes using the port
echo "Checking for Linux processes using port ${PORT}..."
PORT_PROCESS=$(lsof -i :${PORT} -t)
if [ -n "$PORT_PROCESS" ]; then
  echo "Terminating Linux process (PID: $PORT_PROCESS) using port ${PORT}..."
  kill -9 $PORT_PROCESS
  echo "Process terminated."
else
  echo "No Linux process found using port ${PORT}."
fi

# Step 2: Kill all Next.js related processes in Linux
echo "Terminating any Next.js related processes..."
pkill -f "next-server" 2>/dev/null
pkill -f "next dev" 2>/dev/null
pkill -f "transform.js" 2>/dev/null
echo "Next.js processes terminated."

# Step 3: Wait briefly
echo "Waiting for 3 seconds..."
sleep 3

# Step 4: Check if port is still in use (in Linux)
nc -z localhost $PORT >/dev/null 2>&1
if [ $? -eq 0 ]; then
  echo "Port ${PORT} is still in use. Attempting more aggressive cleanup..."
  
  # Step 5: As a last resort, kill ALL node processes in Linux
  echo "Terminating all node processes in Linux..."
  pkill -f "node" 2>/dev/null
  echo "All node processes terminated."
  
  echo "Waiting for 3 more seconds..."
  sleep 3
else
  echo "Port ${PORT} is now free."
fi

echo "=== Starting the application ==="
cd /home/zero/workspace/swiss-knife && npm run dev 