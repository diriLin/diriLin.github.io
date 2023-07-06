---
title: CUDA-C 学习笔记
date: 2023-07-04 23:54:15
categories: Learning
tags: cuda
mathjax: true
---

猛摆烂，又开一坑。看的书是[Professional CUDA C Programming](https://www.amazon.com/Professional-CUDA-Programming-John-Cheng/dp/1118739329), 然后参考[谭升的博客](https://face2ai.com/program-blog/#GPU%E7%BC%96%E7%A8%8B%EF%BC%88CUDA%EF%BC%89)（在CUDA-C学习笔记系列中简称“博客”），我觉得肯定比我讲得好得多，因此我写的只供自己记录用。在这篇发布的时候，我只看到了Chapter3, 因此可能很多理解尚需完善。

> 题外话，我觉得一上来就整些高屋建瓴的话其实没什么用，这些话懂得自然懂，不懂的该学还是要学，直接开干就完事了。

## Chapter 1: Heterogeneous Parallel Computing with CUDA

使用CPU+GPU的异构方式来处理并行计算任务：

<img src="https://raw.githubusercontent.com/diriLin/blog_img/main/20230705011539.png" style="zoom: 50%;" />

程序猿要做的事情是：

+ 在主机(host, CPU)上编写并运行程序，准备并行计算的指令和数据
+ 将并行计算数据通过总线发送到设备(device, GPU)上
+ 调用核函数，让设备进行并行计算
+ 将计算结果下载回主机

为什么要做大规模的并行计算，为什么不用CPU做大规模的并行计算而用GPU，这里不再赘述（可以参考[博客](https://face2ai.com/program-blog/#GPU%E7%BC%96%E7%A8%8B%EF%BC%88CUDA%EF%BC%89)）。但是，这说明设备（的架构）是很重要的，因此在编写并行计算程序的时候，需要根据GPU的架构和性质尽量压榨其并行能力。

最后，nvidia的显卡被广泛应用于高性能计算领域，而CUDA是建立在nvidia GPU上的平台，提供了大量API供程序猿操作设备完成计算，这就是需要学习CUDA的原因。

## Chapter 2: CUDA Programming Model

这章讲CUDA的编程模型。CUDA-C的程序大概这样：

<img src="https://raw.githubusercontent.com/diriLin/blog_img/main/20230705094911.png" style="zoom: 33%;" />

主进程运行在主机上，并行计算的数据准备好后：

+ 将并行计算数据通过总线发送到设备(device, GPU)上
+ 调用核函数，让设备进行并行计算

这时主进程将立刻去做其他事（异步）。计算结束后，将计算结果下载回主机。这三件事情是和GPU相关的，因此需要用到CUDA runtime API. 

### 在设备之间复制数据

将数据发送到设备上，其实就是在设备上分配一块内存（malloc），然后将主机上的数据复制过去（memcpy），CUDA-C中进行这两个操作的API和C语言很像，但稍有不同：

```c
cudaError_t cudaMalloc(void **devPtr,size_t nByte);
cudaError_t cudaMemcpy(void * dst,const void * src,size_t count, cudaMemcpyKind kind)
```

比如为长度为1024个元素的浮点数组`float *data`分配，执行的语句是：

```c
cuda cudaMalloc(&data, 1024*sizeof(float));
```

因为需要将设备上的内存地址写入`data`变量，所以这里需要传入它的指针。

`cudaMemcpy`的前面三个参数无需赘述，最后一个枚举变量参数指明了复制数据的***方向***：

+ cudaMemcpyHostToHost
+ cudaMemcpyHostToDevice
+ cudaMemcpyDeviceToHost
+ cudaMemcpyDeviceToDevice

比如将主机上长度为1024的浮点数组`h_data`的数据复制到设备上浮点数组`d_data`中：

> 主机上的空间用`h_`开头，而设备上的用`d_`，书中约定如此，这里也照搬。

```c
cudaMemcpy(d_data, h_data, 1024 * sizeof(float), cudaMemcpyHostToDevice);
```

`cudaMemcpy`关系到主机与设备的数据交换，因此隐式地进行了同步。如果需要显式的同步，需要调用`cudaDeviceSynchronize()`. 在设备上申请到的内存最后要调用`cudaFree(void *ptr)`进行释放.

最后说下返回类型`cudaError_t`，如果函数成功执行，则返回`cudaSuccess`，否则返回对应的错误类型，可以使用函数`char* cudaGetErrorString(cudaError_t error)`来将错误类型转化为方便阅读的字符串。

### 核函数（kernel）

核函数就是在设备上运行的函数。有必要先看一下CUDA编程模型提供的线程层次抽象：

<img src="https://raw.githubusercontent.com/diriLin/blog_img/main/20230705105946.png" style="zoom:33%;" />

核函数在在设备上的一个网格（Grid）里面执行，网格由块（Block）组成，可以看做三维的块数组，而块又可以看成线程的三维数组。

> 虽然图上展示的是二维。而且物理上都是一维的。

然后是内存抽象：

<img src="https://raw.githubusercontent.com/diriLin/blog_img/main/20230705110209.png" style="zoom:33%;" />

除了全局内存之外，块内存在共享内存，可以被块内的线程访问。

> 但就我看到前三章的部分来说，都在按照线程的索引计算位于全局内存中数组的位置，没咋看到用共享内存。

然后才是核函数的定义和调用。核函数是这样被调用的：

```c
function_name<<<grid, block>>>(argument_list);
```

其中`grid`可以是整数，也可以是一个`dim3`结构体，指明了这次调用的网格是什么形状的三维块数组，同理`block`也指明了这次调用的网格是什么形状的三维线程数组。

核函数在定义时的函数头是这样的：

```c
RETURN_TYPE QUALIFIER function_name(argument_list);
```

其中限定符`QUALIFIER`指明了函数可以在什么样的设备上执行：

| 限定符      | 执行       | 调用                                          | 备注                     |
| ----------- | ---------- | --------------------------------------------- | ------------------------ |
| \__global__ | 设备端执行 | 可以从主机调用也可以从计算能力3以上的设备调用 | 必须有一个void的返回类型 |
| \__device__ | 设备端执行 | 设备端调用                                    |                          |
| \__host__   | 主机端执行 | 主机调用                                      | 可以省略                 |

在定义函数的时候可以访问这些被预定义的变量：

+ `blockIdx` 当前线程所在的块，在网格中的三维索引
+ `threadIdx` 当前线程在块中的三维索引
+ `gridDim` 网格的形状，如果在调用时直接传入一个整数`g`，则为`(g,1,1)`
+ `blockDim` 块的形状

> 然后就可以根据这些信息来计算某一线程应该处理数组的哪个部分之类的……

### 核函数调用计时

两种方法。一种是记录调用前的CPU时间戳，调用执行结束后主机显式同步，然后记录执行结束的CPU时间戳。

```c
iStart = cpuSecond(); 
sumMatrixOnGPU2D <<< grid, block >>>(d_MatA, d_MatB, d_MatC, nx, ny);
cudaDeviceSynchronize(); 
iElaps = cpuSecond() - iStart;
```

另一种是查看nvidia的工具nvprof：

```shell
$ nvprof ./sumArraysOnGPU-timer
./sumArraysOnGPU-timer Starting... 
Using Device 0: Tesla M2070 
==17770== NVPROF is profiling process 17770, command: ./sumArraysOnGPU-timer 
# 程序输出balabala
==17770== Profiling application: ./sumArraysOnGPU-timer 
==17770== Profiling result: 
Time(%) Time Calls Avg Min Max Name 
70.35% 52.667ms 3 17.556ms 17.415ms 17.800ms [CUDA memcpy HtoD] 
25.77% 19.291ms 1 19.291ms 19.291ms 19.291ms [CUDA memcpy DtoH] 
3.88% 2.9024ms 1 2.9024ms 2.9024ms 2.9024ms sumArraysOnGPU 
(float*, float*, int)
```

后者更加准确，但前者可以在runtime得到报告。

然后书本举了几个例子，使用不同的grid shape和block shape处理相同矩阵加法问题，引出：

+ 不同的config之间存在运行时间的差异（需要上述测量手段）
+ 如何寻找更好的config？靠盲猜太不科学，也浪费很多时间和计算资源。
  + CUDA程序必须根据设备的硬件特性编写

然后给了一堆查runtime和`nvidia-smi`的查信息方法，这里就不赘述了。

其实我这个东西写到现在非常摆，基本没怎么沾硬件，但既然要根据硬件特性来编写，那么更深入地了解n卡是逃不掉的。
