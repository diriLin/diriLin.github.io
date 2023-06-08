---
title: eplace-ms
date: 2023-06-07 16:17:17
categories: Paper-reading
tags: EDA
mathjax: true
---

> 论文以及图片来源：[ePlace-MS: Electrostatics-Based Placement for Mixed-Size Circuits | IEEE Journals & Magazine | IEEE Xplore](https://ieeexplore.ieee.org/document/7008518)
>
> 我想通过读这篇文章来学习macro legalization，因此可能不会写完。

### WorkFlow

<img src="https://raw.githubusercontent.com/diriLin/blog_img/main/20230607165420.png" style="zoom:50%;" />

分为五个阶段，m代表mix-size circuits，c代表cell. 在初始化(mIP)后，对cells和macros进行place，原理和eplace是一样的；然后对macros进行legalize(mLG)，将macros固定下来；再做一次对cell的gp之后交给dp。

### mLG

mLG输入是mGP输出的解$v_{mGP}$，并假定它的质量是不错的，因此只在小范围内直接通过模拟退火算法移动macros. 

> 模拟退化算法的介绍可以参考本站的[Logic to Layout Week 5 | diri! (diri-lin.top)](https://diri-lin.top/Learning/EDA/Logic-to-Layout-Week-5/#Iterative-Improvement-Placer)或者其他网络内容。

<img src="https://raw.githubusercontent.com/diriLin/blog_img/main/20230607170236.png" style="zoom:50%;" />

mLG的优化目标是
$$
f_{mLG}(v)=HPWL(v)+\mu_DD(v)+\mu_OO_m(v)
$$

+ HPWL即总线长
+ $D(v)$是被macros覆盖的cell的总面积
  + 惩罚系数$\mu_D$在每一轮的开始被初始化为$\dfrac{HPWL(v)}{D(v)}$，理由是$D(v)$在cGP和cDP中也将被转化为线长
+ $O_m(v)$是macros的overlap
  + 惩罚系数$\mu_O$在***第一轮***的开始被初始化为$\dfrac{HPWL(v)+\mu_DD(v)}{O_m(v)}$，此后每一轮被乘以$\beta=1.5$.

模拟退火算法是这样建模的(j, k分别代表mLG和SA循环的轮数)：

+ $\Delta f$是一次移动的HPWL增量（正的，说明HPWL变差了）
+ 温度$t_{j,k}=\Delta f_{\max}(j,k)/\ln 2$
+ 移动被接受的条件是，以均匀分布获取的随机变量$\tau < \exp(-\Delta f/t_{j,k})$
+ $\Delta f_{\max}(j, k)$是这样定义的：
  + $\Delta f_{\max}(j, 0)=0.03\times\beta^j$，这意味着在SA内循环的第一轮，50%的可能被接受的HPWL增量是3%
  + $\Delta f_{\max}(j, k)$线性地递减到$\Delta f_{\max}(j, k_{\max})=0.0001\times\beta^j$
+ 移动的搜索半径$r_{j,k}$是这样定义的：
  + $r_{j,0}=\dfrac{R_x}{\sqrt m}\times0.05\times\beta^j$
  + 没说$k$有啥用……尬住了





