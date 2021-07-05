#!/bin/bash

# set variables
echo "$1"
echo "$2"
echo "$3"
release_dir="$1/releases/$2"
latest_release_dir="$1/latest";

# change current working dir to current release candidate dir
cd "$1/releases/$2"

# remove redundant files and dirs
rm -rf .git
rm -rf src/pm2/logs

# create symlinks for .env file
# general .env
ln -s "$1/.env" .env

# create symlinks for logs dir
ln -s "$1/logs" src/pm2/logs

# create symlinks for pm2.config.js
ln -s "$1/pm2.config.js" src/pm2/pm2.config.js

# install dependencies
# python
cd "$release_dir/src/python/src"
python3.8 -m poetry install
python3.8 -m poetry run alembic upgrade head
# typescript
cd "$release_dir/src/typescript/src"
npm install
npm run fbuild

# linking latest release
rm -rf "$latest_release_dir"
ln -s "$release_dir" "$latest_release_dir"

# remove old pm2 processes
pm2 stop "/$3_/" && pm2 delete "/$3_/"

# run pm2 processes
cd src/pm2/
pm2 start pm2.config.js
pm2 save

# remove old node_modules and venv dirs(comment if redundant)
cd "$latest_release_dir/src/typescript/src"
rm -rf node_modules
cd "$latest_release_dir/src/python/src"
rm -rf .venv

# cleanup (remove old releases)
cd "$1/releases"
pwd
rm -rf `ls -t | tail -n +4`

