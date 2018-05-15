#!/bin/sh

rootpath=`pwd`
compose_files=`find ./ -name "docker-compose.yml"|grep -v "./site"`
for com_file in $compose_files
do
    echo $com_file
    DIR=$(dirname $com_file)
    cd $rootpath/$DIR
    docker-compose build
    docker-compose push
done

echo "[+] Docker Compose build and push done!"
