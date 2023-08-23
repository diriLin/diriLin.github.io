---
title: VLSI Physical Design - Partition
date: 2023-08-23 16:10:34
categories: Learning
tags: EDA
mathjax: true
---

很久没有再更新UIUC的Logic to Layout了，也不准备再继续更新下去，因为layout的部分我打算看书学习了，感觉看书的速度应该会比看视频快些。书本选取的是Andrew B. Kahng等人所著的***VLSI Physical Design: From Graph Partitioning to Timing Closure***. 书本从第二章开始，根据Paritioning -> Chip Planning -> Placement -> Routing的顺序来展开，和比较常见的flow的顺序一致，最后补充Timing的内容。

第一章讲的是一些比较基础的概念，这里摘录一部分。图论的：

+ 超边（Hyperedge）：连接2个或以上顶点的边。net可能连接2个以上的pin，因此超边比连接两个顶点的边更符合net实际情况。
+ 超图（Hypergraph）：边集里面的边是超边的图。
+ 直线最小生成树（RMST，rectilinear minimum spanning tree）：最小生成树，但是曼哈顿距离。
+ 斯坦纳树（Steiner Tree）：听过但没了解过，以后再来补充。

EDA的：

+ Component：电路的基本功能元件，比如晶体管/电容

+ Module：component的集合。

+ Block：Module with shape.

+ Cell：逻辑和功能的基本元件，比如AND gate. 

  > 我参加的比赛里面netlist不会指明哪种component，只有library里的standard cell和macro, 所以我个人理解Physical Design里面更多时候谈到的是cell. 

+ Standard Cell：带有确定的逻辑功能的cell，高度（不是3d意义上的，而是2d）一般是行高的整数倍，place的时候按行对齐。

+ Macro (cell)：逻辑尚未确定的cell。也就是说逻辑可以很复杂，可以由很多standard cell组成，因此面积会比较大。

  > 一般Macro和Block会混谈。

+ Pin：引脚

+ via：通孔



## Partitioning

就是指把顶点集$V$划分成为多个子集。

> 划分仅仅是一种手段而已，目的可以非常不同，因此优化的目标也可以非常不同。书中是将它作为层次化设计和降低集成电路复杂度的手段来使用，在一个2D的平面上分开几个大的区域（Block），block之间的连接尽量地简化，那么设计人员只需负责自己负责的block就好了。
>
> 但是在我参加的比赛中，3D Circuit被分为两个die，所有的cell/macro必须物理地分到两个die上去，一切以最后的total hpwl为准，因此两个die之间的连接并不总是越少越好。

### 优化目标

按照书上的划分目的，自然是最小化cut edges set的权重
$$
\sum_{e\in\Phi}w(e),\ \Phi\text{ is the cut set.}
$$
如果划分得到子集非常不平衡，某些子集只有少数几个cell，似乎可以很好地最小化目标，但这没有达到划分的目的，因此还需要约束子集之间的大小关系，使它们的面积比较接近。

### Kernighan-Lin Algorithm

算法的输入是一个网表$G=(V,E)$；输出一个划分，将$V$划分为两个大小相等的子集$A,B(|A|=|B|)$，优化目标是割集的权重。KL算法基于迭代和交换，并不保证给出最优解。

> 其实Physical Design的大部分情况都这样。即使某个环节的某个算法强求最优，在全局的目标上也不一定是最优的，因此optimal solution就好。

算法的流程就是，对一个划分$A,B(|A|=|B|)$，每一轮尽力找出一些交换，如果这些交换减小了cut size，就确认进行这些交换然后下一轮。如果尽力了仍然不能减少cut size，那么算法结束。

在一个轮次中，算法寻找一个交换的序列来执行。cell a和cell b的交换被加入序列后，它们就不允许在后续的交换中出现（fixed），以防循环。这样，算法每次寻找一个最大程度上减小cut size（最大化收益gain）的交换，放入序列之后将他们fix，更新状态，然后寻找继续寻找下一个交换。

那么收益怎么计算呢？算法要求首先计算将一个节点v从当前子集移动到另一子集的引起的变化$D(v)$​，其被定义为（与v相连的割边权重和） - （与v相连的非割边权重和），因为移动之后，此前的割边就从割集中被去除，而非割边成为了割边。

那么一对交换的收益就是
$$
\Delta g(a,b)=D(a)+D(b)-2w(a,b)
$$
减去的部分是被重复计算的边权重。整个算法的过程：

<img src="https://raw.githubusercontent.com/diriLin/blog_img/main/20230823174927.png" style="zoom: 50%;" />

算法可以做扩展使得其可以应用于不平衡划分、节点权重不等、多路划分等情况，这里不展开。

### Fiduccia-Mattheyses (FM) Algorithm

对KL算法进行了如下改进：

+ 不再基于交换，而是基于一个节点的移动。

  + 交换增益被移动增益取代，移动增益$\Delta g(v)$被定义为（在v所在的分区内仅连接v的割边权重和）-（连接v的非割边权重和）。
  + 天然地适合不平衡划分。

+ 在挑选加入序列的移动时增加约束条件，若移动发生后满足
  $$
  r\cdot area(V)-area_{max}(V)\le area(A)\le r\cdot area(v)+area_{max}(V)
  $$
  （称为平衡条件），移动才会被采纳。

+ B. Krishnamurthy提出了critical net的概念，简化了FM的计算，但是原理并未改变，此处不展开。

后面还有提到FPGA的partition问题，由于我对FPGA了解不多所以看不太懂，这里也先不展开了。
