#### heap3
```
int __cdecl main(int argc, const char **argv, const char **envp)
{
  char *dest; // ST10_4@1
  char *v4; // ST14_4@1
  char *v5; // ST18_4@1

  dest = (char *)malloc(0x20u);
  v4 = (char *)malloc(0x20u);
  v5 = (char *)malloc(0x20u);
  strcpy(dest, argv[1]);
  strcpy(v4, argv[2]);
  strcpy(v5, argv[3]);
  free(v5);
  free(v4);
  free(dest);
  puts("dynamite failed?");
  return 0;
}
int winner()
{
  time_t v0; // eax@1

  v0 = time(0);
  return printf("that wasn't too bad now, was it? @ %d\n", v0);
}
```
不难看出此题的意图是让我们覆盖got表为函数winner()的地址，控制程序执行流。
这里可以选择把puts()改写，所以首先获取要改写的地址和要改写的值（winner()的地址）。
```
$ objdump -d heap3 | grep winner
080484fb <winner>:
$ objdump -R heap3 | grep puts
0804a020 R_386_JUMP_SLOT   puts@GLIBC_2.0

```
这里涉及三个堆块的连续分配和释放，其中有strcpy()存在溢出漏洞，因为是连续分配，这里很容易想到的用unlink来实现任意地址写。
unlink即是通过溢出伪造堆块，使得在free()执行时向伪堆块unlink，从而实现任意地址写的技术。
这里先尝试在第二个堆块赋值时溢出到第三个堆块。