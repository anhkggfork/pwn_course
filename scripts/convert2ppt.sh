#!/bin/sh

mdfiles=`grep --include=\*.md -Ril "<.-- slide" docs`

echo "Running . .bashrc"
. /home/ubuntu/.bashrc

for file in $mdfiles
do
  node scripts/convert.js $file
  htmlpath=${file%md}html
  sed -i "s/file:\/\/\/\/home\/ubuntu\/node_modules\/@shd101wyy/\/_static/g" $htmlpath
  sed -i "s/home\/ubuntu\/node_modules\/@shd101wyy/_static/g" $htmlpath
done
