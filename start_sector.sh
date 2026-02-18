#!/bin/bash
echo "Initializing PlumberPass Sector..."

# Start Backend
cd backend && ./run.sh &
BACKEND_PID=$!

# Start Frontend
cd frontend && npm run dev &
FRONTEND_PID=$!

echo "Neural Brains (Backend) PID: $BACKEND_PID"
echo "Neural Interface (Frontend) PID: $FRONTEND_PID"

trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT TERM EXIT
wait
