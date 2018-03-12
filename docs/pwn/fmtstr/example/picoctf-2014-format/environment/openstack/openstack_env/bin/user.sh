#!/bin/bash
PATH=/bin:/sbin:/usr/bin:/usr/sbin:/usr/ucb:/usr/local/bin

GROUP_NAME=devs
USER_CREATED=xctf
USER_PASSWD=xctf
 
echo "Create User: $USER_CREATED"
groupadd $GROUP_NAME

if [ $(id -u) -eq 0 ]; then
    for USER_VAR in $USER_CREATED
    do
        id $USER_VAR > /dev/null 2>&1
        if [ $? -eq 0 ]; then
            echo "$USER_VAR exists!"
        else
            useradd -m -d /home/$USER_VAR -s /bin/bash -G $GROUP_NAME $USER_VAR
            echo $USER_VAR:$USER_PASSWD|chpasswd
            if [ $? -eq 0 ]; then
                echo "User '$USER_CREATED' has been added to system!"
            else
                echo "Failed to add a user '$USER_CREATED' !"
            fi
        fi
    done
else
    echo "Only root can add a user to the system"   
    exit 1
fi
exit 0