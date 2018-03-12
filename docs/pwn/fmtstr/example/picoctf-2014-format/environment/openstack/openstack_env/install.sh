#!/bin/bash

#配置更新
#apt-get -y update 
apt-get -y install  lib32z1 gdb #socat netcat  python xinetd python-pip git

#复制文件夹
mkdir /home/xctf
cp ./bin/* /home/xctf/

#生成xctf用户（用于ssh）
./home/xctf/user.sh

#权限设置
chown xctf:xctf /home/xctf/
chmod 555 /home/xctf/format
chmod a+s /home/xctf/format
chmod 444 /home/xctf/format.c

touch /home/xctf/flag
chmod 440 /home/xctf/flag

#复制安装peda
cp -r ./peda/ /usr/local
echo "source /usr/local/peda/peda.py" >> /home/xctf/.gdbinit
echo "DONE! debug your program with gdb and enjoy"

#安装xctftools
#apt-get -y install python2.7 python-pip python-dev git libssl-dev libffi-dev build-essential
#pip install --upgrade pip
#pip install --upgrade xctftools

#关闭ASLR
echo 0 > /proc/sys/kernel/randomize_va_space  

#开启nc
#socat  tcp-listen:9999,fork exec:/home/xctf/format &

echo $1 > /home/xctf/flag




