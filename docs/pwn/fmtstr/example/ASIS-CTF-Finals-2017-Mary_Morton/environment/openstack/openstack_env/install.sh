#!/bin/bash

useradd -m xctf

cp ./bin/* /home/xctf/
cp ./ctf /etc/xinetd.d/xctf


chown -R root:xctf /home/xctf
chmod -R 750 /home/xctf
chmod 740 /home/xctf/flag

echo $1 > /home/xctf/flag
service xinetd restart
