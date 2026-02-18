#!/bin/bash
# PlumberPass Neural Brains - Boot Script
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
