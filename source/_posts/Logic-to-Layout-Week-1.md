---
title: Logic to Layout Week 1
date: 2023-03-11 00:49:53
categories: Learning
tags: EDA
mathjax: true
---

又开一个坑。课程是UIUC的[VLSI CAD Part I:Logic](https://www.coursera.org/learn/vlsi-cad-logic). Week 1就讲了一点布尔代数的内容。

## Basics

这一节课只讲了`Shannon Expansion`：

$$
F(x_1,x_2,\dots,x_n)=x_i\cdot F_{x_i}+x_i^{'}\cdot F_{x_i'}
$$

其中

$$
F_{x_i}=F(x_1,x_2,\dots,x_i=1,\dots,x_n) \\
F_{x_i'}=F(x_1,x_2,\dots,x_i=0,\dots,x_n)
$$

## Boolean Difference

从一元实函数的导数定义出发：

$$
\dfrac{df}{dx}=\dfrac{f(x+\delta)-f(x)}{\delta}
$$

`Boolean Derivatives`指$f$在某个参数分别取0和1时，函数值是否不同：

$$
\dfrac{\partial f}{\partial x}=f_x\oplus f_{x'}
$$

一些性质：
+ 对不同变量求导数可以交换次序：$\dfrac{\partial^2 f}{\partial x\partial y}=\dfrac{\partial^2 f}{\partial y\partial x}$
+ 导数的异或是异或的导数：$\dfrac{\partial(f\oplus g)}{\partial x}=\dfrac{\partial f}{\partial x}\oplus \dfrac{\partial g}{\partial x}$

但是对于与运算和或运算不满足，比较繁琐：
$$
\begin{aligned}
& \frac{\partial}{\partial x}(f \bullet g)=\left[f \bullet \frac{\partial g}{\partial x}\right] \oplus\left[g \bullet \frac{\partial f}{\partial x}\right] \oplus\left[\frac{\partial f}{\partial x} \bullet \frac{\partial g}{\partial x}\right] \\
& \frac{\partial}{\partial x}(f+g)=\left[\bar{f} \bullet \frac{\partial g}{\partial x}\right] \oplus\left[\bar{g} \bullet \frac{\partial f}{\partial x}\right] \oplus\left[\frac{\partial f}{\partial x} \bullet \frac{\partial g}{\partial x}\right]
\end{aligned}
$$

## Quantification Operators

对$F(x_1,\dots,x_n)$给出了两个函数的定义：
+ 全称量化(Universal Quantification): $\forall{x_i}F=F_{x_i}\cdot F_{x_i'} $
+ 存在量化(Existential Quantification): $\exists {x_i}F=F_{x_i}+ F_{x_i'} $



## Network Repair

利用全称量化来修复网络，用多路选择器来取代损坏的逻辑门，然后和正常的网络做exnor运算：

![exnor](https://raw.githubusercontent.com/diriLin/blog_img/main/exnor.png)

得到新函数$Z(a,b,D)$，求令$\forall ab Z==1$的$D$，即可得到多路选择器的实际功能。

## Recursive Tautology and URP Implementation

问题：如何判断一个布尔代数式子是否为重言式。

思路：
+ 更好的布尔代数表达法(Cube List)，用来代替卡诺图
+ 拆分成子式，子式也是重言式，递归求解

### Cube List

要点：
+ 布尔代数式的形式是sum of products
+ 每个product用一个cube来表示，形如[xx, xx, xx]
  + 每个变量（比如，$x$）在[]中拥有一个2-bit slot
    + 01代表这个product里面的变量是$x$
    + 10代表变量是$x'$
    + 11代表变量不存在于这个product
  + 然后这些cube纵向堆叠成list

### Unate Function

铺垫的定义。如果一个sum of product式，它的任意变量（比如$x$）都只以$x$或者$x'$的形式出现，那就说他是unate，否则是binate. 

+ f is positive unate in var x -- if changing x 0->1 keeps f constant or makes f: 0->1
+ f is negative unate in var x -- if changing x 0->1 keeps f constant or makes f: 1->0

检查一个式子是不是unate，用cube list是很直观的：
![](https://raw.githubusercontent.com/diriLin/blog_img/main/20230311131944.png)

### Tautology Checking

$$
F\text{ is a tautology} \iff F_x \text{ is a tautology and } F_{x'}\text{ is also a tautology}
$$

依次判断：
+ Rule1: 如果cube list含有一个cube，里面的变量全为11，那么这个式子是重言式
+ Rule3: 如果式子里存在$x+x'$的情况，那么这个式子是重言式
+ Rule2: 如果式子是unate，且不含有变量全为11的cube，那么这个式子不是重言式

如果不能马上判断，那么寻找一个变量$x$：
+ Pick binate var with most product terms dependent on it (Why? Simplify more cubes)
+ If a tie, pick var with minimum | true var - complement var | (L-R subtree balance)

然后递归地检查两个子式是否为重言式。





