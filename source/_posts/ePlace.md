---
title: ePlace
date: 2023-05-07 23:12:12
categories: Paper-reading
tags: EDA
mathjax: true
---

> Gossip: 好久没有更新了，主要是陷入了毕设的苦战，经常没空看书。和组里老哥接上线并且联系到同年的两位老哥之后，更加感觉自己无比的废物。但好在毕设已经接近尾声，我可以准备下一阶段的工作了。

这篇blog是我阅读[ePlace: Electrostatics-Based Placement Using Fast Fourier Transform and Nesterov's Method](https://dl.acm.org/doi/10.1145/2699873)所做的笔记，但主要是为了阅读另一篇文章服务的，所以我不会读完再更，而是写到哪里更到哪里。

## Essential Concepts

超图$G=\{V, E, R\}$: $V=V_m\cup V_f$是节点的集合，指movable cells和fixed macros；$E$是net的集合，而net不是传统意义上的边，它可能连接多个cell，所以E是set of hyperedges；$R$是placement region.

HPWL: 围住net的最小矩形的半周长，ePlace的主要优化目标。
$$
HPWL_e(\mathbf{v})=\max _{i, j \in e}\left|x_i-x_j\right|+\max _{i, j \in e}\left|y_i-y_j\right|
$$
显然这是不可微的，文中提到的近似包括Log-Sum-Exp(LSE):
$$
W_e(\mathbf{v})=\gamma(\ln \sum_{i\in e}\exp (\dfrac{x_i}{\gamma}) + \ln \sum_{i\in e}\exp (\dfrac{-x_i}{\gamma}))
$$
其中$e=\{(x_1,y_1), \ldots, (x_n,y_n)\}$是包含$n$个连接点的net, 而$\gamma$是控制近似精度的超参数，它使得LSE对HPWL的误差在$\varepsilon_{LSE}\le \gamma\ln n$范围内；以及Weighted Average(WA):
$$
W_e(\mathbf{v})=(\dfrac{\sum_{i\in e}x_i\exp (x_i/\gamma)}{\sum_{i\in e}\exp (x_i/\gamma)}-\dfrac{\sum_{i\in e}x_i\exp (-x_i/\gamma)}{\sum_{i\in e}\exp (-x_i/\gamma)})
$$
其误差在$\varepsilon_{WA}\le \dfrac{\gamma\Delta x}{1+\exp \Delta/n}$范围内。

密度：将$R$均匀分解为$m\times m$的网格$B$，对其中的一个网格$b$，定义其密度为
$$
\rho_b(\mathbf{v})=\sum_{i \in V} l_x(b, i) l_y(b, i)
$$
对节点$i$而言，$l_x(b, i)$是其与$b$的在x方向上的overlap，$l_y$同理。因此有密度上的约束条件：
$$
\min _{\mathbf{v}} H P W L(\mathbf{v}) \text { s.t. } \rho_b(\mathbf{v}) \leq \rho_t, \forall b \in B
$$
由于$|B|$可能非常大非常麻烦，因此需要一个等价的全局约束$N(\mathbf{v})=0$来替代它，并被加入优化目标中：
$$
\min_{\mathbf{v}}f(\mathbf{v})=W(\mathbf{v})+\lambda N(v)
$$

## eDensity

> Gossip: 我也想要这么大个脑洞啊，说到底我之前做的生信炼丹也是一种抽象，就是将生物信息问题抽象成自然语言序列的问题，进而用NLP的方法去处理，但是倒过来的话我感觉用其他领域的概念去对计算机领域的概念进行建模有点困难，主要是其他的知识也没有储备很多，所以真的需要广泛涉猎……

这一段是这篇文章的***核心***。在网格的边界处，上面提到的密度同样是不可微的，因此需要近似。

<img src="https://raw.githubusercontent.com/diriLin/blog_img/main/20230508005007.png"/>
<center>密度抽象</center>

***最关键的抽象在于，两个cell应该以什么方式进行排斥？这篇文章的想法是按照库仑斥力的方式。***

密度惩罚项$N(\mathbf{v})$被抽象为电势能(见上图)，其中$\psi_{i}$是电荷$i$所在位置的电势，对于多个点电荷产生的电场，其某个位置$\psi(x,y)$的电势即各点电荷在此产生的电势之和。

根据高斯定理，网格内的电势分布$\psi(x,y)$的梯度即是电场分布：
$$
\mathbf{\xi}(x,y) = -\nabla\psi(x,y)
$$
这样优化目标就变得可微了。但是，在这个抽象里cell和macro的实例都被抽象成正点电荷，因而所有点电荷都在斥力的作用下向网格边缘扩散，还需要其他的约束条件：

+ 根据泊松定理，电荷密度是电场分布的散度：
  $$\rho(x,y)=\nabla\cdot\mathbf{\xi}(x,y)=-\nabla\cdot\nabla\psi(x,y)$$
+ 去除电场直流分量，即令电势分布加上一个常数，使得
  $$\iint_R\psi(x,y)=0 $$
  这也使得电场中某些地方的电荷密度为负数，即产生了将正点电荷向此处吸引的趋势，而且从泊松定理有$\iint_R\rho(x,y)=0 $.
+ 点电荷扩散至在网格边缘处必须停下，不应再向外扩散，记边缘$\partial R$处的法向量为$\hat{\mathbf{n}}$，则：
  $$\hat{\mathbf{n}}\cdot\nabla\psi(x,y)=\mathbf{0}, (x,y)\in \partial R $$

## filler insertion

好怪啊，这又是一种反过来抑制正点电荷之间斥力，使得cells spread到所有可放置区域的办法。它的想法是通过插入一些的可以移动但不能连线的filler cells，迫使实际放置的movable cells向中间聚集，这些fillers占据的总面积受到
$$A_{fc}=\rho_t A_{ws}-A_m $$
约束。除此之外，还可以指定一些固定的区域为dark nodes，它们虽然占据空间$A_d$，但不计入上述的约束中。在完成placement之后，这些填充物都需要去除。

<img src="https://raw.githubusercontent.com/diriLin/blog_img/main/20230508160303.png"/>

在插入之后，计算电势分布$\rho(x,y)$时应该考虑超集$V'=V_m\cup V_f\cup V_{fc}\cup V_d$，然后在梯度回传时只更新$V_m, V_fc$即可。
（未完待续……）


