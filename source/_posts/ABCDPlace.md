---
title: ABCDPlace
date: 2023-06-05 21:19:56
categories: Paper-reading
tags: EDA
mathjax: true
---

> 论文以及图片来源：[ABCDPlace: Accelerated Batch-Based Concurrent Detailed Placement on Multithreaded CPUs and GPUs | IEEE Journals & Magazine | IEEE Xplore](https://ieeexplore.ieee.org/abstract/document/8982049)

## 摘要

Placement可以分为GP, legalization以及DP(Detail Placement)三个部分，其中DP可能被反复invoke。ABCDPlace主要对DP的并行化提出了一些改进。

## PRELIMINARIES

优化的目标是HPWL，参见[Logic to Layout Week 5 | diri! (diri-lin.top)](https://diri-lin.top/Learning/EDA/Logic-to-Layout-Week-5/#Half-Perimeter-Wirelength-HPWL).

提到了三种用于DP的方法，分别是：

+ 独立集匹配（Independent Set Matching）。独立集中的任意两点在图上不相邻，即cells之间没有边连接，因此在优化HPWL时可以不考虑这些cells之间的关系。在独立集中寻找两个cells进行移动，仅需要考虑这些cells相连的nets的HPWL变化。寻找独立集之后可以得到一个二部图：

  <img src="https://raw.githubusercontent.com/diriLin/blog_img/main/20230605175206.png" style="zoom: 50%;" />

  左右两边是独立集中的对应元素（1和1'是同一个cell），而图上的边$(i,j')$权重定义为交换这两个cell对HPWL的改进，然后对二部图寻找最大权匹配，根据此匹配交换cells的位置来改进HPWL. 

+ 全局交换（Global Swap）。对特定的一个cell，在全局范围内寻找另一个cell使得它们交换之后对HPWL的改进最大，然后交换之。使用启发式的方法来寻找搜索区域。

+ 本地重排（Local Reordering）。***在同一个行内***，使用滑动窗口来选择$k$个cell，这$k$个cell可以形成$k!$个排列，然后在这些排列中寻找其中对HPWL最优的排列。由于复杂度是阶乘级别，$k$不会选得很大。

还提到了设计并行算法的时候必须考虑到GPU结构的性质：

<img src="https://raw.githubusercontent.com/diriLin/blog_img/main/20230606112656.png" style="zoom:50%;"/>

下面的算法伪代码中，`Parallel kernel`可以认为是在一个block内建立了各thread.

> 在写这个笔记的时候，我对GPU以及CUDA并不详细地了解，因此对这些部分的理解可能有偏差。

## 独立集匹配

### Parallel Maximal Independent Set Algorithm

作出让步，不寻找***最大***独立集，而是选择一个cell，求包含这个cell的***极大***独立集。

<img src="https://raw.githubusercontent.com/diriLin/blog_img/main/20230605165526.png" style="zoom: 50%;" />

在`while`循环的每一轮中，为点集$V$中的每个点(cell)$v$分配一个线程，这些线程共享存储。如果某轮中点$v$被加入独立集$I$，那么在随机排序$R$中排在$v$后面的点，要么之前就被从$G$中排除了，要么与$v$连接。考察独立集$I$的最终状态：
+ $v_{\arg\min R}$仅当它与所有点都相邻，才不会出现在$I$中；
+ 否则其余点必不与$v_{\arg\min R}$相邻，不然它们将在最后一轮被除去。

至于：
  + “极大”性质
  + 最多需要$O(\log^2n)$轮

的证明，参考[[1202.3205\] Greedy Sequential Maximal Independent Set and Matching are Parallel on Average (arxiv.org)](https://arxiv.org/abs/1202.3205). 

### Parallel Partitioning With Balanced K-Means Clustering

极大独立集会比较大，求解最大权匹配时耗时比较长，因此把它分为$K$个簇，每个簇都是独立集，然后对每个簇和簇的余集求最大权匹配并优化。正常的Kmeans聚类的目标是寻找$K$​个点求下列目标的优化：
$$
\min\sum_{i=1}^{K}\sum_{x\in S_i}||x-\mu_i||
$$
但这会导致各个簇的大小不均匀，因此采用
$$
\min\sum_{i=1}^{K}\sum_{x\in S_i}w_i||x-\mu_i|| \\
w_i^{k+1}\leftarrow w_i^k\times(1+0.5\log(\max\{1, |S_i|/s_t\}))
$$
的优化目标，其中$S_i$是属于中心$i$的簇，$s_t$是簇的期望大小，通常取128.

### Batch Solving for Linear Assignment Problems

对最大权匹配问题，ABCDPlace采取的解法是拍卖算法（算法的思想可以参考[最优分配问题-拍卖算法_Anker_Evans的博客](https://blog.csdn.net/Anker_Evans/article/details/106539488)）：

<img src="https://raw.githubusercontent.com/diriLin/blog_img/main/20230606115342.png" style="zoom: 50%;" />

拍卖算法分为竞价（bid）和分配（assign）两步。在竞价阶段，各出价人（寻找新位置的cell）互不干扰；在分配阶段，各待分配物品（cell原先占据的位置）互不干扰，因此可以通过建立threads来并行计算，并采取批处理的方式减少反复launch kernel导致overhead过大的问题：

<img src="https://raw.githubusercontent.com/diriLin/blog_img/main/20230606142410.png" style="zoom:50%;" />

本文采取$\epsilon_{\max}=10, \epsilon_{\min}=1, \gamma=0.1$来控制算法的结束条件。

## 全局交换

串行的全局交换算法：

<img src="https://raw.githubusercontent.com/diriLin/blog_img/main/20230606211151.png" style="zoom:50%;" />

时间开销的主要部分是`CalcSwapCosts`和`CollectCands`：

<img src="https://raw.githubusercontent.com/diriLin/blog_img/main/20230607162449.png" style="zoom:50%;" />

并行版本的算法：

<img src="https://raw.githubusercontent.com/diriLin/blog_img/main/20230606211911.png" style="zoom:50%;" />

`CalcSearchBox`提供搜索区域，具体来说：

> In the experiment, the search region for one cell is set to one bin, whose ***width and height are around three-row height.***

`CalcSwapCosts`和`CollectCands`一起并行执行。具体地说：

<img src="https://raw.githubusercontent.com/diriLin/blog_img/main/20230606212527.png" style="zoom:50%;" />

对于一个cell（比如蓝色的1）建立多个threads，每个thread选择一个candidate并计算交换改进，为下一步`FindBestCand`做准备。

最后的`ApplyCand`可能存在依赖关系，比如a/b都决定和c交换，因此不能够并行的执行，但是这一步并不是性能的瓶颈。

## 本地重排

<img src="https://raw.githubusercontent.com/diriLin/blog_img/main/20230607162735.png" style="zoom:50%;" />

本文通过三个方面来提高本地重排算法的并行度：

+ 并行枚举：长度为$k$的滑动窗口内，并行计算$k!$个排列的HPWL（或者改进）。由于$k!$不大，这并不能在GPU上很好地提升速度。
+ 并行窗口：如上图Step1所示，多个窗口内的重排互不相关，因此可以进行并行。
+ 独立行组：如上图(b)所示，row1和row4没有cell直接被net连接，将他们放到一个组内。
