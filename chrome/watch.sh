#!/bin/bash

./build.sh

echo "" 
echo "watching for changes..." 
echo "" 

fswatch -0 -v -o ./dev | xargs -0 -n 1 -I {} ./build.sh