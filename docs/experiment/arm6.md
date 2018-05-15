# arm下堆溢出实验1

## 实验概述

### 【目的】
编译（使用-O）运行heap.c，使用gdb查看chunk内堆溢出

### 【环境】
Linux
### 【工具】
gdb，gcc
### 【原理】
堆溢出是堆数据区中发生的一种缓冲区溢出。 堆溢出以与基于栈溢出不同的方式被利用。 堆上的内存由应用程序在运行时动态分配，通常包含程序数据。 通过以特定的方式破坏这些数据来执行开发，以使应用程序覆盖诸如链接列表指针的内部结构。 规范堆溢出技术覆盖动态内存分配链接（如malloc元数据），并使用生成的指针交换来覆盖程序函数指针。
## 实验步骤

### 【步骤】
#### chunk内堆溢出
查看heap.c代码
```
#include "stdlib.h"
#include "stdio.h"

struct u_data                                          //object model: 8 bytes for name, 4 bytes for number
{
 char name[8];
 int number;
};

int main ( int argc, char* argv[] )
{
 struct u_data* objA = malloc(sizeof(struct u_data)); //create object in Heap

 objA->number = 1234;                                 //set the number of our object to a static value
 gets(objA->name);                                    //set name of our object according to user's input

 if(objA->number == 1234)                             //check if static value is intact
 {
  puts("Memory valid");
 }
 else                                                 //proceed here in case the static value gets corrupted
 {
  puts("Memory corrupted");
 }
}
```
使用gcc编译
```
pi@raspberrypi:~ $ gcc heap.c -o heap -O

```
用gdb查看
```
pi@raspberrypi:~ $ gdb heap -q
[*] No debugging session active
GEF for linux ready, type `gef' to start, `gef config' to configure
56 commands loaded for GDB 7.7.1 using Python engine 2.7
[*] 4 commands could not be loaded, run `gef missing` to know why.
Reading symbols from heap...(no debugging symbols found)...done.
gef> disass main
Dump of assembler code for function main:
   0x0001047c <+0>:	push	{r3, r4, r5, lr}
   0x00010480 <+4>:	mov	r0, #12
   0x00010484 <+8>:	bl	0x10324
   0x00010488 <+12>:	mov	r5, r0
   0x0001048c <+16>:	ldr	r4, [pc, #40]	; 0x104bc <main+64>
   0x00010490 <+20>:	str	r4, [r0, #8]
   0x00010494 <+24>:	bl	0x1030c
   0x00010498 <+28>:	ldr	r3, [r5, #8]
   0x0001049c <+32>:	cmp	r3, r4
   0x000104a0 <+36>:	bne	0x104b0 <main+52>
   0x000104a4 <+40>:	ldr	r0, [pc, #20]	; 0x104c0 <main+68>
   0x000104a8 <+44>:	bl	0x10318
   0x000104ac <+48>:	pop	{r3, r4, r5, pc}
   0x000104b0 <+52>:	ldr	r0, [pc, #12]	; 0x104c4 <main+72>
   0x000104b4 <+56>:	bl	0x10318
   0x000104b8 <+60>:	pop	{r3, r4, r5, pc}
   0x000104bc <+64>:	ldrdeq	r0, [r0], -r2
   0x000104c0 <+68>:	andeq	r0, r1, r12, lsr r5
   0x000104c4 <+72>:	andeq	r0, r1, r12, asr #10
End of assembler dump.
```
在读取用户输入后下断点
```
gef> b *0x10498
Breakpoint 1 at 0x10498
```
运行程序，输入7个A
```
gef> r
Starting program: /home/pi/heap 
AAAAAAA

Breakpoint 1, 0x00010498 in main ()
---------------------------------------------------------------[ registers ]----
$r0   : 0x00021008 -> "AAAAAAA"
$r1   : 0x00000000
$r2   : 0x00000001
$r3   : 0x00000000
$r4   : 0x000004d2
$r5   : 0x00021008 -> "AAAAAAA"
$r6   : 0x00010354 -> <_start+0> mov r11,  #0
$r7   : 0x00000000
$r8   : 0x00000000
$r9   : 0x00000000
$r10  : 0xb6ffc000 -> 0x0002ff44 -> 0x00000000
$r11  : 0x00000000
$r12  : 0x00000041
$sp   : 0xbefff250 -> 0x0001047c -> <main+0> push {r3,  r4,  r5,  lr}
$lr   : 0x00000041
$pc   : 0x00010498 -> <main+28> ldr r3,  [r5,  #8]
$cpsr : [thumb fast interrupt overflow CARRY ZERO negative]
-------------------------------------------------------------------[ stack ]----
0xbefff250|+0x00: 0x0001047c -> <main+0> push {r3,  r4,  r5,  lr}	<-$sp
0xbefff254|+0x04: 0x00000000
0xbefff258|+0x08: 0x00000000
0xbefff25c|+0x0c: 0xb6e8c294 -> <__libc_start_main+276> bl 0xb6ea4b28 <__GI_exit>
0xbefff260|+0x10: 0xb6fb1000 -> 0x0013cf20
0xbefff264|+0x14: 0xbefff3b4 -> 0xbefff51c -> "/home/pi/heap"
0xbefff268|+0x18: 0x00000001
0xbefff26c|+0x1c: 0x0001047c -> <main+0> push {r3,  r4,  r5,  lr}
----------------------------------------------------------------[ code:arm ]----
      0x10480 <main+4>         mov    r0,  #12
      0x10484 <main+8>         bl     0x10324
      0x10488 <main+12>        mov    r5,  r0
      0x1048c <main+16>        ldr    r4,  [pc,  #40]	; 0x104bc <main+64>
      0x10490 <main+20>        str    r4,  [r0,  #8]
      0x10494 <main+24>        bl     0x1030c
->   0x10498 <main+28>        ldr    r3,  [r5,  #8]
      0x1049c <main+32>        cmp    r3,  r4
      0x104a0 <main+36>        bne    0x104b0 <main+52>
      0x104a4 <main+40>        ldr    r0,  [pc,  #20]	; 0x104c0 <main+68>
      0x104a8 <main+44>        bl     0x10318
      0x104ac <main+48>        pop    {r3,  r4,  r5,  pc}
-----------------------------------------------------------------[ threads ]----
[#0] Id 1, Name: "heap", stopped, reason: BREAKPOINT
-------------------------------------------------------------------[ trace ]----
[#0] 0x10498->Name: main()
--------------------------------------------------------------------------------
gef> 
```
这里我们要查看堆的状态，使用vmmap查看程序的结构
```
gef> vmmap
Start      End        Offset     Perm Path
0x00010000 0x00011000 0x00000000 r-x /home/pi/heap
0x00020000 0x00021000 0x00000000 rw- /home/pi/heap
0x00021000 0x00042000 0x00000000 rw- [heap]
0xb6e74000 0xb6f9f000 0x00000000 r-x /lib/arm-linux-gnueabihf/libc-2.19.so
0xb6f9f000 0xb6faf000 0x0012b000 --- /lib/arm-linux-gnueabihf/libc-2.19.so
0xb6faf000 0xb6fb1000 0x0012b000 r-- /lib/arm-linux-gnueabihf/libc-2.19.so
0xb6fb1000 0xb6fb2000 0x0012d000 rw- /lib/arm-linux-gnueabihf/libc-2.19.so
0xb6fb2000 0xb6fb5000 0x00000000 rw- 
0xb6fcc000 0xb6fec000 0x00000000 r-x /lib/arm-linux-gnueabihf/ld-2.19.so
0xb6ff9000 0xb6ffb000 0x00000000 rw- 
0xb6ffb000 0xb6ffc000 0x0001f000 r-- /lib/arm-linux-gnueabihf/ld-2.19.so
0xb6ffc000 0xb6ffd000 0x00020000 rw- /lib/arm-linux-gnueabihf/ld-2.19.so
0xb6ffd000 0xb6fff000 0x00000000 rw- 
0xb6fff000 0xb7000000 0x00000000 r-x [sigpage]
0xbefdf000 0xbf000000 0x00000000 rw- [stack]
0xffff0000 0xffff1000 0x00000000 r-x [vectors]
```
可以看到堆是从地址`0x00021000`开始的，使用`x`来查看其地址的值
```
gef> x/x 0x21000
0x21000:	0x00000000
gef> x/x 0x21004
0x21004:	0x00000011
gef> x/x 0x21008
0x21008:	0x41414141
gef> x/x 0x2100c
0x2100c:	0x00414141
gef> x/x 0x21010
0x21010:	0x000004d2
```
再次运行程序，这次输入8个A
```
gef> r
Starting program: /home/pi/heap 
AAAAAAAA

Breakpoint 1, 0x00010498 in main ()
---------------------------------------------------------------[ registers ]----
$r0   : 0x00021008 -> "AAAAAAAA"
$r1   : 0x00000000
$r2   : 0x00000001
$r3   : 0x00000000
$r4   : 0x000004d2
$r5   : 0x00021008 -> "AAAAAAAA"
$r6   : 0x00010354 -> <_start+0> mov r11,  #0
$r7   : 0x00000000
$r8   : 0x00000000
$r9   : 0x00000000
$r10  : 0xb6ffc000 -> 0x0002ff44 -> 0x00000000
$r11  : 0x00000000
$r12  : 0x0000001c
$sp   : 0xbefff250 -> 0x0001047c -> <main+0> push {r3,  r4,  r5,  lr}
$lr   : 0x41414141 ("AAAA"?)
$pc   : 0x00010498 -> <main+28> ldr r3,  [r5,  #8]
$cpsr : [thumb fast interrupt overflow CARRY ZERO negative]
-------------------------------------------------------------------[ stack ]----
0xbefff250|+0x00: 0x0001047c -> <main+0> push {r3,  r4,  r5,  lr}	<-$sp
0xbefff254|+0x04: 0x00000000
0xbefff258|+0x08: 0x00000000
0xbefff25c|+0x0c: 0xb6e8c294 -> <__libc_start_main+276> bl 0xb6ea4b28 <__GI_exit>
0xbefff260|+0x10: 0xb6fb1000 -> 0x0013cf20
0xbefff264|+0x14: 0xbefff3b4 -> 0xbefff51c -> "/home/pi/heap"
0xbefff268|+0x18: 0x00000001
0xbefff26c|+0x1c: 0x0001047c -> <main+0> push {r3,  r4,  r5,  lr}
----------------------------------------------------------------[ code:arm ]----
      0x10480 <main+4>         mov    r0,  #12
      0x10484 <main+8>         bl     0x10324
      0x10488 <main+12>        mov    r5,  r0
      0x1048c <main+16>        ldr    r4,  [pc,  #40]	; 0x104bc <main+64>
      0x10490 <main+20>        str    r4,  [r0,  #8]
      0x10494 <main+24>        bl     0x1030c
->   0x10498 <main+28>        ldr    r3,  [r5,  #8]
      0x1049c <main+32>        cmp    r3,  r4
      0x104a0 <main+36>        bne    0x104b0 <main+52>
      0x104a4 <main+40>        ldr    r0,  [pc,  #20]	; 0x104c0 <main+68>
      0x104a8 <main+44>        bl     0x10318
      0x104ac <main+48>        pop    {r3,  r4,  r5,  pc}
-----------------------------------------------------------------[ threads ]----
[#0] Id 1, Name: "heap", stopped, reason: BREAKPOINT
-------------------------------------------------------------------[ trace ]----
[#0] 0x10498->Name: main()
--------------------------------------------------------------------------------
gef> x/x 0x21000
0x21000:	0x00000000
gef> x/x 0x21004
0x21004:	0x00000011
gef> x/x 0x21008
0x21008:	0x41414141
gef> x/x 0x2100c
0x2100c:	0x41414141
gef> 
0x21010:	0x00000400
gef> x/x 0x21010
0x21010:	0x00000400
```
对于这一次运行，可以看到结构体内的number被覆盖。
```
pi@raspberrypi:~ $ ./heap
AAAAAAA
Memory valid
pi@raspberrypi:~ $ ./heap
AAAAAAAA
Memory corrupted

```
### 【总结】

本次实验主要体验arm环境下栈溢出。
可以发现，要使栈溢出发生，要满足以下条件：


- 程序允许用户输入
- 程序对用户的输入长度不加检查

栈溢出攻击是最为普遍而又危害极大的漏洞，要防御栈溢出攻击，首先要有良好的编码功力，对于用户的输入数据要做严格的长度检查，避免使用危险的函数。