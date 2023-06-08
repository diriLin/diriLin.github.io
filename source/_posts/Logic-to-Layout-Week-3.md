---
title: Logic to Layout Week 3
date: 2023-03-27 21:37:09
categories: Learning
tags: EDA
mathjax: true
---

## 2-level synthesis

2-level综合优化指：
+ sum of product的形式
+ 最少的与门
+ 满足以上条件，最少的输入(literals)

<img src="https://raw.githubusercontent.com/diriLin/blog_img/main/20230328004837.png"/>

策略
+ 很难找到最优解->寻找次优解
+ 迭代优化

最优解的性质：
+ Best solution is composed of cover of primes
  + primes指卡诺图中尽可能大的cube
+ irredundant

也按照这些性质找次优解。

### the Reduce-Expand-Irredundant Optimization Loop

初始状态：

<img src="https://raw.githubusercontent.com/diriLin/blog_img/main/20230328004956.png"/>

表中的每一项对应卡诺图的一个由1组成的cube.


Expand step:
将每一个不是prime的cube扩大成prime：

<img src="https://raw.githubusercontent.com/diriLin/blog_img/main/20230328005703.png"/>

Q cube: 0\*10->\*\*10
S cube: 1101->\*\*01
R cube: 1101->1\*\*1


Irredundant step:
去掉那些冗余的prime，来满足irredundant.

<img src="https://raw.githubusercontent.com/diriLin/blog_img/main/20230328010531.png"/>

R cube是冗余的，所以被去掉了。

然后开始Reduce-Expand-Irredundant Optimization Loop.
Reduce step:

<img src="https://raw.githubusercontent.com/diriLin/blog_img/main/20230328010625.png"/>
+ 尽可能收缩primes，但不要使得有1未被覆盖
+ 这虽然使得我们不满足primes的要求，但提供了向其他方向优化的可能

总结：

<img src="https://raw.githubusercontent.com/diriLin/blog_img/main/20230328010910.png"/>

+ Loop的起点：primes & irredundant
+ Reduce后：not primes & irredundant
+ Expand后：primes & redundant
+ Irredundant后：primes & irredundant

然后是下一个loop, 直至收敛。

### 细说Expand

这里使用的数据结构是cube list:

<img src="https://raw.githubusercontent.com/diriLin/blog_img/main/20230328160305.png"/>

对于给定的函数F, 首先求补：

<img src="https://raw.githubusercontent.com/diriLin/blog_img/main/20230328160622.png"/>

然后形成一张表格，其中行是要待扩展的cube的文字，而列代表F'的各product项：

<img src="https://raw.githubusercontent.com/diriLin/blog_img/main/20230328160901.png"/>
一个格子，如果它的行所代表的文字的***反文字***出现在它的列代表的项中，那么它的值为1，否则为0:
+ 扩展，就是选择某些行，这些行的product就是比原来更大的cube
  + 比如上图我选取了w'x，这就是一个包含原来的w'xyz'的更大的cube
