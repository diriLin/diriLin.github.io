---
title: CUDA-C 学习笔记：执行模型
date: 2023-07-06 11:24:35
categories: Learning
tags: cuda
mathjax: true 
---

上一个章节提到，可以通过改变grid和block的形状来获取更好的性能，书中提供的例子是直接比较各个config，选更好的那个。但如果想要更好的方法来指导我们设计这些config，我们就必须从硬件以及线程（束）调度的角度更加深入地了解CUDA. 

## The Fermi Architecture

Fermi架构是第一个完整的GPU架构，n卡架构的老祖宗，而且也相对简单。

<img src="https://raw.githubusercontent.com/diriLin/blog_img/main/20230706114807.png"  />

其中的结构

<img src="https://raw.githubusercontent.com/diriLin/blog_img/main/20230706115113.png" style="zoom:67%;" />

被称为流处理器(stream multiprocessor, SM) ，上面有若干计算资源，比如：

+ cuda 核
+ 共享内存/一级缓存
+ 寄存器堆
+ Load/Store单元
+ 特殊功能单元
+ ***线程束调度器***
  + Block内每32个线程被划分为一个线程束（warp）

执行模型保证：

+ 当block被分配到SM上之后，就不可能重新分配到其他SM上运行

+ 当block被分配到SM上之后，块上的线程***独占***的资源：

  + 指令地址计数器
  + 寄存器上下文等

  只有到block结束生命周期时才释放，因此切换线程的开销很低。

### SIMT（单指令多线程）

字面意思就是一个指令在多个线程上执行，具体地说，“多个线程”指的是***同一个线程束***上的线程。每次，线程束调度器选取一个线程束，这个线程束中的线程此前都执行到同一个指令地址，此刻开始它们同步地执行下一条指令，直至线程束被换下。

如果需要执行分支指令，而且线程束中存在某些线程的分支跳转结果不同，如`if(1)`和`if(0)`，那么（假设先执行1）在执行`if(1)`线程的指令时，`if(0)`的线程将空转，执行完1的分支后，0的分支反之亦然，这保证了分支结束后的指令能够同步执行。

也因为这样，同一个线程束内最好不要产生分支，这会造成较大的延迟。

## The Kepler Architecture

开普勒架构出现在费米架构之后。除了计算资源变多之外，结构上主要的不同在于：

+ 费米架构的grids组成单队列等待分配，但开普勒架构可以有多个队列，因此开普勒架构在核函数之间也可以存在并行（Hyper-Q）
+ 费米架构的kernel必须从host启动，但开普勒架构的kernel可以自行启动新的kernel（dynamic parallelism）
