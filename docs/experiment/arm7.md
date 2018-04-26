# <center>arm下堆溢出2</center>

## 实验概述

### 【目的】
编译运行heap2.c，使用gdb查看chunk间堆溢出

### 【环境】
Linux
### 【工具】
gdb，gcc
### 【原理】
堆溢出是堆数据区中发生的一种缓冲区溢出。 堆溢出以与基于栈溢出不同的方式被利用。 堆上的内存由应用程序在运行时动态分配，通常包含程序数据。 通过以特定的方式破坏这些数据来执行开发，以使应用程序覆盖诸如链接列表指针的内部结构。 规范堆溢出技术覆盖动态内存分配链接（如malloc元数据），并使用生成的指针交换来覆盖程序函数指针。

## 实验步骤

### 【步骤】
查看heap2.c
```c
#include "stdlib.h"
#include "stdio.h"

int main ( int argc, char* argv[] )
{
 char *some_string = malloc(8);  //create some_string "object" in Heap
 int *some_number = malloc(4);   //create some_number "object" in Heap

 *some_number = 1234;            //assign some_number a static value
 gets(some_string);              //ask user for input for some_string

 if(*some_number == 1234)        //check if static value (of some_number) is in tact
 {
 puts("Memory valid");
 }
 else                            //proceed here in case the static some_number gets corrupted
 {
 puts("Memory corrupted");
 }
}
```
使用gcc编译
```
pi@raspberrypi:~ $ gcc heap2.c -o heap2
```
使用gdb调试程序，反汇编main函数
```
$ gdb heap2 -q
[*] No debugging session active
GEF for linux ready, type `gef' to start, `gef config' to configure
56 commands loaded for GDB 7.7.1 using Python engine 2.7
[*] 4 commands could not be loaded, run `gef missing` to know why.
Reading symbols from heap2...(no debugging symbols found)...done.
gef> disass main
Dump of assembler code for function main:
   0x0001047c <+0>:	push	{r11, lr}
   0x00010480 <+4>:	add	r11, sp, #4
   0x00010484 <+8>:	sub	sp, sp, #16
   0x00010488 <+12>:	str	r0, [r11, #-16]
   0x0001048c <+16>:	str	r1, [r11, #-20]
   0x00010490 <+20>:	mov	r0, #8
   0x00010494 <+24>:	bl	0x10324
   0x00010498 <+28>:	mov	r3, r0
   0x0001049c <+32>:	str	r3, [r11, #-8]
   0x000104a0 <+36>:	mov	r0, #4
   0x000104a4 <+40>:	bl	0x10324
   0x000104a8 <+44>:	mov	r3, r0
   0x000104ac <+48>:	str	r3, [r11, #-12]
   0x000104b0 <+52>:	ldr	r3, [r11, #-12]
   0x000104b4 <+56>:	ldr	r2, [pc, #60]	; 0x104f8 <main+124>
   0x000104b8 <+60>:	str	r2, [r3]
   0x000104bc <+64>:	ldr	r0, [r11, #-8]
   0x000104c0 <+68>:	bl	0x1030c
   0x000104c4 <+72>:	ldr	r3, [r11, #-12]
   0x000104c8 <+76>:	ldr	r3, [r3]
   0x000104cc <+80>:	ldr	r2, [pc, #36]	; 0x104f8 <main+124>
   0x000104d0 <+84>:	cmp	r3, r2
   0x000104d4 <+88>:	bne	0x104e4 <main+104>
   0x000104d8 <+92>:	ldr	r0, [pc, #28]	; 0x104fc <main+128>
   0x000104dc <+96>:	bl	0x10318
   0x000104e0 <+100>:	b	0x104ec <main+112>
   0x000104e4 <+104>:	ldr	r0, [pc, #20]	; 0x10500 <main+132>
   0x000104e8 <+108>:	bl	0x10318
   0x000104ec <+112>:	mov	r0, r3
   0x000104f0 <+116>:	sub	sp, r11, #4
   0x000104f4 <+120>:	pop	{r11, pc}
   0x000104f8 <+124>:	ldrdeq	r0, [r0], -r2
   0x000104fc <+128>:	andeq	r0, r1, r8, ror r5
   0x00010500 <+132>:	andeq	r0, r1, r8, lsl #11
End of assembler dump.

```
在读取用户输入之后下断点
```
gef> b *0x104c4
Breakpoint 1 at 0x104c4
```
输入7个A，并查看堆上的情况
```
gef> r
Starting program: /home/pi/heap2 
AAAAAAA

Breakpoint 1, 0x000104c4 in main ()
---------------------------------------------------------------[ registers ]----
$r0   : 0x00021008 -> "AAAAAAA"
$r1   : 0x00000000
$r2   : 0x00000001
$r3   : 0x00000000
$r4   : 0x00000000
$r5   : 0x00000000
$r6   : 0x00010354 -> <_start+0> mov r11,  #0
$r7   : 0x00000000
$r8   : 0x00000000
$r9   : 0x00000000
$r10  : 0xb6ffc000 -> 0x0002ff44 -> 0x00000000
$r11  : 0xbefff25c -> 0xb6e8c294 -> <__libc_start_main+276> bl 0xb6ea4b28 <__GI_exit>
$r12  : 0x00000041
$sp   : 0xbefff248 -> 0xbefff3b4 -> 0xbefff51a -> "/home/pi/heap2"
$lr   : 0x00000041
$pc   : 0x000104c4 -> <main+72> ldr r3,  [r11,  #-12]
$cpsr : [thumb fast interrupt overflow CARRY ZERO negative]
-------------------------------------------------------------------[ stack ]----
0xbefff248|+0x00: 0xbefff3b4 -> 0xbefff51a -> "/home/pi/heap2"	<-$sp
0xbefff24c|+0x04: 0x00000001
0xbefff250|+0x08: 0x00021018 -> 0x000004d2
0xbefff254|+0x0c: 0x00021008 -> "AAAAAAA"
0xbefff258|+0x10: 0x00000000
0xbefff25c|+0x14: 0xb6e8c294 -> <__libc_start_main+276> bl 0xb6ea4b28 <__GI_exit>	<-$r11
0xbefff260|+0x18: 0xb6fb1000 -> 0x0013cf20
0xbefff264|+0x1c: 0xbefff3b4 -> 0xbefff51a -> "/home/pi/heap2"
----------------------------------------------------------------[ code:arm ]----
      0x104ac <main+48>        str    r3,  [r11,  #-12]
      0x104b0 <main+52>        ldr    r3,  [r11,  #-12]
      0x104b4 <main+56>        ldr    r2,  [pc,  #60]	; 0x104f8 <main+124>
      0x104b8 <main+60>        str    r2,  [r3]
      0x104bc <main+64>        ldr    r0,  [r11,  #-8]
      0x104c0 <main+68>        bl     0x1030c
->   0x104c4 <main+72>        ldr    r3,  [r11,  #-12]
      0x104c8 <main+76>        ldr    r3,  [r3]
      0x104cc <main+80>        ldr    r2,  [pc,  #36]	; 0x104f8 <main+124>
      0x104d0 <main+84>        cmp    r3,  r2
      0x104d4 <main+88>        bne    0x104e4 <main+104>
      0x104d8 <main+92>        ldr    r0,  [pc,  #28]	; 0x104fc <main+128>
-----------------------------------------------------------------[ threads ]----
[#0] Id 1, Name: "heap2", stopped, reason: BREAKPOINT
-------------------------------------------------------------------[ trace ]----
[#0] 0x104c4->Name: main()
--------------------------------------------------------------------------------
gef> x/x 0x21000
0x21000:	0x00000000
gef> x/x 0x21004
0x21004:	0x00000011
gef> x/x 0x21008
0x21008:	0x41414141
gef> x/x 0x2100c
0x2100c:	0x00414141
gef> x/x 0x21010
0x21010:	0x00000000
gef> x/x 0x21014
0x21014:	0x00000011
gef> x/x 0x21018
0x21018:	0x000004d2

```
输入17个A，制造堆溢出，查看堆上的情况
```
gef> r
Starting program: /home/pi/heap2 
AAAAAAAAAAAAAAAA

Breakpoint 1, 0x000104c4 in main ()
---------------------------------------------------------------[ registers ]----
$r0   : 0x00021008 -> "AAAAAAAAAAAAAAAA"
$r1   : 0x00000000
$r2   : 0x00000001
$r3   : 0x00000000
$r4   : 0x00000000
$r5   : 0x00000000
$r6   : 0x00010354 -> <_start+0> mov r11,  #0
$r7   : 0x00000000
$r8   : 0x00000000
$r9   : 0x00000000
$r10  : 0xb6ffc000 -> 0x0002ff44 -> 0x00000000
$r11  : 0xbefff25c -> 0xb6e8c294 -> <__libc_start_main+276> bl 0xb6ea4b28 <__GI_exit>
$r12  : 0x00000014
$sp   : 0xbefff248 -> 0xbefff3b4 -> 0xbefff51a -> "/home/pi/heap2"
$lr   : 0x41414141 ("AAAA"?)
$pc   : 0x000104c4 -> <main+72> ldr r3,  [r11,  #-12]
$cpsr : [thumb fast interrupt overflow CARRY ZERO negative]
-------------------------------------------------------------------[ stack ]----
0xbefff248|+0x00: 0xbefff3b4 -> 0xbefff51a -> "/home/pi/heap2"	<-$sp
0xbefff24c|+0x04: 0x00000001
0xbefff250|+0x08: 0x00021018 -> 0x00000400
0xbefff254|+0x0c: 0x00021008 -> "AAAAAAAAAAAAAAAA"
0xbefff258|+0x10: 0x00000000
0xbefff25c|+0x14: 0xb6e8c294 -> <__libc_start_main+276> bl 0xb6ea4b28 <__GI_exit>	<-$r11
0xbefff260|+0x18: 0xb6fb1000 -> 0x0013cf20
0xbefff264|+0x1c: 0xbefff3b4 -> 0xbefff51a -> "/home/pi/heap2"
----------------------------------------------------------------[ code:arm ]----
      0x104ac <main+48>        str    r3,  [r11,  #-12]
      0x104b0 <main+52>        ldr    r3,  [r11,  #-12]
      0x104b4 <main+56>        ldr    r2,  [pc,  #60]	; 0x104f8 <main+124>
      0x104b8 <main+60>        str    r2,  [r3]
      0x104bc <main+64>        ldr    r0,  [r11,  #-8]
      0x104c0 <main+68>        bl     0x1030c
->   0x104c4 <main+72>        ldr    r3,  [r11,  #-12]
      0x104c8 <main+76>        ldr    r3,  [r3]
      0x104cc <main+80>        ldr    r2,  [pc,  #36]	; 0x104f8 <main+124>
      0x104d0 <main+84>        cmp    r3,  r2
      0x104d4 <main+88>        bne    0x104e4 <main+104>
      0x104d8 <main+92>        ldr    r0,  [pc,  #28]	; 0x104fc <main+128>
-----------------------------------------------------------------[ threads ]----
[#0] Id 1, Name: "heap2", stopped, reason: BREAKPOINT
-------------------------------------------------------------------[ trace ]----
[#0] 0x104c4->Name: main()
--------------------------------------------------------------------------------
gef> x/x 0x21000
0x21000:	0x00000000
gef> x/x 0x21004
0x21004:	0x00000011
gef> x/x 0x21008
0x21008:	0x41414141
gef> x/x 0x2100c
0x2100c:	0x41414141
gef> x/x 0x21010
0x21010:	0x41414141
gef> x/x 0x21014
0x21014:	0x41414141
gef> x/x 0x21018
0x21018:	0x00000400
gef> q

```
可以看到，通过堆溢出，可以改写相邻chunk的数据。
```
pi@raspberrypi:~ $ ./heap2
AAAAAAA
Memory valid
pi@raspberrypi:~ $ ./heap2
AAAAAAAAAAAAAAAA
Memory corrupted

```
### 【总结】
本次实验主要体验arm环境下栈溢出。
可以发现，要使栈溢出发生，要满足以下条件：


- 程序允许用户输入
- 程序对用户的输入长度不加检查

栈溢出攻击是最为普遍而又危害极大的漏洞，要防御栈溢出攻击，首先要有良好的编码功力，对于用户的输入数据要做严格的长度检查，避免使用危险的函数。
