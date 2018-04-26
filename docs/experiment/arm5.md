# <center>arm下栈溢出实验</center>

## 实验概述

### 【目的】
编译stack.c，使用gdb调试，查看arm下栈溢出。
### 【环境】
Linux
### 【工具】
gdb，gcc
### 【原理】
缓冲区溢出（buffer overflow），是针对程序设计缺陷，向程序输入缓冲区写入使之溢出的内容（通常是超过缓冲区能保存的最大数据量的数据），从而破坏程序运行、趁著中断之际并获取程序乃至系统的控制权。
## 实验步骤

### 【步骤】
查看stack.c
```c
#include "stdio.h"

int main(int argc, char **argv)
{
char buffer[8];
gets(buffer);
}
```
这个例程只是定义了一个buffer字符数组，并且使用gets来读取用户输入来装入buffer。
使用gcc来编译。
```
$ gcc stack.c -o stack
```
打开gdb，调试程序，使用disass调用gdb的反汇编功能
```
pi@raspberrypi:~ $ gdb stack -q
[*] No debugging session active
GEF for linux ready, type `gef' to start, `gef config' to configure
56 commands loaded for GDB 7.7.1 using Python engine 2.7
[*] 4 commands could not be loaded, run `gef missing` to know why.
Reading symbols from stack...(no debugging symbols found)...done.
gef> disass main
Dump of assembler code for function main:
   0x0001041c <+0>:	push	{r11, lr}
   0x00010420 <+4>:	add	r11, sp, #4
   0x00010424 <+8>:	sub	sp, sp, #16
   0x00010428 <+12>:	str	r0, [r11, #-16]
   0x0001042c <+16>:	str	r1, [r11, #-20]
   0x00010430 <+20>:	sub	r3, r11, #12
   0x00010434 <+24>:	mov	r0, r3
   0x00010438 <+28>:	bl	0x102c4
   0x0001043c <+32>:	mov	r0, r3
   0x00010440 <+36>:	sub	sp, r11, #4
   0x00010444 <+40>:	pop	{r11, pc}
End of assembler dump.
gef> 
```
我们知道，在gets函数被调用后，程序可能会引起栈溢出。
那我们在调用完gets后下断点，观察栈上的情况。
```
gef> b *0x1043c
Breakpoint 1 at 0x1043c
gef> r
Starting program: /home/pi/stack 
AAAAAAAA

Breakpoint 1, 0x0001043c in main ()
---------------------------------------------------------------[ registers ]----
$r0   : 0xbefff250 -> "AAAAAAAA"
$r1   : 0x00000000
$r2   : 0x00000001
$r3   : 0x00000000
$r4   : 0x00000000
$r5   : 0x00000000
$r6   : 0x000102f4 -> <_start+0> mov r11,  #0
$r7   : 0x00000000
$r8   : 0x00000000
$r9   : 0x00000000
$r10  : 0xb6ffc000 -> 0x0002ff44
$r11  : 0xbefff25c -> 0xb6e8c294 -> <__libc_start_main+276> bl 0xb6ea4b28 <__GI_exit>
$r12  : 0x0000001c
$sp   : 0xbefff248 -> 0xbefff3b4 -> 0xbefff51a -> "/home/pi/stack"
$lr   : 0x41414141 ("AAAA"?)
$pc   : 0x0001043c -> <main+32> mov r0,  r3
$cpsr : [thumb fast interrupt overflow CARRY ZERO negative]
-------------------------------------------------------------------[ stack ]----
0xbefff248|+0x00: 0xbefff3b4 -> 0xbefff51a -> "/home/pi/stack"	<-$sp
0xbefff24c|+0x04: 0x00000001
0xbefff250|+0x08: "AAAAAAAA"	<-$r0
0xbefff254|+0x0c: "AAAA"
0xbefff258|+0x10: 0x00000000
0xbefff25c|+0x14: 0xb6e8c294 -> <__libc_start_main+276> bl 0xb6ea4b28 <__GI_exit>	<-$r11
0xbefff260|+0x18: 0xb6fb1000 -> 0x0013cf20
0xbefff264|+0x1c: 0xbefff3b4 -> 0xbefff51a -> "/home/pi/stack"
----------------------------------------------------------------[ code:arm ]----
      0x10424 <main+8>         sub    sp,  sp,  #16
      0x10428 <main+12>        str    r0,  [r11,  #-16]
      0x1042c <main+16>        str    r1,  [r11,  #-20]
      0x10430 <main+20>        sub    r3,  r11,  #12
      0x10434 <main+24>        mov    r0,  r3
      0x10438 <main+28>        bl     0x102c4
->   0x1043c <main+32>        mov    r0,  r3
      0x10440 <main+36>        sub    sp,  r11,  #4
      0x10444 <main+40>        pop    {r11,  pc}
      0x10448 <__libc_csu_init+0> push   {r3,  r4,  r5,  r6,  r7,  r8,  r9,  lr}
      0x1044c <__libc_csu_init+4> mov    r7,  r0
      0x10450 <__libc_csu_init+8> ldr    r6,  [pc,  #76]	; 0x104a4 <__libc_csu_init+92>
-----------------------------------------------------------------[ threads ]----
[#0] Id 1, Name: "stack", stopped, reason: BREAKPOINT
-------------------------------------------------------------------[ trace ]----
[#0] 0x1043c->Name: main()
--------------------------------------------------------------------------------
gef> r
```
这里我们输入了7个`A`，查看stack区域，发现栈帧并没有被损坏。因为我们这里输入的是符合程序预期的8个字节的数据，这次我们尝试提供十六个A，看看会发生什么。
```
gef> r
Starting program: /home/pi/stack 
AAAAAAAAAAAAAAAA

Breakpoint 1, 0x0001043c in main ()
---------------------------------------------------------------[ registers ]----
$r0   : 0xbefff250 -> "AAAAAAAAAAAAAAAA"
$r1   : 0x00000000
$r2   : 0x00000001
$r3   : 0x00000000
$r4   : 0x00000000
$r5   : 0x00000000
$r6   : 0x000102f4 -> <_start+0> mov r11,  #0
$r7   : 0x00000000
$r8   : 0x00000000
$r9   : 0x00000000
$r10  : 0xb6ffc000 -> 0x0002ff44
$r11  : 0xbefff25c -> "AAAA"
$r12  : 0x00000014
$sp   : 0xbefff248 -> 0xbefff3b4 -> 0xbefff51a -> "/home/pi/stack"
$lr   : 0x41414141 ("AAAA"?)
$pc   : 0x0001043c -> <main+32> mov r0,  r3
$cpsr : [thumb fast interrupt overflow CARRY ZERO negative]
-------------------------------------------------------------------[ stack ]----
0xbefff248|+0x00: 0xbefff3b4 -> 0xbefff51a -> "/home/pi/stack"	<-$sp
0xbefff24c|+0x04: 0x00000001
0xbefff250|+0x08: "AAAAAAAAAAAAAAAA"	<-$r0
0xbefff254|+0x0c: "AAAAAAAAAAAA"
0xbefff258|+0x10: "AAAAAAAA"
0xbefff25c|+0x14: "AAAA"	<-$r11
0xbefff260|+0x18: 0xb6fb1000 -> 0x0013cf20
0xbefff264|+0x1c: 0xbefff3b4 -> 0xbefff51a -> "/home/pi/stack"
----------------------------------------------------------------[ code:arm ]----
      0x10424 <main+8>         sub    sp,  sp,  #16
      0x10428 <main+12>        str    r0,  [r11,  #-16]
      0x1042c <main+16>        str    r1,  [r11,  #-20]
      0x10430 <main+20>        sub    r3,  r11,  #12
      0x10434 <main+24>        mov    r0,  r3
      0x10438 <main+28>        bl     0x102c4
->   0x1043c <main+32>        mov    r0,  r3
      0x10440 <main+36>        sub    sp,  r11,  #4
      0x10444 <main+40>        pop    {r11,  pc}
      0x10448 <__libc_csu_init+0> push   {r3,  r4,  r5,  r6,  r7,  r8,  r9,  lr}
      0x1044c <__libc_csu_init+4> mov    r7,  r0
      0x10450 <__libc_csu_init+8> ldr    r6,  [pc,  #76]	; 0x104a4 <__libc_csu_init+92>
-----------------------------------------------------------------[ threads ]----
[#0] Id 1, Name: "stack", stopped, reason: BREAKPOINT
-------------------------------------------------------------------[ trace ]----
[#0] 0x1043c->Name: main()
--------------------------------------------------------------------------------
gef> 
```
观察stack区域的数据，`A`在超过buffer后并不会停止写入，相反的，它向高地址继续写入，破坏了函数调用栈。此时我们按下c（continue）使程序继续运行。
```
gef> c
Continuing.

Program received signal SIGSEGV, Segmentation fault.
0x41414140 in ?? ()
---------------------------------------------------------------[ registers ]----
$r0   : 0x00000000
$r1   : 0x00000000
$r2   : 0x00000001
$r3   : 0x00000000
$r4   : 0x00000000
$r5   : 0x00000000
$r6   : 0x000102f4 -> <_start+0> mov r11,  #0
$r7   : 0x00000000
$r8   : 0x00000000
$r9   : 0x00000000
$r10  : 0xb6ffc000 -> 0x0002ff44
$r11  : 0x41414141 ("AAAA"?)
$r12  : 0x00000014
$sp   : 0xbefff260 -> 0xb6fb1000 -> 0x0013cf20
$lr   : 0x41414141 ("AAAA"?)
$pc   : 0x41414140 ("@AAA"?)
$cpsr : [THUMB fast interrupt overflow CARRY ZERO negative]
-------------------------------------------------------------------[ stack ]----
0xbefff260|+0x00: 0xb6fb1000 -> 0x0013cf20	<-$sp
0xbefff264|+0x04: 0xbefff3b4 -> 0xbefff51a -> "/home/pi/stack"
0xbefff268|+0x08: 0x00000001
0xbefff26c|+0x0c: 0x0001041c -> <main+0> push {r11,  lr}
0xbefff270|+0x10: 0xb6ffe0c8 -> 0x00010247 -> "GLIBC_2.4"
0xbefff274|+0x14: 0xb6ffddd0 -> 0xb6e74000 -> 0x464c457f
0xbefff278|+0x18: 0x00000000
0xbefff27c|+0x1c: 0x00000000
----------------------------------------------------------[ code:arm:thumb ]----
[!] Cannot disassemble from $PC
-----------------------------------------------------------------[ threads ]----
[#0] Id 1, Name: "stack", stopped, reason: SIGSEGV
-------------------------------------------------------------------[ trace ]----
--------------------------------------------------------------------------------
gef> 
```
发现程序发生了错误并退出，观察寄存器区域，发现pc寄存器的值被改写成了 `$pc   : 0x41414140 ("@AAA"?)`（由于切换到了THUMB模式，最后一个字节被改写成了0x40）。

### 【总结】

本次实验主要体验arm环境下栈溢出。
可以发现，要使栈溢出发生，要满足以下条件：


- 程序允许用户输入
- 程序对用户的输入长度不加检查

栈溢出攻击是最为普遍而又危害极大的漏洞，要防御栈溢出攻击，首先要有良好的编码功力，对于用户的输入数据要做严格的长度检查，避免使用危险的函数。
