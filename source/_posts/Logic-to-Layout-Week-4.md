---
title: Logic to Layout Week 4
categories:
- Learning
- EDA
mathjax: true
date: 2023-04-01 17:18:17
tags:
---

## Divisor Extraction
Week 4 先接着讲如何mechanically do factoring.

### single-cube extraction
cube-literal matrix: 
+ 每一行是布尔代数式的一个cube(product term)
+ 每一列是一个literal
+ 对每一个位置，如果列指出的literal出现在行指出的cube中，那么该位置为1

<img src="https://raw.githubusercontent.com/diriLin/blog_img/main/20230401181444.png"/>

rectangle: 形如(R, C)
+ R是行的集合，C是列的集合
+ 如果这些行和列的交汇处的值都为1，则称(R, C)是一个rectangle，而$\prod{C}$是一个合法的single-cube divisor
+ 对一个rectangle，如果不能再增加行或者列，则称其为prime rectangle
+ 一个rectangle节省的literals: 
$$
\text{literals saved} = (C-1)\times \sum_{rows\ r}Weight(r) -C
$$
其中$Weight(r)$是r指出的product在要extract的网络中出现的次数。

### multiple-cube extraction
类似地，我们有co-kernel--cube matrix: 
+ 每一行是一个(function, co-kernel)对
+ 每一列是kernel的一个cube
+ 对每一个位置，如果列指出的cube出现在行指出的co-kernel对应的kernel中，那么该位置为1

<img src="https://raw.githubusercontent.com/diriLin/blog_img/main/20230401182858.png"/>

对rectangle(R, C), $\sum C$是一个合法的multiple-cube divisor. 然后节省的literals的计算公式也被更新：

<img src="https://raw.githubusercontent.com/diriLin/blog_img/main/20230401203441.png"/>

### How to Find a Prime Rectangle in Matrix?

说得非常地粗糙，给我整迷糊了，大意是使用贪心算法来求次优解，先寻找一个最佳的单行结果，然后每次加行加列：

<img src="https://raw.githubusercontent.com/diriLin/blog_img/main/20230401183736.png"/>

优化的效果接近最优解，而计算效率远高于计算最优解的算法：

<img src="https://raw.githubusercontent.com/diriLin/blog_img/main/20230401183921.png"/>

（感谢大学城图书馆）后来我找到了rudell的博士论文的原文：

<img src="https://raw.githubusercontent.com/diriLin/blog_img/main/20230401184147.png"/>

先解释一下一些记号：
+ $(R, C)$ 就是行集和列集组成的rectangle
+ $B$ co-kernel -- cube matrix
+ $v()$ 优化目标函数，参数是行集和列集，即$v(R, C)$，返回一个值
  + 在这个问题中，就是这个rectangle的multiple-cube divisor所节省的literals数量
  + 它的说法是
  > $v()$ is itself defined in terms of the row and column weights ($w^r$ and $w^c$) and the value matrix ($V$).
  
   其中$w^r$ and $w^c$和$V$就是[上面的Weight和Value](#multiple-cube-extraction)

`ping_pong_row`就是一个从最优的单行开始的优化过程。注意：`xxx_row`和`xxx_col`仅存在方向上的不同。先把这个过程的伪代码放上来：

<img src="https://raw.githubusercontent.com/diriLin/blog_img/main/20230401204351.png"/>

一开始先找出v最大的单行：
> $i=\arg\max_{i}\{v(\{i\}, \{j\mid B_{ij}=1\})\}$

然后先调用一次`greedy_row`，从***一个单行rectangle***开始，进行贪心扩展：

<img src="https://raw.githubusercontent.com/diriLin/blog_img/main/20230401205833.png"/>

每次加一个行，使加进去之后的v最大：
> $k=\arg \max _k\left\{v\left(R_s \cup\{k\}, C_s \cap\left\{j \mid B_{k j}=1\right\}\right) \mid k \notin R_s\right\} ;$

注意：
+ 加行之后可能使列数$|C_s|$减少
+ 因此，加进去之后的最大v也有可能比之前更小，需要一个变量来记录最大值，也就是$(R_b, C_b)$

直到$|C_s|=1$，`greedy_row`返回加行过程中的最佳结果。

然后开始循环，循环过程中依然是用$(R_b, C_b)$来记录最佳的行集和列集：
+ 列集$C_b$中选一个最佳的单列，然后调用`greedy_col`进行扩展
  + 如果这次扩展没有得到更佳的结果，跳出循环；
  + 否则更新$(R_b, C_b)$
+ 行集$R_b$中选一个最佳的单行，然后调用`greedy_row`进行扩展
  + 如果这次扩展没有得到更佳的结果，跳出循环；
  + 否则更新$(R_b, C_b)$，进行下一次循环

## Don't cares(DCs)

Don't cares的意思就是：

<img src="https://raw.githubusercontent.com/diriLin/blog_img/main/20230401213151.png"/>

右边卡诺图的这些d，我们don't care他们的取值，因此我们可以任意地将他们设置为1或者0，从而选到更大的prime cube. DCs被分为三类：
+ Satisfiability don’t cares: SDCs
+ Controllability don’t cares: CDCs
+ Observability don’t cares: ODCs

### Satisfiability don’t cares
这种DCs指的是network内部节点的输入输出之间不可能出现的组合：

<img src="https://raw.githubusercontent.com/diriLin/blog_img/main/20230401213849.png"/>

对每个节点的输出，其对应的SDC函数是：
$$
\text{SDC}_{\text{output}}=\text{output}\oplus\text{expression of output}
$$
比如对X=a+b这个节点，就存在一个相应的SDC函数$\text{SDC}_X(X,a,b)=X\oplus(a+b)$；
然后展开成SOP的形式：$\text{SDC}_X(X,a,b)=X\oplus(a+b)=Xa'b'+X'a+X'b$；
其中：
+ 每一个product为1，就会使得整个SDC函数为1，也就是说$X$和$a+b$不一致
+ 那么使这个product为1的这个赋值就是DC，不可能出现这种组合
  + 比如Xa'b'就指出X=1, a=0, b=0这种取值是不可能的，以此类推

### Controllability don’t cares

这种DC指的是不可能存在的输入造成的DC，计算的方法是：

<img src="https://raw.githubusercontent.com/diriLin/blog_img/main/20230402141354.png"/>

其中：
+ 不出现在f中的变量b对要用全称量化进行去除，意思就是，b取任何值的情况下，其他变量的某个赋值都不可能是f的输入（否则如果存在b的一个值使得这个赋值成为可能，就违反了CDC的定义）
+ 如果要对网络的primary input进行约束（也就是规定哪些输入组合是不可能的），将这些组合放到求和符号里面就好：

<img src="https://raw.githubusercontent.com/diriLin/blog_img/main/20230402141805.png"/>

同样的，化简成SOP的形式之后，每一个cube代表一种DC的输入情况。

### Observability don’t cares

这种DC指，在某种输入下，当前节点的输出不会对下一级节点的值产生影响：
> Patterns input to node that make network outputs insensitive to output of the node.

既然下一级节点的值对当前节点的输出不敏感，那么当前节点的输出采取什么值也就无所谓了，don't care.

对于节点F，ODC的计算公式是：
  
<img src="https://raw.githubusercontent.com/diriLin/blog_img/main/20230402142802.png"/>

根据ODC和$\dfrac{\partial Z}{\partial F}$的定义，这是很自然的。