+ 选哪些行？
  + 上图中，假设我只选了w'，那么w'就会覆盖到x'z的一部分，那么这个expand是错误的
    + 我们也可以看到表中的w'行x'z列是0，也就是说，w'和F'中的x'z项没有冲突
  + 假设选w'x，这是一个合理的expand，因为x使得这个product和x'z产生了冲突，从而w'x和F'中的所有product都产生了冲突
  + ***结论***：选择最小的行集合，使得每一列都至少有一个1.
    + 这就将原问题转化为了[集合覆盖问题](https://en.wikipedia.org/wiki/Set_cover_problem)

## Multilevel synthesis

课程的这一章节提到的优化目标是***Total literal count***.
> Yes, delays matter too, but for this class, only focus on logic complexity.

数据结构-布尔逻辑网络：分为三个部分
+ 原始输入
+ 原始输出
+ 2-level SOP作为中间节点

<img src="https://raw.githubusercontent.com/diriLin/blog_img/main/20230328183948.png"/>

操作：
+ 简化网络节点，此前提到的2-level synthesis
+ 删除网络节点，将太小的节点删除
+ 增加网络节点，将节点的“公因式”提取出来(factoring)(重点)

### Factoring
Algebraic Model的想法是，只考虑布尔代数和实数运算中相同的定理和性质：

<img src="https://raw.githubusercontent.com/diriLin/blog_img/main/20230328184741.png"/>

可以看到，不一致的部分涉及a'，因此factoring的一条重要的原则是，变量的补要和变量视为无关。
Factoring将待分解的函数F分解为：

<img src="https://raw.githubusercontent.com/diriLin/blog_img/main/20230328185445.png"/>

并不严格需要余数(remainder)为0，因为即使不为0也可以与其他代数式共享divisor. Algebraic Division Algorithm的伪代码：

<img src="https://raw.githubusercontent.com/diriLin/blog_img/main/20230328185828.png"/>

要点：
+ cube，就是sum of product里面的product
+ $Q=Q\cap C$指将$Q, C$视为cube的集合

一个例子：F=axc+axd+axe+bc+bd+de, D=ax+b, 求F/D

<img src="https://raw.githubusercontent.com/diriLin/blog_img/main/20230328190423.png"/>

+ 表格的第一列是F的cubes
+ 从第二列开始for循环
  + D第一个cube是ax，F的cubes中前三个含有ax，去掉之后得到C=Q=c+d+e
  + D第二个cube是b，F的cubes中后三个含有b，去掉之后得到C=c+d, 因此
  $$Q=Q\cap C=c+d$$
+ R=F-QD=axe+de

注意事项：求F/D时，输入F不可以有冗余的cubes，因为这可能会导致错误，举个例子：
+ F=a+ab+bc, D=a
+ 运算结果：F/D=1+b, remainder=bc, 其实好像也能成立，但是Algebraic model中没有1+b这种操作，因为在布尔代数和实数中，这种操作的结果不一定相同。

这种factoring可以带来的简化效果是这样的：

<img src="https://raw.githubusercontent.com/diriLin/blog_img/main/20230328191504.png"/>

接下来讨论怎么寻找***只有1个cube***的divisors和***multiple-cube*** divisors.

### Kernels and co-kernels

kernel的定义：

<img src="https://raw.githubusercontent.com/diriLin/blog_img/main/20230328192245.png"/>

+ c是单个product(single cube)
+ k是***cube-free*** two-level SOP forms
  + cube-free的意思是指k不能被分解为$k=d\cdot Q$这种形式
+ 满足$F=c\cdot k+R$的k被称为kernel，而c被称为co-kernel
  + F的kernels的集合记作K(F)
  + co-kernel就是上面说的***只有1个cube***的divisors

### Brayton & McMullen Theorem

$$
\text{布尔代数式F, G有共同的multi-cube divisor d}\iff \text{存在}k_1\in K(F), k_2\in K(G) \text{使得}d=k_1\cap k_2\text{且}d\text{含有}2\text{个以上的cubes}
$$

交运算将SOP看成cubes的集合。因此我们只需要在两个代数式的kernels的交集中寻找multiple-cube divisors即可：

<img src="https://raw.githubusercontent.com/diriLin/blog_img/main/20230328193331.png"/>

kernels的求解可以递归地进行，理由如下，假设$k_1\in K(F), k_2\in K(k_1) $, 那么
$$
F=c_1\cdot k_1+r_1 \\
k_1=c_2\cdot k_2+r_2\\
F=c_1\cdot (c_2\cdot k_2+r_2)+r_1=c_1c_2\cdot k_2+(c_1r_2+r_1)
$$
因此$k_2$也是F的kernel. 

Brayton et al.的另一个有用结论是：布尔表达式的co-kernels与表达式2个以上的cubes的交运算结果对应，其中“交运算”指将cube视为literals的集合。举例：F=ace+bce+de+g, $ace\cap bce=ce$，那么ce是潜在的co-kernel.

从这两个结论出发，得到求cube-free SOP expression F的kernels集合K(F)的算法伪代码：

<img src="https://raw.githubusercontent.com/diriLin/blog_img/main/20230328194643.png"/>

