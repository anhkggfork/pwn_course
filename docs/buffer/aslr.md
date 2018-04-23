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
# alsr保护
<!-- slide data-notes="" -->
## alsr
位址空间配置随机载入（英语：Address space layout randomization，缩写ASLR，又称位址空间配置随机化、位址空间布局随机化）是一种防范内存损坏漏洞被利用的计算机安全技术。位址空间配置随机载入利用随机方式配置资料定址空间，使某些敏感资料（例如作业系统内核）配置到一个恶意程式无法事先获知的位址，令攻击者难以进行攻击。（维基百科）

<!-- slide data-notes="" -->
## alsr
```c#
lometsj@ubuntu:~$ ldd test
	linux-gate.so.1 =>  (0xf7f1a000)
	libc.so.6 => /lib/i386-linux-gnu/libc.so.6 (0xf7d40000)
	/lib/ld-linux.so.2 (0xf7f1c000)
lometsj@ubuntu:~$ ldd test
	linux-gate.so.1 =>  (0xf7f0c000)
	libc.so.6 => /lib/i386-linux-gnu/libc.so.6 (0xf7d32000)
	/lib/ld-linux.so.2 (0xf7f0e000)
lometsj@ubuntu:~$ ldd test
	linux-gate.so.1 =>  (0xf7f37000)
	libc.so.6 => /lib/i386-linux-gnu/libc.so.6 (0xf7d5d000)
	/lib/ld-linux.so.2 (0xf7f39000)
lometsj@ubuntu:~$ ldd test
	linux-gate.so.1 =>  (0xf7f2c000)
	libc.so.6 => /lib/i386-linux-gnu/libc.so.6 (0xf7d52000)
	/lib/ld-linux.so.2 (0xf7f2e000)
```
<!-- slide data-notes="" -->
## alsr
传统攻击需要精确的地址
- 基础栈溢出：需要定位shellcode
- return-to-libc： 需要libc地址
问题：程序的内存布局是固定的
解决方案：随机化每个区域的地址
<!-- slide data-notes="" -->
## alsr
Aspect|aslr
----|----
表现|优异-每次加载都会随机
发布|获得内核支持，不需要重新编译
兼容性|对安全应用程序透明（位置独立）
保护效果|64位下效果显著
<!-- slide data-notes="" -->
## alsr
### unbuntu-alsr默认开启
```
$ cat /proc/sys/kernel/randomize_va_space
2
```
该值为：
- 1:随机化对战，VDSO，共享内存区域的位置
- 2:同上，并添加数据段的随机
- 0:禁用alsr
<!-- slide data-notes="" -->
## 绕过方法
- 暴力绕过
<!-- slide data-notes="" -->
## 暴力绕过
- 使用大量NOP填充shellcode，提高地址命中率，并暴力搜索栈的地址
payload： nop*n + shellcode
```
--->    |
--->    |
--->    |
--->
--->
--->
--->
--->
--->
--->
--->
```

<!-- slide data-notes="" -->

<!-- slide data-notes="" -->

<!-- slide data-notes="" -->

<!-- slide data-notes="" -->

<!-- slide data-notes="" -->

<!-- slide data-notes="" -->

<!-- slide data-notes="" -->

<!-- slide data-notes="" -->

<!-- slide data-notes="" -->

<!-- slide data-notes="" -->

<!-- slide data-notes="" -->

<!-- slide data-notes="" -->
