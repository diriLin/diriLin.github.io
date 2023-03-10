---
title: Logic to Layout Week 1
date: 2023-03-11 00:49:53
categories:
- Learning
- EDA
tags:
mathjax: true
---

又开一个坑。课程是UIUC的[VLSI CAD Part I:Logic](https://www.coursera.org/learn/vlsi-cad-logic). Week 1就讲了一点布尔代数的内容。

## Lecture 2.1 Basics

这一节课只讲了`Shannon Expansion`：

$$
F(x_1,x_2,\dots,x_n)=x_i\cdot F_{x_i}+x_i^{'}\cdot F_{x_i^{'}}
$$

其中
$$
F_{x_i}=F(x_1,x_2,\dots,x_i=1,\dots,x_n) \\
F_{x_i^{'}}=F(x_1,x_2,\dots,x_i=0,\dots,x_n)
$$

## Lecture 2.2 Boolean Difference

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

## Lecture 2.3 Quantification Operators

对$F(x_1,\dots,x_n)$给出了两个函数的定义：
+ 全称量化(Universal Quantification): $\forall{x_i}F=F_{x_i}\cdot F_{x_i^{'}} $
+ 存在量化(Existential Quantification): $\exists {x_i}F=F_{x_i}+ F_{x_i^{'}} $



## Lecture 2.4 Network Repair

利用全称量化来修复网络，用多路选择器来取代损坏的逻辑门，然后和正常的网络做exnor运算：

![exnor](https://great.wzznft.com/i/2023/03/11/3q4iqd.png)

得到新函数$Z(a,b,D)$，求令$\forall ab Z==1$的$D$，即可得到多路选择器的实际功能。
