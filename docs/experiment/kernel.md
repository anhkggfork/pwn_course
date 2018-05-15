# 内核利用-环境配置

## 实验概述

### 【目的】
尝试编译内核并用qemu运行内核
### 【环境】
Linux
### 【工具】
qemu
### 【原理】
Linux 内核（英语：Linux kernel），是一种开源的类Unix操作系统宏内核。整个 Linux 操作系统家族基于该内核部署在传统计算机平台（如个人计算机和服务器，以 Linux 发行版的形式[7]）和各种嵌入式平台，如路由器、无线接入点、专用小交换机、机顶盒、FTA 接收器、智能电视、数字视频录像机、网络附加存储（NAS）等。工作于平板电脑、智能手机及智能手表的 Android 操作系统同样通过 Linux 内核提供的服务完成自身功能。尽管于桌面电脑的占用率较低，基于 Linux 的操作系统统治了几乎从移动设备到主机的其他全部领域。截至2017年11月，世界前500台最强的超级计算机全部使用 Linux
## 实验步骤

### 【步骤】

在[](https://www.kernel.org/)上下载内核源码。

解压压缩包
```
$ tar -xjvf  xxxxxxx
$ cd ~/linux-4.16.3
```
安装一些依赖和软件
```
$ sudo apt-get install libncurses5-dev
$ sudo apt-get install qemu qemu-system
$ sudo apt-get install libelf-dev
$ sudo apt-get install openssl-dev
```
在内核4.16，需要额外安装flex和bison
```
$ sudo apt install flex
$ sudo apt install bison
```


配置
```
$ make menuconfig
```

编译
```
$ make
$ make all
$ make modules
```

创建文件系统
```
~/linux-4.16.3/arch/x86/boot$ mkinitramfs -o initrd.img
```
使用qemu运行编译成功的内核
```
$ qemu-system-x86_64 -kernel bzImage -initrd initrd.img -m 512M
```


### 【总结】

本次实验主要尝试编译内核并使用qemu运行。
