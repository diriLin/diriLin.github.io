---
title: "FastPass: Fast Pin Access Analysis with Incremental SAT Solving"
tags: EDA 
categories: Paper-reading
mathjax: true
---

> Gossip: TA是真的烦躁啊，好想摆脱一切烦心事来做科研。现在想读更多文章，找方向。其实我觉得当成工作来做，也行，但是还是有兴趣的方向好一点吧。

这篇工作：

+ 关注的问题是Pin Access Analysis, 这是detail routing里面的一个步骤。
  + Cell上的pin有可能不在格点上，这会增加detail routing的困难，因此需要给pin分配一个格点。
+ 算法的目的是产生Design Rule Checking(DRC)-clean pin access scheme.
  + DRC-clean仅就这一步而言。之后还是可能产生DRC-violation.
+ 因为baseline也能产生DRC-clean pin access scheme，所以主要的改进是运行时间。
+ 数据集是ISPD'18 detail routing contest，似乎在这个问题上较常见。

## Flow



<img src="https://raw.githubusercontent.com/diriLin/blog_img/main/20230916001845.png" style="zoom:50%;" />

整个flow的过程是这样的：

+ 产生格点的候选集合
+ intra-instance的检查
+ inter-instance的检查
+ SAT

（上面似乎白说了）

## More detailed

### 怎样产生格点候选集合？

<img src="https://raw.githubusercontent.com/diriLin/blog_img/main/20230916004424.png" style="zoom: 33%;" />

+ 在metal上划分最大矩形（红色框这种就是）
+ 候选集合就是所有最大矩形的内部格点（第一类）
  + 如果有某个最大矩形没有内部格点，那就选所有最近格点（比如横着的，就选了下面3个）（第二类）
+ via的具体情况，具体怎样连接pin和格点，这两个直接看paper吧

### 怎样检查？

<img src="https://raw.githubusercontent.com/diriLin/blog_img/main/20230916004945.png" style="zoom:67%;" />

蓝色的Via metal所在位置就是我们给和它相交的metal分配的格点。它根据最大矩形的宽度和最大间距要求

> DRC里面有很多间距要求，取最大的那个做悲观估计？没有弄明白，源码也还没公开

来计算active region的宽度（高度就是instance的高度，也就是行高）。如果一个fixed metal的最大矩形进入active region，就要计算这个fixed metal和格点是否存在violation（因为之前的估计是悲观的）。

> 那个算法我有点小迷惑，没弄明白从左边离开的为什么可以不判断
>
> <img src="https://raw.githubusercontent.com/diriLin/blog_img/main/20230916012211.png" style="zoom:50%;" />

（intra和inter）检查的时候，如果这些格点和fixed-metal产生violation，这是无法解决的，所以只能将格点从候选集合里面删去；如果格点之间会产生violation，那么现在还不能决定留哪一个，这种violation用conflict graph的形式先记录下来，留待SAT求解。

### SAT？

<img src="https://raw.githubusercontent.com/diriLin/blog_img/main/20230916012607.png" style="zoom:67%;" />

这是intra和inter检查之后得到的conflict graph. 在这个基础上，给来自同一个pin的candidates(routes)连上边，防止同一个fixed metal的candidates(routes)出现在不同的子问题中，就得到了最后的conflict graph.

记pin $p_i\in P$ 产生的第j个candidate为$t_{i,j}$, 变量$s_{i,j}$为1仅当$t_{i,j}$​被选中，否则为0. 约束公式为：

<img src="https://raw.githubusercontent.com/diriLin/blog_img/main/20230916013557.png"/>

<img src="https://raw.githubusercontent.com/diriLin/blog_img/main/20230916013651.png"/>

约束(4)意味着每个pin至少有一个candidate被选中，而(5)代表candidate pair不能出现在conflict graph上. 求解SAT即可得到DRC-clean的pin access scheme.

### Incremental?

可以通过添加子句$\neg s_{i,j}$来禁用$t_{i,j}$. Incremental SAT solving：

+ 通过添加子句来禁用部分candidates，使得每个pin只有一个best candidate参加SAT
  + 初始的搜索空间是很小的，后面逐渐增大
+ 返回可行解
+ 否则，当前搜索空间中的candidates之间一定存在一些无法解决的冲突。MiniSAT求解器会返回一组assumption子句，它们使得问题不可求解。为这些子句涉及的pin多启用一个candidate. 
  + 通过这种方式，增加了在下一次增量运行中获得可行解决方案的机会，同时引入尽可能少的次优路线。

那么，什么是“好”呢？对每个$t_{i,j}$，文章给出了一个cost pair $<c_1,c_2>$:
$$
c_1=\begin{cases}
1,&\quad \text{if }ap(t_{i,j})\text{ is out-of-guide},\\
0,&\quad \text{otherwise,}
\end{cases}\\
c_2=L1Dist(ap(t_{i,j}),net(p_i).center)
$$
其中$ap(t_{i,j})$指$t_{i,j}$所在的格点(access point), guide由global routing给出。$c_1$更小的candidate被认为更好；如果$c_1$相等，那么$c_2$更小的candidate被认为更好。
