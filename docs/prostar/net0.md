# <center>二进制数据编程实验1</center>

## 实验概述

### 【目的】
本次实验所有的题用socat起到端口上进行操作。
1. 运行net0，得到输出`Thank you sir/madam`
2. 运行net1，得到输出`you correctly sent the data`
3. 运行net2，得到输出`you added them correctly`
### 【环境】
Linux
### 【工具】
python，pwntools
### 【原理】

## 实验步骤

### 【步骤】
#### net0
socat把程序放到端口上。
```
$ socat tcp-l:9997,fork exec:./net1
```
```c
__int64 run()
{
  unsigned int ptr; // [sp+0h] [bp-10h]@1
  unsigned int v2; // [sp+4h] [bp-Ch]@1
  __int64 v3; // [sp+8h] [bp-8h]@1

  v3 = *MK_FP(__FS__, 40LL);
  v2 = random();
  printf("Please send '%d' as a little endian 32bit int\n", v2);
  if ( !fread(&ptr, 4uLL, 1uLL, _bss_start) )
    errx(1, ":(\n");
  if ( ptr == v2 )
    puts("Thank you sir/madam");
  else
    printf("I'm sorry, you sent %d instead\n", ptr);
  return *MK_FP(__FS__, 40LL) ^ v3;
}
```
这里发送了一个unsined int的随机变量给我们，要我们按相同的数值输出。
因为程序用fread读取我们的发送的值，直接发送行不通，可以使用Pwntools的二进制打包函数包装一下。
```python
from pwn import *

io = remote("127.0.0.1",9997)
a = io.recv()
a = a[a.find("'"):]
a = a[1:]
a = a[:a.find("'")]

a = int(a)
io.sendline(p32(a))
print io.recv()
```
```
$ python net0.py
[+] Starting local process './net0': pid 14698
[*] Process './net0' stopped with exit code 0 (pid 14698)
Thank you sir/madam

```
#### net1
```c
void run()
{
  char buf[12];
  char fub[12];
  char *q;

  unsigned int wanted;

  wanted = random();

  sprintf(fub, "%d", wanted);

  if(write(0, &wanted, sizeof(wanted)) != sizeof(wanted)) {
      errx(1, ":(\n");
  }

  if(fgets(buf, sizeof(buf)-1, stdin) == NULL) {
      errx(1, ":(\n");
  }

  q = strchr(buf, '\r'); if(q) *q = 0;
  q = strchr(buf, '\n'); if(q) *q = 0;

  if(strcmp(fub, buf) == 0) {
      printf("you correctly sent the data\n");
  } else {
      printf("you didn't send the data properly\n");
  }
}

```
这里与上一题类似，不过使用了write()发送和fgets()接收，这里考察的是使用解包函数处理数据。

```python
from pwn import *

io = remote("127.0.0.1",9997)
temp = io.recv()
print temp
payload = u32(temp)
io.sendline(str(payload))
print io.recv()


```
```
$ python net1.py
[+] Opening connection to 127.0.0.1 on port 9997: Done
��^R
you correctly sent the data

[*] Closed connection to 127.0.0.1 port 9997

```

#### net2
这里是上面两题的结合。
```python
from pwn import *

io = process('127.0.0.1',9997)

sum = 0
for i in range(4):
    t = io.recv(4)
    sum += u32(t)

print "sum=", sum

io.sendline(p64(sum))

print io.recv()
io.close()
```



### 【总结】

本次实验主要熟悉了网络传输时的打包和解包函数。