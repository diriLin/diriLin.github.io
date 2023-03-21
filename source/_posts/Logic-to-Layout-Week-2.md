---
title: Logic to Layout Week 2
date: 2023-03-21 10:52:59
categories:
- Learning
- EDA
mathjax: true
tags:
---

今天是去南京旅游的第三天，前两天走了平均走了35000+步，今天早上就权当休息了，不出去走，来写写博客。

## Binary Decision Diagrams(二分决策图，BDDs)

一种比[Cube List](https://diri-lin.top/Learning/EDA/Logic-to-Layout-Week-1/#Cube-List)更powerful的数据结构，用来表达多输入多输出的电路。常用的是Reduced Ordered Binary Decision Diagram(ROBDD)：
+ Ordered
  + 名字的第二个单词，意思是这个图的根节点到叶子节点（函数值）的决策过程中出现的变量符合一个给定的顺序，可以有某些变量缺省。

+ Canonical form(规范型)
  + 对一个函数来说，给定**同样的变量顺序**，ROBDD给出的图应该是相同的。

<img src="https://raw.githubusercontent.com/diriLin/blog_img/main/20230321113824.png#pic_center" style="zoom:120%;" />
<center>ROBDD示例</center>

### Ordering

视频说的是No universal solution，给出了一些办法：
+ Characterization: know which problems never make nice BDDs (eg, multipliers)
+ Dynamic ordering: let the BDD software package pick the order... on the fly（这是认真的吗？）
+ 启发式的规则：相关的输入变量应该尽可能地放在一起
  + 给出了一个例子：
  <img src="https://raw.githubusercontent.com/diriLin/blog_img/main/20230321123437.png"/>
  如果先算a再算b，由于a1, a2, a3之间没有关系，决策树会完全地展开，这导致BDD很庞大。

但是左边的图为什么可以这么reduced? 接下来将ROBDD的build up.

### 建立ROBDD的方法

有两种方法，第一种是从BDT简化得来。

#### Reduce

<img src="https://raw.githubusercontent.com/diriLin/blog_img/main/20230321124038.png"/>
<center>二分决策树BDT</center>

BDT就不必多说了，要注意必须是ordered. 然后做以下几类reduction: 
+ 合并0节点和1节点；
+ 合并同构(isomorphic)节点，其中同构是指：
  + 节点代表的变量相同；
  + 它们的低指针指向相同的child, 高指针也一样；
  <img src="https://raw.githubusercontent.com/diriLin/blog_img/main/20230321124721.png"/>
  <center>两个x的指针指向相同的children</center>
+ 删除冗余的节点
  <img src="https://raw.githubusercontent.com/diriLin/blog_img/main/20230321124948.png"/>
  <center>x无论取什么值对下一步决策没影响，因此可以直接删去</center>

迭代进行以上操作，直至图不能够再reduce. 但实际不这么建立ROBDD，因为光是建立BDT就已经是指数时间复杂度。

#### 自底而上，gate by gate

<img src="https://raw.githubusercontent.com/diriLin/blog_img/main/20230321130142.png"/>
呃呃，这个课程说大概是这么干的，却没有说具体怎么做，比如得到T1和T2之后具体怎么进行Or的操作。我参考了[jacob的文章](https://zhuanlan.zhihu.com/p/397164596)，他以$x_1\operatorname{or}x_2$为例（变量顺序是$x_1, x_2$）：
> <img src="https://raw.githubusercontent.com/diriLin/blog_img/main/v2-e68d2436b70b681876f01b88e392b412_720w.webp"/>
“隐式扩展”指的是对齐两边的变量，之前在reduce的时候讲过要删除冗余的变量，此处用相反的方法加回去，先检查$x_1$：
<img src="https://raw.githubusercontent.com/diriLin/blog_img/main/v2-6945f2d8a7b5437ee531e5ec0478b33f_720w.webp"/>
然后是$x_2$：
<img src="https://raw.githubusercontent.com/diriLin/blog_img/main/v2-4210a6bb577f1067c88ade16a4beb282_720w.webp"/>
对齐之后，同时在两个图上进行遍历，比如上图就连续两次决策为0，发现结果都为0；然后决策为0-1，得到一个结果是0，一个结果是1，那么就对这两个常数结果进行$\operatorname{or}$运算：
<img src="https://raw.githubusercontent.com/diriLin/blog_img/main/v2-1934677a361b2b63b8120aa9ec1c86c0_720w.webp"/>

这就是总体的思路。具体的操作，[jacob](https://zhuanlan.zhihu.com/p/397164596)总结为：
> + 并行地遍历两个图，在两个给定的图中始终同时沿着0边或1边移动
+ 当一个变量在一个图中存在，而不在另一个图中时，我们就像它存在并且有相同的high和low子节点一样继续进行（前面提到隐式地扩展，即实际上并不会创建节点，而是直接递归调用下去，后面的代码分析中可以看到，这里采用扩展结点是为了方便说明）
+ 当到达两个图的终端结点0或1时，对这些常量应用布尔运算并返回相应的常量
+ 如果对high和low子节点的运算返回相同的节点，不构造一个新节点，而只是返回在树中已经获得的单个节点。避免冗余
+ 如果将要构造一个已经在结果图中某处的节点(也就是说，具有相同的变量标签和相同的后续节点)，不要创建一个新的副本，而只是返回已经存在的节点

## SAT

有空再补充，出门玩耍去啦！