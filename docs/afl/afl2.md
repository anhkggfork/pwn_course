# AFL-Fuzz进阶

## 实验概述

### 【目的】
了解如何使fuzz可以进行，改写harness.c的代码对lib_echo()和lib_mul()fuzz。
### 【环境】
Linux
### 【工具】
afl-fuzz
### 【原理】
模糊测试 （fuzz testing, fuzzing）是一种软件测试技术。其核心思想是自动或半自动的生成随机数据输入到一个程序中，并监视程序异常，如崩溃，断言(assertion)失败，以发现可能的程序错误，比如内存泄漏。模糊测试常常用于检测软件或计算机系统的安全漏洞。
如何fuzz
1. 代码必须能执行，需要被编译成程序
2. 为了使AFl有效工作，需要用afl-clang-fast, afl-clang, 或者afl-gcc来编译。
3. 为了使AFl生成的数据能够测试library，我们需要编写一个harness来读取输入并喂给library，可以是命令行中制定的一个文件也可以是stdin标准输入。
## 实验步骤

### 【步骤】
查看harness.c的源代码。
```
#include "library.h"
#include <string.h>
#include <stdio.h>
void main() {
	char *data = "Some input data";
	lib_echo(data, strlen(data));
	printf("%d", lib_mul(1,2));
}
```
只是简单的调用了lib_echo()和lib_mul()，先直接编译并尝试fuzz。
```
$ afl-gcc harness.c library.c  -o harness -w
afl-cc 2.52b by <lcamtuf@google.com>
afl-as 2.52b by <lcamtuf@google.com>
[+] Instrumented 1 locations (64-bit, non-hardened mode, ratio 100%).
afl-as 2.52b by <lcamtuf@google.com>
[+] Instrumented 5 locations (64-bit, non-hardened mode, ratio 100%).
lometsj@lometsj-T5 ~/Documents/afl/afl-training/harness $ mkdir in out
$ echo "something" > in/a
$ afl-fuzz -i in -o out ./harness
afl-fuzz 2.52b by <lcamtuf@google.com>
[+] You have 8 CPU cores and 1 runnable tasks (utilization: 12%).
[+] Try parallel jobs - see /usr/local/share/doc/afl/parallel_fuzzing.txt.
[*] Checking CPU core loadout...
[+] Found a free CPU core, binding to #0.
[*] Checking core_pattern...
[*] Checking CPU scaling governor...
[*] Setting up output directories...
[+] Output directory exists but deemed OK to reuse.
[*] Deleting old session data...
[+] Output dir cleanup successful.
[*] Scanning 'in'...
[+] No auto-generated dictionary tokens to reuse.
[*] Creating hard links for all input files...
[*] Validating target binary...
[*] Attempting dry run with 'id:000000,orig:a'...
[*] Spinning up the fork server...
[+] All right - fork server is up.
    len = 10, map size = 4, exec speed = 135 us
[+] All test cases processed.

[+] Here are some useful stats:

    Test case count : 1 favored, 0 variable, 1 total
       Bitmap range : 4 to 4 bits (average: 4.00 bits)
        Exec timing : 135 to 135 us (average: 135 us)

[*] No -t option specified, so I'll use exec timeout of 20 ms.
[+] All set and ready to roll!
american fuzzy lop 2.52b (harness)

┌─ process timing ─────────────────────────────────────┬─ overall results ─────┐
│        run time : 0 days, 0 hrs, 0 min, 6 sec        │  cycles done : 217    │
│   last new path : none yet (odd, check syntax!)      │  total paths : 1      │
│ last uniq crash : none seen yet                      │ uniq crashes : 0      │
│  last uniq hang : none seen yet                      │   uniq hangs : 0      │
├─ cycle progress ────────────────────┬─ map coverage ─┴───────────────────────┤
│  now processing : 0 (0.00%)         │    map density : 0.01% / 0.01%         │
│ paths timed out : 0 (0.00%)         │ count coverage : 1.00 bits/tuple       │
├─ stage progress ────────────────────┼─ findings in depth ────────────────────┤
│  now trying : havoc                 │ favored paths : 1 (100.00%)            │
│ stage execs : 168/256 (65.62%)      │  new edges on : 1 (100.00%)            │
│ total execs : 57.0k                 │ total crashes : 0 (0 unique)           │
│  exec speed : 8431/sec              │  total tmouts : 0 (0 unique)           │
├─ fuzzing strategy yields ───────────┴───────────────┬─ path geometry ────────┤
│   bit flips : 0/32, 0/31, 0/29                      │    levels : 1          │
│  byte flips : 0/4, 0/3, 0/1                         │   pending : 0          │
│ arithmetics : 0/223, 0/0, 0/0                       │  pend fav : 0          │
│  known ints : 0/24, 0/84, 0/44                      │ own finds : 0          │
│  dictionary : 0/0, 0/0, 0/0                         │  imported : n/a        │
│       havoc : 0/56.3k, 0/0                          │ stability : 100.00%    │
│        trim : 60.00%/2, 0.00%                       ├────────────────────────┘
└─────────────────────────────────────────────────────┘          [cpu000: 23%]
```

在界面中process timing下的last new path有一个warning：none yet (odd, check syntax!)
要进行fuzz，需要用stdin输入到目标函数，这里可以用read()函数来从stdin读入。
```
	const int SIZE = 50;
	char input[SIZE] = {0};
	ssize_t length;
	length = read(0, input, SIZE);
	lib_echo(input, length);
```
这样就完成了对lib_echo()的调用改造。
那么lib_mul()可以同理。
```
    int a,b = 0;
	read(0, &a, 1);
	read(0, &b, 1);
	printf("%d", lib_mul(a,b));
```
用参数控制要fuzz哪个函数，整个代码如下。
```c
#include "library.h"
#include <unistd.h>
#include <string.h>
#include <stdio.h>
int main(int argc, char* argv[]) {
	if((argc == 2) && strcmp(argv[1], "echo") == 0) {
		// fixed size buffer based on assumptions about the maximum size that is likely necessary to exercise all aspects of the target function
		const int SIZE = 100;

		// make sure buffer is initialized to eliminate variable behaviour that isn't dependent on the input.
		char input[SIZE] = {0};

		ssize_t length;
		length = read(0, input, SIZE);

		lib_echo(input, length);
	} else if ((argc == 2) && strcmp(argv[1], "mul") == 0) {
		int a,b = 0;
		read(0, &a, 1);
		read(0, &b, 1);
		printf("%d", lib_mul(a,b));
	} else {
		printf("Usage: %s mul|echo\n", argv[0]);
	}
}
```
我们不需要用任何方式告诉afl-fuzz这个harness是干什么的，它就可以工作了，只是这里我们在harness增加了一些功能来指定哪个函数要被fuzz，现在要启动对某个函数的fuzz，就可以使用指令：
```
afl-fuzz -i in -o out ./harness mul
```
或者
```
afl-fuzz -i in -o out ./harness echo
```

### 【总结】

本次实验主要了解如何使函数可以被fuzz。
