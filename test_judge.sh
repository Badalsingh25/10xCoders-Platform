#!/usr/bin/env bash
# Submit a simple Python program to Judge0 and print the JSON response
curl -s -X POST "http://localhost:2358/submissions?wait=true" \
  -H "Content-Type: application/json" \
  -d '{
    "language_id": 71,
    "source_code": "print(\"Hello Judge0\")"
  }'
