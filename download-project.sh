#!/bin/bash

# Create dist directory if it doesn't exist
mkdir -p dist

# Create zip file
zip -r dist/journalize-project.zip . \
    -x "node_modules/*" \
    -x ".git/*" \
    -x "dist/*" \
    -x ".breakpoints" \
    -x ".replit" \
    -x ".DS_Store" \
    -x "*.log"
