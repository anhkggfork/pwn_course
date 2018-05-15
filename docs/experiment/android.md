# Android栈溢出攻击

## 实验概述

### 【目的】
搭建Android系统c程序环境
### 【环境】
Linux
### 【工具】
NDK，AOSP Prebuilt
### 【原理】

## 实验步骤

### 【步骤】
下载NDK，网址：[NDK](https://developer.android.com/ndk/downloads/index.html)
解压，记下文件路径，配置PATH：
```
sudo vim /etc/profile
```
在文件的末尾添加
```
export NDK_HOME=(NDK文件的路径)
export PATH=$NDK_HOME:$PATH
```
使其生效
```
source /etc/profile
```
查看是否成功
```
$ ndk-build -v
GNU Make 3.81
Copyright (C) 2006  Free Software Foundation, Inc.
This is free software; see the source for copying conditions.
There is NO warranty; not even for MERCHANTABILITY or FITNESS FOR A
PARTICULAR PURPOSE.

This program built for x86_64-pc-linux-gnu
```
新建一个文件夹jni，编写要编译的c语言代码
```c
#include<stdio.h>
#include <stdlib.h>
#include <string.h>
#include <malloc.h>
#include<unistd.h>
int main(int argc,char *argv[])
{
    int *p1 , *p2 , *p3 , *p4 , *p5;
    write(STDOUT_FILENO, "Hello, World\n", 13);
    char buf[128];
    read(STDIN_FILENO, buf, 256);
    p1 = (int *)malloc(sizeof(int) * 3);
    p2 = (int *)malloc(sizeof(int) * 5);
    p3 = (int *)malloc(sizeof(int) * 6);
    p4 = (int *)malloc(sizeof(int) * 8);
    p5 = (int *)malloc(sizeof(int) * 24);

    free(p1);
    free(p2);
    free(p3);
    free(p4);
    free(p5);

}
```
和Android.mk
```
LOCAL_PATH := $(call my-dir)

include $(CLEAR_VARS)

LOCAL_MODULE    := DlmallocTest
LOCAL_SRC_FILES := DlmallocTest.c
LOCAL_CFLAGS    += -pie -fPIE
LOCAL_LDFLAGS   += -pie -fPIE

LOCAL_FORCE_STATIC_EXECUTABLE := true

#include $(BUILD_SHARED_LIBRARY)
include $(BUILD_EXECUTABLE)
```
这里如果要运行的版本是安卓4.1以上，必须基于PIE编译才能运行，即mk文件需要加上
```
LOCAL_CFLAGS += -pie -fPIE
LOCAL_LDFLAGS += -pie -fPIE
```
打开终端，切换到当前目录下，使用ndk构建。
```
$ ndk-build NDK_DEBUG=1
Android NDK: APP_PLATFORM not set. Defaulting to minimum supported version android-14.
[arm64-v8a] Gdbserver      : [aarch64-linux-android] libs/arm64-v8a/gdbserver
[arm64-v8a] Gdbsetup       : libs/arm64-v8a/gdb.setup
[armeabi-v7a] Gdbserver      : [arm-linux-androideabi] libs/armeabi-v7a/gdbserver
[armeabi-v7a] Gdbsetup       : libs/armeabi-v7a/gdb.setup
[x86] Gdbserver      : [i686-linux-android] libs/x86/gdbserver
[x86] Gdbsetup       : libs/x86/gdb.setup
[x86_64] Gdbserver      : [x86_64-linux-android] libs/x86_64/gdbserver
[x86_64] Gdbsetup       : libs/x86_64/gdb.setup
[arm64-v8a] Compile        : DlmallocTest <= DlmallocTest.c
[arm64-v8a] Executable     : DlmallocTest
[arm64-v8a] Install        : DlmallocTest => libs/arm64-v8a/DlmallocTest
[armeabi-v7a] Compile thumb  : DlmallocTest <= DlmallocTest.c
[armeabi-v7a] Executable     : DlmallocTest
[armeabi-v7a] Install        : DlmallocTest => libs/armeabi-v7a/DlmallocTest
[x86] Compile        : DlmallocTest <= DlmallocTest.c
[x86] Executable     : DlmallocTest
[x86] Install        : DlmallocTest => libs/x86/DlmallocTest
[x86_64] Compile        : DlmallocTest <= DlmallocTest.c
[x86_64] Executable     : DlmallocTest
[x86_64] Install        : DlmallocTest => libs/x86_64/DlmallocTest
```
返回上一级文件夹，即与jni同级的目录，生成了libs文件
```
/libs$ ls
arm64-v8a  armeabi-v7a  x86  x86_64
```
连接手机，打开usb调试，使用adb。
```
$ adb devices
List of devices attached
1844b0900904	device
```
使用adb push把程序传送到手机上
```
/armeabi-v7a$ adb push DlmallocTest /data/local/tmp
127 KB/s (9692 bytes in 0.074s)
```
使用adb shell远程运行手机上的程序
```
$ adb shell
mido:/ $ cd /data/local/tmp
mido:/data/local/tmp $ ls
DlmallocTest flatland flatland64
mido:/data/local/tmp $ ./DlmallocTest
Hello, World
^C
130|mido:/data/local/tmp $ exit

```
使用socat将程序绑定在端口上
```
$ adb push socat /data/local/tmp
* daemon not running. starting it now on port 5037 *
* daemon started successfully *
1544 KB/s (849832 bytes in 0.537s)
lometsj@ubuntu:~/Downloads$ adb shell
mido:/ $ cd /data/local/tmp
1|mido:/data/local/tmp $ ./socat TCP4-LISTEN:10001, EXEC:./DlmallocTest

```
切回电脑终端进行远程访问
```
$ adb forward tcp:10001 tcp:10001
$ nc 127.0.0.1 10001
Hello, World

```
### 【总结】

本次实验主要熟悉了在Android系统搭建c程序环境。
