---
title: 年终总结 | 2024 年终总结：「变」
description: 2024 年终总结：「变」。
pubDate: 2024-12-31T13:11:52+08:00
categories:
  - 年终总结
---

2024 年对我来说是个过于难以定义的一年。今年年中的时候我终于下定决定从前司离职，虽然前司的工作环境和与同事之间的人际关系都相当不错，不过技术方面还是和个人的职业发展规划有一些分歧。

之后的事情虽然有一些朋友已经知道了，不过我还是在此处简单提及一下，我于今年十月份回去台湾服兵役，预计在明年的二月会结训。虽然是一段漫长而又煎熬的旅程，不过这段时间并不都是毫无意义的（希望），比如我竟然还能在里面遇到比我小三届的高中学弟，以及有机会和许多台湾的同行有一些交流，都是非常难得的体验。

今年对我来说也算是充满变化的一年吧，所以选择了「变」作为我今年的代表字。

## ML Platform

我在前司主要担任的是机器学习平台开发工程师的工作，在这期间我调研了相当多国内外的产品，包括 Google 的 Vertex AI、AWS 的 SageMaker、阿里云的 PAI 等。

我认为搭建机器学习平台的一个很有意思的地方在于，开发者不仅需要了解基础设施相关的技术，而且也应该要从用户（机器学习工程师、算法工程师、数据科学家等）的视角去了解他们需要平台所提供的功能。这也是当初涉足机器学习领域较少的我选择这个岗位的原因，我希望能够藉由搭建机器学习平台的机会去了解工业界的工程师都是如何使用计算资源的。

但是在实际工作的过程中，我持续在思考一个问题，*我们需要开发的到底是一个什么样的产品？*机器学习平台在现在早已不是一个不成熟的概念，包括数据的管理、训练任务的管理、模型的版本控制以及工作流等，无论是开源的还是闭源的企业级机器学习平台都提供了丰富的解决方案。作为面向主要用户是企业内部人员的工程师，我们必须认识到并不是直接将外部的概念挪用进内部的产品就万事大吉，而更应该思考的是如何将用户既有的使用习惯迁移到新的产品形态上。此处可能就会涉及到一些 Trade Off，如果过于迁就用户整个平台的产品形态可能会过于分散，最后难以收束管理；而过于坚持己见希望推动一些实践方式的话又会对用户带来额外的迁移成本，对用户来说带去的收益也有限。

当然这样的问题应该是不会有什么万能的解答的，持续这样的思考也是作为工程师的「醍醐味」吧。

## Kubernetes

我从研究生的时候就一直关注基于 Kubernetes 的调度与资源管理的相关解决方案。Kueue 和 KWOK 是我近两年都一直在关注的 Kubernetes 社区的项目。Kueue 在项目建立之初我就开始关注了，当时刚好在调研有关多租户资源管理的方案，Kueue 的租户以及工作负载抽象设计相当吸引我，不会和 Volcano 一样一定要和调度的过程耦合在一起，如果希望的话也可以和 scheduler-plugins 搭配在一起使用，我认为是一种自由度相当高的解决方案。

KWOK 是我在调研基于 Kubernetes 的E2E 测试的时候发现的工具，当然它在集成测试与性能测试的时候也都是相当好的工具，搭配 KinD 使用的话甚至都能在本地以很少的资源搭建 Kubernetes 集群运行前述的测试而不会被实际的计算资源限制。

今年我还在线下参加了两次活动，一次是在上海举办的 KCD，一次是在香港举办的 KubeCon China，两次都听到的相当不错的分享，也和一些同行前辈们有了深入的交流，在香港甚至还见到了参加 LFX Mentorship 的时候认识的从未见过的多年网友，我认为这就是线下参加技术展会的最大乐趣了。当然必须要强调的是，作为从学生时代开始每年都在上海参加 KubeCon 的人而言，香港的 KubeCon 的午餐真的好吃非常多（而且还能看着非常漂亮的海景）。

## LLM

2024 年 LLM 是一个绝对绕不过去的话题，无论是学术界还是工业界，LLM 相关的研究与应用都如雨后春笋一般让人目不暇接。今年也幸运地在工作中接触了一些 LLM 相关的内容，算是没有被这股浪潮抛弃在后。2023 年的时候我阅读了 vLLM PagedAttention 的论文，当时我受到了相当大的震撼，从来没有想过能够把内存的管理应用在推理过程的显存管理上，那时候我就觉得一定会有很多推理相关的工作会将操作系统或是其它领域的思想应用在推理过程中。而今年事实上也确实是推理相关的工作百花齐放的一年，各大操作系统会议的论文中有相当大的一部分都是与 LLM Inference 相关的，虽然我本身并不是专门研究 LLM 或是相关的 MLSys 的，不过有空的时候还是会读一下论文了解一下相关的进展与优化。

## 读书

> 书，只要买下来就好了。无论读与不读，只要把自己认为不错的书放在身边，人生就会因此而更加充实。
> ——京极夏彦 

失去自由的这段漫长且痛苦的时间的少数优点是，我又重拾了读书的兴趣。得益于空闲的时间较多，而且手头上也没有电脑，主力的手机也是备用机的 iPhone XS（电池健康度 76% 战损版），我休假的时候基本就是在家里看书。台北有两家书店可以方便地购买到日文书籍：紀伊國屋与ジュンク堂書店。如果店里没有现货的话还会提供订货的服务，基本上一周之后就会空运到货了，周期和我的休假时间也很一致。

可能是由于缺乏自由的缘故，我越来越喜欢看作家的随笔，主要是几位原先我就很喜欢的作家的作品，辻村深月、伊坂幸太郎与森博嗣等。可以从他们的书中感受到与现实生活的联系，也可以了解作家本身的想法，以及对他们与自己作品的看法。

今年我个人最推荐的作品是森博嗣的《喜嶋先生の静かな世界》（喜岛老师的幽静世界），是我今年读到的最触动我的作品，某种意义上来说也是部很适合研究生与软件工程师阅读的作品，读到最后会让人反思自己失败的科研生活（笑）。

## 结语

距离上一次写年终总结已经过了三年，其实实际上在这之间每年接近年末的时候我都会开始提笔，只不过最后都没办法完整地成文然后就作罢了。今年终于也利用离职到兵役之间的空闲时间把博客重构（重写）了一遍，尝试了一些以前一直想尝试却没有机会的技术栈，虽然还有少部分功能没有迁移过来，不过应该还是勉强能看一看的。

其实在本文中还有不少东西想写的，不过纯用手机的话有些内容不大好去搜索，此外有些部分我也只能仰赖记忆去撰写，如有错漏的地方还望谅解。（后续有机会的话会把一些引用的条目补上去。）

（欢迎各位 HR 与猎头在明年二月份之后联系我（Kubernetes 与云原生相关的职位），谢谢。）

那么最后，感谢能看到此处的各位，祝愿各位 2025 年身体康健，诸事顺利。

——写于台湾桃园