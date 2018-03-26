---
presentation:
  width: 1600
  height: 900
  slideNumber: 'c/t'
  showSlideNumber: "all"
  center: true
  enableSpeakerNotes: true
  theme: none.css
---

<!-- slide data-notes="" -->
# rop

面向返回编程（英语：Return-Oriented Programming，缩写：ROP）是计算机安全漏洞利用技术，该技术允许攻击者在安全防御的情况下执行代码，如不可执行的内存和代码签名。攻击者控制堆栈调用以劫持程序控制流并执行针对性的机器语言指令序列（称为Gadgets）。 每一段gadget通常结束于return指令，并位于共享库代码中的子程序。系列调用这些代码，攻击者可以在拥有更简单攻击防范的程序内执行任意操作。（维基百科）
<!-- slide data-notes="" -->
## NX/DEP
NX/DEP保护，即数据段不可执行保护，是针对栈溢出攻击而产生的一项防护措施。简单的来说，当开启这种保护时，堆栈上的指令将没有执行权限。所以，将shellcode写到栈上的简单的栈溢出攻击将会失效。
<!-- slide data-notes="" -->
## ret2libc
不利用自己注入的代码，而用系统已有的代码来构造攻击
> system("/bin/sh")
### 特点
- 通常指向系统共享库的代码 -> 执行不受NX/DEP影响
<!-- slide data-notes="" -->
### 溢出形式
- buffer + system()的地址 + ret + binsh_addr
system()的地址即系统共享库中system()的地址。
这里ret的值是执行玩system()后的返回地址，并不重要，可以为任意值。
binsh_addr（）作为system()的参数，调用后拉起shell。

<!-- slide data-notes="" -->
### alsr保护
位址空间配置随机载入（英语：Address space layout randomization，缩写ASLR，又称位址空间配置随机化、位址空间布局随机化）是一种防范内存损坏漏洞被利用的计算机安全技术。位址空间配置随机载入利用随机方式配置资料定址空间，使某些敏感资料（例如作业系统内核）配置到一个恶意程式无法事先获知的位址，令攻击者难以进行攻击。（维基百科）
<!-- slide data-notes="" -->
即使开启地址随机化，也不是全随机的。对于linux来说，开启ASLR，libc的基地址在每一次启动时都会变化，但是libc本身是整块存入内存的。即libc中指令相对于其基地址的偏移是不会变化的。而libc本身的指令是足够getshell的，所以要对抗ASLR，可以从泄露libc基地址下手。
<!-- slide data-notes="" -->
### 影响
- libc基地址变动
- gadgets的地址难以确认。
<!-- slide data-notes="" -->
ldd <binary>查看libc地址，发现每一次都有变动。
```c#
~/Documents/pwnkr/bof $ ldd bof
	linux-gate.so.1 =>  (0xf7777000)
	libc.so.6 => /lib/i386-linux-gnu/libc.so.6 (0xf7599000)
	/lib/ld-linux.so.2 (0x5662b000)
~/Documents/pwnkr/bof $ ldd bof
	linux-gate.so.1 =>  (0xf7720000)
	libc.so.6 => /lib/i386-linux-gnu/libc.so.6 (0xf7542000)
~/Documents/pwnkr/bof $ ldd bof
	linux-gate.so.1 =>  (0xf775d000)
	libc.so.6 => /lib/i386-linux-gnu/libc.so.6 (0xf757f000)
	/lib/ld-linux.so.2 (0x565c1000)

```
<!-- slide data-notes="" -->
### 应对方法
- 泄露libc地址
### for example
- 用write(1,got.write(),4)打印write()函数的实际地址，通过偏移来算libc.so的基地址，进而算出system()的真实地址。
- libc_addr = write_addr - write_offset
- system_addr = libc_addr + system_offset

<!-- slide data-notes="" -->
## Memory Leak & DynELF
DynELF是pwntools提供的一个模块，可以帮助我们在没有libc文件时找到system()的地址。
### 使用
DynELF(leak,elf=ELF('<binary>')).lookup('system','libc')
> leak，需要自己实现的函数，在此函数中至少要泄漏一个字节的内存。

<!-- slide data-notes="" -->
### leak()的形式
```python
def leak(address):
  ...
  return data
```
<!-- slide data-notes="" -->
### 还有"/bin/sh"
需要注意的是，DynElF无法搜索到"/bin/sh"的地址，这里可以用一个read()把"/bin/sh"写到bss段上。
<!-- slide data-notes="" -->
### 32位栈溢出和64位的区别
- 内存地址范围从32位增加到64位
- 函数参数的传递由压栈传参变成了先由寄存器传参，依次是RDI，RSI，RDX，RCX，R8和 R9，不够用时才会通过栈来传递
- 内存地址不大于0x00007fffffffffff，否则抛出异常。

### 64位下re2libc
- buffer + pop_rdi_ret + binsh_addr + system()
  或者buffer + pop_rax_pop_rdi_call_rax + system() + binsh_addr 
### 主要的gadget
- 传参（pop xxx,ret）
- 系统调用函数（system（），exce（））
<!-- slide data-notes="" -->
### 寻找gadget的工具
ROPgadeget
> $ ROPgadget --binary <binary> --only "pop|ret" 
```c#
~/Documents/pwnkr/bof $ ROPgadget --binary bof --only "pop|ret"
Gadgets information
============================================================
0x000005ee : pop ebp ; ret
0x00000624 : pop ebx ; pop ebp ; ret
0x000005ec : pop ebx ; pop esi ; pop ebp ; ret
0x0000070c : pop ebx ; pop esi ; pop edi ; pop ebp ; ret
0x000004a0 : pop ebx ; ret
0x0000070e : pop edi ; pop ebp ; ret
0x000005ed : pop esi ; pop ebp ; ret
0x0000070d : pop esi ; pop edi ; pop ebp ; ret
0x0000047f : ret

Unique gadgets found: 9
```
程序比较小时，gadget的数量也不多，也可以考虑搜索libc.so中的gadget，可用的很多。
<!-- slide data-notes="" -->
能够泄漏libc基地址时，使用libc的gadget更加方便和容易，libc上可用的gadget就很丰富了。
```s
$ ROPgadget --binary /lib/i386-linux-gnu/libc.so.6  --only "pop|ret"
...
Unique gadgets found: 1226

```
<!-- slide data-notes="" -->

<!-- slide data-notes="" -->