---
title: Logic to Layout Week 5
categories:
- Learning
- EDA
mathjax: true
date: 2023-04-10 18:45:11
tags:
---

## Logic to Layout

从现在开始就要讲Layout的部分了。之前的内容是，怎样设计一个优化的布尔函数，布尔函数是一个逻辑抽象(Logic)，而接下来的学习内容是将布尔函数转化为实际上的电路(layout)。主要分为三个步骤：
+ Technology Mapping 将Boolean network model(之前提到的，每个节点是一个2-level SOP的网络)转化为网表(netlist)，网表长这个样子
  
  <img src="https://raw.githubusercontent.com/diriLin/blog_img/main/202011111202422.png"/>
  其中的连线wire也被称作net, 所以被称为netlist.
+ Placement
+ Routing

本门课程还讲述时序分析的一些技巧。

## Placement

具体来说，placer的功能是这样的：
+ 输入：netlist
+ 优化目标：估计的连线长度
+ 输出：逻辑门的放置

上面提到的Placement和Routing不能合并成一整个流程的原因是，routing的代价太过昂贵了，不能把placement变成其中的一个inside步骤，然后每次优化的时候都执行place & route. placer得到一个不错的gate locations之后，router再在一个固定的gate location上进行连线的优化，这样任务的复杂度就减少了很多。

因为这门课主要是原理的讲解，所以以下的gate都假定只占据一个网格。

### Half-Perimeter Wirelength(HPWL)

<img src="https://raw.githubusercontent.com/diriLin/blog_img/main/20230410203541.png"/>

这是一个很简陋的下界估计。简单来说，就是围住这个net的最小矩形的半周长。

### Iterative Improvement Placer

总体的思路是：
+ 随机产生一个placement的初值，来进行迭代优化
+ 优化的目标，用HPWL代表真实的连线长度期望
+ 从当前placement出发，产生一个新的placement
+ 计算的新HPWL

<img src="https://raw.githubusercontent.com/diriLin/blog_img/main/20230412152818.png"/>

在最简单的策略里面：
+ 产生新placement的方法是随机交换两个gates的位置
+ 对计算的优化：HPWL只需要增量地更新，因为只有少部分的net发生了变化
  <img src="https://raw.githubusercontent.com/diriLin/blog_img/main/20230412154114.png"/>
+ 如果HPWL增量$\Delta L<0$，说明新的placement是更优的结果，采用之；否则，不接受

然后课程提出了用模拟退火的策略来进行改进，即当HPWL增量$\Delta L>0$时，以概率$P=\exp(-\dfrac{\Delta L}{T})$接受新的placement, 其中$T$是温度变量，初始值设置的比较大，从而使$P$较接近1，然后随着优化的过程逐渐减小。模拟退火的思想不在此详述，可参考[Simulated annealing - Wikipedia](https://en.wikipedia.org/wiki/Simulated_annealing).

<img src="https://raw.githubusercontent.com/diriLin/blog_img/main/20230412160416.png"/>

课程视频还展示了一个动画，这里只有一个截图了：

<img src="https://raw.githubusercontent.com/diriLin/blog_img/main/20230412161732.png"/>

其中每个点的颜色代表这个grid上的net congestion情况，如果有$n+1$个net的boundary box占据了这个grid，那么它的congestion就是$n$，随着退火过程的进行，最后congestion变得较少较均匀，不再出现像上图(初始值)这样的有一大片congestion区域的情况。

### Quadratic Wirelength Model

一种不同于HPWL的距离。对一个连接$k$个点的net，将其转化为$\text{C}_k^2$个2-point sub-nets. 记subnet i的欧氏距离为$E(i)$，则对于整个net
$$
\text{Quadratic Wirelength} =\alpha\sum_{i\in \text{subnets}}[E(i)]^2
$$
其中$\alpha$是一个权重系数，一般取$\dfrac{1}{k-1}$(这样当$k=2$时$\alpha=1$).

<img src="https://raw.githubusercontent.com/diriLin/blog_img/main/20230412163149.png"/>

课程对上图的示例进行了演示。可以看到x轴方向和y轴方向的变量没有乘积项，因此可以分开进行优化。优化的办法很简单，就是对所有变量偏导数，令其等于0，然后解方程组。

<img src="https://raw.githubusercontent.com/diriLin/blog_img/main/20230412163552.png"/>

<img src="https://raw.githubusercontent.com/diriLin/blog_img/main/20230412163458.png"/>

这个方程组$Ax=b_x$的两个矩阵都是比较容易获取的。首先建立矩阵$C$, 如果gate i和gate j之前存在权重为$w$的连线，那么$C_{ij}=C_{ji}=w$；然后建立$A$，对于非对角线元素，$A_{ij}=-C_{ij}$，对于对角线元素，$A_{ii}$等于$C$第i行的和+连接pad和gate i的所有连线的权重和：

<img src="https://raw.githubusercontent.com/diriLin/blog_img/main/20230412171255.png"/>

而$b_x$的建立也非常简单（对于$Ay=b_y$, $b_y$的建立也是类似的）：

<img src="https://raw.githubusercontent.com/diriLin/blog_img/main/20230412171812.png"/>

这个方程组看上去很恐怖（如果gates的数量很大，方阵A也会变得很大），但是课程指出方阵A具有***对称，对角线占优，系数，半正定***的性质，因此存在比较好的迭代解法：

<img src="https://raw.githubusercontent.com/diriLin/blog_img/main/20230412164845.png"/>

由于其对角占优，之前上课学过（但现在又全部忘掉的）Jacobi迭代法和Gauss-Seidel迭代法是可以使用的。关于方程组数值解的迭代法可以参考[线性方程组-迭代法 2：Jacobi迭代和Gauss-Seidel迭代 - 知乎](https://zhuanlan.zhihu.com/p/389389672)。

### Recursive Partitioning

<img src="https://raw.githubusercontent.com/diriLin/blog_img/main/20230413191454.png"/>

如果只执行一次quadratic place, 结果可能如上图的左一所示，gates都集中在chip的中间，这样的分布太过不均衡，chip空间利用率低，且容易产生congestion. 解决方法就是进行Recursive Partitioning，将gates分配到chip的不同block中。

过程是这样子的（以x方向的partition举例），对上一次place的结果进行排序，靠左的gates分配到chip的左半部分，其他分到右半部分：

<img src="https://raw.githubusercontent.com/diriLin/blog_img/main/20230413192011.png"/>

对于左半部分的子问题，除了被分到这个部分的gates之外，其他的gates和pads都被移到区域边缘且被视为pads: 

<img src="https://raw.githubusercontent.com/diriLin/blog_img/main/20230413192551.png"/>

在y方向上也可做类似的partition: 

<img src="https://raw.githubusercontent.com/diriLin/blog_img/main/20230413192648.png"/>