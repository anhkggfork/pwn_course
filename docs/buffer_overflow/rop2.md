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
## ret2__libc_scu_init

`__libc_scu_init()`用于对libc进行初始化操作的函数，只要使用了libc函数就一定会有此函数出现，而绝大多数的程序都会调用libc的函数，即`__libc_scu_init()`广泛存在于linux程序中。
`__libc_scu_init()`中的gadget也可以作为通用gadget。
<!-- slide data-notes="" -->
```s
#!bash
.text:00000000004005C0 ; void _libc_csu_init(void)
.text:00000000004005C0                 public __libc_csu_init
.text:00000000004005C0 __libc_csu_init proc near               ; DATA XREF: _start+16o
.text:00000000004005C0                 push    r15
.text:00000000004005C2                 push    r14
.text:00000000004005C4                 mov     r15d, edi
.text:00000000004005C7                 push    r13
.text:00000000004005C9                 push    r12
.text:00000000004005CB                 lea     r12, __frame_dummy_init_array_entry
.text:00000000004005D2                 push    rbp
.text:00000000004005D3                 lea     rbp, __do_global_dtors_aux_fini_array_entry
.text:00000000004005DA                 push    rbx
.text:00000000004005DB                 mov     r14, rsi
.text:00000000004005DE                 mov     r13, rdx
.text:00000000004005E1                 sub     rbp, r12
.text:00000000004005E4                 sub     rsp, 8
.text:00000000004005E8                 sar     rbp, 3
.text:00000000004005EC                 call    _init_proc
.text:00000000004005F1                 test    rbp, rbp
.text:00000000004005F4                 jz      short loc_400616
.text:00000000004005F6                 xor     ebx, ebx
.text:00000000004005F8                 nop     dword ptr [rax+rax+00000000h]
.text:0000000000400600
.text:0000000000400600 loc_400600:                             ; CODE XREF: __libc_csu_init+54j
.text:0000000000400600                 mov     rdx, r13
.text:0000000000400603                 mov     rsi, r14
.text:0000000000400606                 mov     edi, r15d
.text:0000000000400609                 call    qword ptr [r12+rbx*8]
.text:000000000040060D                 add     rbx, 1
.text:0000000000400611                 cmp     rbx, rbp
.text:0000000000400614                 jnz     short loc_400600
.text:0000000000400616
.text:0000000000400616 loc_400616:                             ; CODE XREF: __libc_csu_init+34j
.text:0000000000400616                 add     rsp, 8
.text:000000000040061A                 pop     rbx
.text:000000000040061B                 pop     rbp
.text:000000000040061C                 pop     r12
.text:000000000040061E                 pop     r13
.text:0000000000400620                 pop     r14
.text:0000000000400622                 pop     r15
.text:0000000000400624                 retn
.text:0000000000400624 __libc_csu_init endp 
```
<!-- slide data-notes="" -->
- 最后连续的6个pop，可以用栈溢出控制rbx，rbp，r12，r13，r14，r15
- 之后从400600开始可以控制到rdi（通过edi），rsi，rdx的值，并call[r12+rbx*8]。
通过上面的调用可以控制到三个传递参数的寄存器，并且执行一次call，完成ret2libc。
<!-- slide data-notes="" -->
## srop (Sigreturn Oriented Programming)
![](signal.jpg)
signal机制是一套被广泛应用于unix的机制，它通常用于系统在用户态和内核态切换，执行如杀死进程，设置进程定时器等功能。
如图所示，内核向进程发起signal。进程挂起，进入内核（1），内核为进程保存上下文，跳到signal handler，之后又返回内核态，上下文恢复，最后返回最初的进程。
<!-- slide data-notes="" -->
重点在第二步和第三步上，我们可以把signal handler理解为一个特殊的函数，这个函数返回地址是rt_sigreturn，在执行完signal handler，会返回到rt_sigretrun，而rt_sigreturn会将上下文参数恢复。下图是linux系统保存在栈上的上下文信息。
![](srop_frame.jpg)
<!-- slide data-notes="" -->
可以看到，寄存器的值作为上下文信息的一部分被保存在了栈上，而在rt_sigreturn 执行时又会把寄存器的值从栈上复制到寄存器中，从而恢复用户进程挂起之前的状态。其中，内核为用户恢复上下文时不会对栈上的上下文信息进行检查。意即，我们完全可以通过栈溢出伪造一个存储上下文信息的栈，通过rt_sigreturn将栈上的数据放到寄存器中。如下图
![](fake_frame.jpg)
那么此时当rt_sigreturn 执行完毕后，随后就会执行rip指向的 syscall（），并且以rax和rdi为参数。明显的，这个函数调用会弹出一个shell，攻击完成。
<!-- slide data-notes="" -->
## system call chains
如果栈上存放的rip指向的地址不仅仅是syscall()而是syscall(),ret的gadget，并且控制栈指针指向另一个Fake Signal Frame，可以生成一系列的signal调用。
！[](srop_chains.png)
