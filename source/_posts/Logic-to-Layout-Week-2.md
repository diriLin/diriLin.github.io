---
title: Logic to Layout Week 2
date: 2023-03-21 10:52:59
categories: Learning
tags: EDA
mathjax: true
---

今天是去南京旅游的第三天，前两天走了平均走了35000+步，今天早上就权当休息了，不出去走，来写写博客。

## Binary Decision Diagrams(二分决策图，BDDs)

一种比[Cube List](https://diri-lin.top/Learning/EDA/Logic-to-Layout-Week-1/#Cube-List)更powerful的数据结构，用来表达多输入多输出的电路。常用的是Reduced Ordered Binary Decision Diagram(ROBDD，课程后面有很多ROBDD和BDD的混用，实际指代的都是ROBDD)：
+ Ordered
  + 名字的第二个单词，意思是这个图的根节点到叶子节点（函数值）的决策过程中出现的变量符合一个给定的顺序，可以有某些变量缺省。

+ Canonical form(规范型)
  + 对一个函数来说，给定**同样的变量顺序**，ROBDD给出的图应该是相同的。

<img src="https://raw.githubusercontent.com/diriLin/blog_img/main/20230321113824.png#pic_center" style="zoom:120%;" />
<center>BDD示例，并没有Reduced and ordered</center>

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

有两种方法，第一种是从BDT简化得来：

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
> 并行地遍历两个图，在两个给定的图中始终同时沿着0边或1边移动；

> 当一个变量在一个图中存在，而不在另一个图中时，我们就像它存在并且有相同的high和low子节点一样继续进行（前面提到隐式地扩展，即实际上并不会创建节点，而是直接递归调用下去，后面的代码分析中可以看到，这里采用扩展结点是为了方便说明）；

> 当到达两个图的终端结点0或1时，对这些常量应用布尔运算并返回相应的常量;

> 如果对high和low子节点的运算返回相同的节点，不构造一个新节点，而只是返回在树中已经获得的单个节点。避免冗余；

> 如果将要构造一个已经在结果图中某处的节点(也就是说，具有相同的变量标签和相同的后续节点)，不要创建一个新的副本，而只是返回已经存在的节点。

## SAT

SAT问题就是说，对于一个布尔表达式，是否有一组对变量的赋值使布尔表达式的值为1. 当然可以用BDD的方法来解，但是BDD相当于求出了每一组输入的函数值，这对SAT来说太多了；需要一种新的数据结构和快速的解法来应付这个问题。

有很多问题可以转化为SAT问题，课程给出的例子是判断两个布尔函数F和G是否是等价的：

<img src="https://raw.githubusercontent.com/diriLin/blog_img/main/20230321230445.png"/>

### Conjunctive Normal Form(合取范式，CNF)

数理逻辑的东西都忘好多了：
+ 若p是一个原子公式(atom)，则p和p'称为文字(literal)
+ 文字的析取被称为子句(clause)
+ 子句的合取被称为合取范式(CNF)

CNF的好处在于，如果有一个子句的值为0，那就可以判断整个表达式的值不可能为1了，需要寻找其他的赋值来满足。

### gate by gate建立布尔函数的CNF

这里的CNF里面的文字并不全是布尔函数的输入，也包含中间wire的值和输出，因此我觉得课程把它叫做布尔函数的CNF不是特别合适，实际的意思是可以用来进行下面的SAT问题BCP求解的CNF输入形式。

#### Gate consistency function(逻辑门一致性函数)

上面提到的CNF含有中间wire的值和输出，它们本来应该是输入（或者某门的输入）的函数，这里把它们变成CNF的变量，其实是将它们和输入（或者某门的输入）的相关性用别的方式去表达了，而这个“别的方式”，就是Gate consistency function. 比如对于与非门$d=\overline{ab}$，它的Gate consistency function是
$$
\varPhi_d=(d==\overline{ab})=(a+d)(b+d)(\overline{a}+\overline{b}+\overline{d})
$$
要求这个函数的值为1，也就是要求$(d==\overline{ab})$，$d$确实能代表这个逻辑门的输出。

课程提出的CNF的形式是：
$$
\text{CNF}=(\text{output var})\prod_{k\in{\text{gates}}}\varPhi_k
$$

要使原来的布尔函数可满足，首先输出变量肯定为1，其次，所有逻辑门的一致性函数都为1，这样输出变量和中间变量才能代表上游的逻辑门的运算结果；反过来，CNF的SAT的一组解，将里面的中间变量和输出变量去掉，剩余的输入变量也必是原函数SAT问题的解。因此：

**<center>“原函数的SAT问题有无解”与“其CNF的SAT问题有无解”是等价的。</center>**

课程也给出了一些常见的CNF转化公式：

<img src="https://raw.githubusercontent.com/diriLin/blog_img/main/20230321233157.png"/>

### Boolean Constraint Propagation(布尔约束传播，BCP)

递归地求解CNF的SAT问题。递归基：
+ SAT: 找到一组赋值，使得这个CNF的子句全是1
+ UNSAT: 存在（与SAT的）矛盾(conflict)，至少有一个子句的值为0

否则至少有一个子句的值未知。我们需要选择一个未赋值的变量进行赋值，使得问题的规模变小：
1. 如果存在单文子的子句(unit)，则对这个变量赋值使unit的值为1
2. 否则选一个未赋值变量，赋值为0或者1

然后进行DFS搜索，当求解到UNSAT的时候，需要进行回退，回退必须包含一次上述情况2的取消，因为情况1的赋值是必然的，并没有剪除可能的分支。如果回退到了问题的根节点，则说明SAT无解。

对于用gate by gate建立的CNF，显然第一个unit就是输出变量。，而且下游的逻辑门输出必然在上游的变量之前变成unit，本质是从输出向输入方向倒退的搜索过程。

明天去到武汉就没电脑喽，就写到这里。