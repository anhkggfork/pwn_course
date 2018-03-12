#!/bin/bash

sed -i "s/CTF{xxxx}/$1/" /home/flag

/etc/init.d/xinetd start
