# <center>afl-fuzz实验1</center>

## 实验概述

### 【目的】
熟悉afl-fuzz的安装，对vulnerable.c 程序进行模糊测试，找到程序的漏洞。
### 【环境】
Linux
### 【工具】
afl-fuzz
### 【原理】
模糊测试 （fuzz testing, fuzzing）是一种软件测试技术。其核心思想是自动或半自动的生成随机数据输入到一个程序中，并监视程序异常，如崩溃，断言(assertion)失败，以发现可能的程序错误，比如内存泄漏。模糊测试常常用于检测软件或计算机系统的安全漏洞。
## 实验步骤

### 【步骤】
安装一些依赖
```
$ sudo apt-get install clang-3.8 build-essential llvm-3.8-dev gnuplot-nox

```
切换软件版本
```
$ sudo update-alternatives --install /usr/bin/clang clang `which clang-3.8` 1
$ sudo update-alternatives --install /usr/bin/clang++ clang++ `which clang++-3.8` 1
$ sudo update-alternatives --install /usr/bin/llvm-config llvm-config `which llvm-config-3.8` 1
$ sudo update-alternatives --install /usr/bin/llvm-symbolizer llvm-symbolizer `which llvm-symbolizer-3.8` 1
```

让系统不干扰crash检测
```
$ echo core | sudo tee /proc/sys/kernel/core_pattern
```
获取afl
```
$ cd
$ wget http://lcamtuf.coredump.cx/afl/releases/afl-latest.tgz
$ tar xvf afl-latest.tgz
```
构建
```
$ cd afl-2.52b   # replace with whatever the current version is
$ make
$ make -C llvm_mode
$ sudo make install
```
切到本次实验的附件目录下。
```
~$ cd afl1
~/afl1$ ls
Makefile  vulnerable.c

```
这里先查看Makefile
```
$ cat Makefile 
# Enable debugging and suppress pesky warnings
CFLAGS ?= -g -w

all:	vulnerable

clean:
	rm -f vulnerable

vulnerable: vulnerable.c
	${CC} ${CFLAGS} vulnerable.c -o vulnerable

```
可以看到这里用${CC}对c文件进行编译，编译选项是`-g -w`，输出vulnerable二进制可执行文件。
因为我们要使用fuzz测试，所以这里要使用afl-clang代替clang对c文件进行编译。
```
$ CC=~/afl-2.52b/afl-clang-fast AFL_HARDEN=1 make
/home/lometsj/afl-2.52b/afl-clang-fast -g -w vulnerable.c -o vulnerable
afl-clang-fast 2.52b by <lszekeres@google.com>
afl-llvm-pass 2.52b by <lszekeres@google.com>
[+] Instrumented 14 locations (hardened mode, ratio 100%).

```
调用afl-fuzz，在调用之前需要创建输入和输出文件夹，并在输入文件中创建一个输入样例。
```
$mkdir in out
$echo "ec echo" > in/a
$afl-fuzz -i in -o out ./vulnerable
```
之后就会进行自动的fuzz
```

                     american fuzzy lop 2.52b (vulnerable)

┌─ process timing ─────────────────────────────────────┬─ overall results ─────┐
│        run time : 0 days, 0 hrs, 8 min, 24 sec       │  cycles done : 2401   │
│   last new path : 0 days, 0 hrs, 8 min, 24 sec       │  total paths : 4      │
│ last uniq crash : 0 days, 0 hrs, 7 min, 25 sec       │ uniq crashes : 1      │
│  last uniq hang : none seen yet                      │   uniq hangs : 0      │
├─ cycle progress ────────────────────┬─ map coverage ─┴───────────────────────┤
│  now processing : 2 (50.00%)        │    map density : 0.01% / 0.02%         │
│ paths timed out : 0 (0.00%)         │ count coverage : 1.00 bits/tuple       │
├─ stage progress ────────────────────┼─ findings in depth ────────────────────┤
│  now trying : havoc                 │ favored paths : 4 (100.00%)            │
│ stage execs : 383/384 (99.74%)      │  new edges on : 4 (100.00%)            │
│ total execs : 2.62M                 │ total crashes : 6 (1 unique)           │
│  exec speed : 5377/sec              │  total tmouts : 7 (4 unique)           │
├─ fuzzing strategy yields ───────────┴───────────────┬─ path geometry ────────┤
│   bit flips : 2/128, 1/124, 0/116                   │    levels : 2          │
│  byte flips : 0/16, 0/12, 0/4                       │   pending : 0          │
│ arithmetics : 0/892, 0/22, 0/0                      │  pend fav : 0          │
│  known ints : 0/88, 0/335, 0/176                    │ own finds : 3          │
│  dictionary : 0/0, 0/0, 0/0                         │  imported : n/a        │
│       havoc : 1/2.62M, 0/0                          │ stability : 100.00%    │
│        trim : 71.43%/3, 0.00%                       ├────────────────────────┘
^C────────────────────────────────────────────────────┘          [cpu001: 66%]


```
我们可以在out的crash目录下查看发生crash时的输入,分析程序的漏洞。
```
/out/crashes$ ls
id:000000,sig:06,src:000003,op:havoc,rep:128
id:000001,sig:06,src:000000,op:havoc,rep:32
id:000002,sig:11,src:000001,op:havoc,rep:2
README.txt
$ cat id\:000002\,sig\:11\,src\:000001\,op\:havoc\,rep\:2 
ec%s
```
说明在输入ec%s时会触发异常，切回程序源代码查看。
```
#include <string.h>
#include <stdio.h>
#include <unistd.h>
#include <stdlib.h>

int main(int argc, char *argv[])
{
	char input[100] = {0};
	char *out;

	// Slurp input
	if (read(STDIN_FILENO, input, 100) < 0) {
		fprintf(stderr, "Couldn't read stdin.\n");
	}
	if(input[0] == 'c') { 
		// count characters
		out = malloc(sizeof(input) - 1 + 3); // enough space for 2 digits + a space + input-1 chars
		sprintf(out, "%lu ", strlen(input) - 1);
		strcat(out, input+1);
		printf("%s", out);
		free(out);
	} else if ((input[0] == 'e') && (input[1] == 'c')) {
		// echo input
		printf(input + 2);
	} else if (strncmp(input, "head", 4) == 0) {
		// head
		if (strlen(input) > 5) {
			input[input[4]] = '\0'; // truncate string at specified position
			printf("%s", input+4);
		} else {
			fprintf(stderr, "head input was too small\n");
		}
	} else if (strcmp(input, "surprise!\n") == 0) {
		// easter egg!
		*(char *)1=2;
	} else {
		fprintf(stderr, "Usage: %s\nText utility - accepts commands on stdin and prints results to stdout:\n", argv[0]);
		fprintf(stderr, "\tInput           | Output\n");
		fprintf(stderr, "\t----------------+-----------------------\n");
		fprintf(stderr, "\tec<string>      | <string> (simple echo)\n");
		fprintf(stderr, "\thead<N><string> | The first <N> bytes of <string>\n");
		fprintf(stderr, "\tc<string>       | The length of <string>, followed by <string>\n");
	}
}
```
其中有
```
else if ((input[0] == 'e') && (input[1] == 'c')) {
		// echo input
		printf(input + 2);
```
明显的，当输入`ec`调用程序的显示字符串功能时，存在格式化字符串漏洞。
### 【总结】

这里主要对afl进行了初步的了解和熟悉。
可以发现，格式化字符串漏洞发生的原因是程序将格式化字符串的权限交给用户，即用户可以操作格式化字符串的内容。

要预防这类情况，在使用格式化字符串函数时，format参数的权限一定不能交给用户。