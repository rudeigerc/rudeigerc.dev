---
title: 翻译 | 为 Kubernetes 编写良好的 e2e 测试
description: 本文为 Writing good e2e tests for Kubernetes 的译文，其主要目的在于介绍如何为 Kubernetes 编写良好的 e2e 测试。
pubDate: 2021-04-10T22:28:26+08:00
categories:
  - Translation
tags:
  - Kubernetes
  - Testing
---

> 本文为 [Writing good e2e tests for Kubernetes (978aa3fb5b)](https://github.com/kubernetes/community/blob/978aa3fb5b/contributors/devel/sig-testing/writing-good-e2e-tests.md) 的译文。

## 模式与反模式

### e2e 测试的目标

除了提供端到端系统的测试覆盖这个明显的目标之外，在设计、编写与调试端到端测试时，还有一些不是很明显的目标需要记住。
尤其是“不稳定的（flaky）”测试，即大部分时间通过，但是由于难以定位的原因而导致间歇性失败的的测试，这些测试在模糊我们的回归信号与减慢我们的自动合并速度方面具有高昂的代价。
花费前期的时间和努力将你的测试设计成可靠的是非常有价值的事情。
请谨记，我们有数以百计的测试，每个测试都在数十个不同环境当中运行，如果任何一个测试在任何一个测试环境中失败了，我们必须假设我们有某种潜在的退化。
所以如果大量的测试哪怕只有 1% 的时间失败了，基本的统计学决定了我们几乎永远不会有“绿色”的回归指标。
换句话说，在持续集成环境的残酷现实当中，编写一个只有 99% 可靠度的测试几乎是毫无用处的。
事实上这比无用还要糟糕，因为其不仅不能提供可靠的回归指标，而且还会消耗大量后续的调试时间，以及延迟的合并。

#### 可调试性

如果你的测试失败了，它应该在其输出当中尽可能详细地提供其失败的原因。
“Timeout”并不是一个有用的错误信息。
“Timed out after 60 seconds waiting for pod xxx to enter running state, still in pending state”对于试图弄清楚为什么你的测试失败以及应该如何处理的人来说更为有用。
具体而言，如下所示的[断言](https://onsi.github.io/gomega/#making-assertions)代码会产生相当无用的错误：

```go
Expect(err).NotTo(HaveOccurred())
```

更应该用这样的方式[注解](https://onsi.github.io/gomega/#annotating-assertions)你的断言：

```go
Expect(err).NotTo(HaveOccurred(), "Failed to create %d foobars, only created %d", foobarsReqd, foobarsCreated)
```

另一方面，过于冗长的日志，尤其是针对非错误条件的，会使弄清楚测试是否失败与失败的原因产生不必要的困难，所以也不要在日志中记录太多不相关的东西。

#### 在非专用的测试集群中运行的能力

在运行 e2e 测试的时候，为了减小端到端的言辞以及提高资源利用率，我们尽可能地尝试在相同的测试集群之中并行运行大量的测试，这意味着：

1. 你应该避免做出任何你的测试是唯一在集群之上运行的东西的假设（无论是隐式的还是显式的）。
   举例来说，做出你的测试可以在集群当中的每一个节点上运行一个 pod 的假设并不是安全的，因为一些和你的测试同时运行的其它的测试可能已经使得集群中的一个或者多个节点饱和。
   例如，在系统 namespace 当中运行一个 pod，并且假设其会使得系统 namespace 当中的 pod 的数量会增加一个也是不安全的，因为一些其它的测试可能会与你的测试同时在系统 namespace 中创建或删除 pod。如果你确实合理地需要像那样编写一个测试，确保给它打上了“[[Serial]”](https://github.com/kubernetes/community/blob/978aa3fb5b5593aed4b11ee0cc45ab9dcd16e5e8/contributors/devel/sig-testing/e2e-tests.md#kinds-of-tests)的标签，这样便于识别，并且不会和任何其它的测试并行运行。
2. 你应该避免在同一时间对集群做一些让其它测试难以可靠地做它们要做的事情。
   例如，重启节点、断开网络接口或者升级集群软件作为测试的一部分，这些很可能会违反其它测试对合理稳定的集群环境可能做出的假设。
   如果你需要编写这样的测试，请为其打上[“[Disruptive]”](https://github.com/kubernetes/community/blob/978aa3fb5b5593aed4b11ee0cc45ab9dcd16e5e8/contributors/devel/sig-testing/e2e-tests.md#kinds-of-tests)的标签，这样便于识别，并且不会和任何其它的测试并行运行。
3. 你应该避免对 Kubernetes API 做出不属于 API 规范的假设，因为一旦这些假设失效，你的测试就会崩溃。
   例如，依赖特定的 Event、Event reason 或者 Event 消息会让你的测试变得非常脆弱。

#### 执行速度

我们有数以百计的 e2e 测试，其中一些在某些情况下我们串行运行，一个接一个。
如果每个测试只需要几分钟的时间运行，这会很快累加成很多很多小时的总执行时间。
我们尽量把这样的总执行时间控制在最多几十分钟之内。
因此，尽量（非常努力地）将你的单个测试的执行时间控制在两分钟一下，最好比这个时间更短。
具体而言，在测试中加入不适当的长时间的‘sleep’语句或者其它无理由的等待是一个杀手。
如果在正常情况下你的 pod 在十秒钟内进入 running 的状态，然后 99.9% 的时间在三十秒内进入该状态，那么为此等待五分钟是没有必要的。
更应该直接在三十秒后失败，并且附上明确的错误信息，说明其失败的原因（例如，“Pod x failed to become ready after 30 seconds, it usually takes 10 seconds”）。
如果你确实有合理的理由需要等待更长的时间，或者编写运行时间超过两分钟的测试，请在代码中非常清楚地注释为什么这是必要的，并且将其标注为[“[Slow]”](https://github.com/kubernetes/community/blob/978aa3fb5b5593aed4b11ee0cc45ab9dcd16e5e8/contributors/devel/sig-testing/e2e-tests.md#kinds-of-tests)，这样便于识别和避免在需要及时完成的测试中运行（例如那些在被允许合并之前针对每一个代码提交运行的测试）。
需要注意的是，只有在测试通过时是在两分钟内完成一般是不够好的。
你的测试应该在合理的时间内失败。
例如，我们曾经看到一些测试，为了让每个 pod 变成 ready 的状态等待了长达十分钟的时间。
在良好的条件下这些测试可能会在几秒钟内通过，但是如果这些 pod 从未变成 ready 的状态（例如由于系统退化），这些测试会花费非常长的时间才能失败，这通常会导致整个测试运行超时，因此不会产生任何结果。
再次，这比起在系统无法正常工作时，在一两分钟内就能可靠地失败的测试要无用的多。

#### 针对相对罕见且临时的基础设施故障或延迟的恢复能力

请记住你的测试将在白天和夜晚的不同时间，可能在不同云提供商上，在不同的负载条件下，运行成千上万次。
这些系统的底层状态往往存储在最终一致的数据存储之中。
所以，例如，如果一个创建资源的请求是理论上异步的，即使你观察到它在大多数的时间实际上是同步的，编写测试时也要假设它是异步的（例如，进行“创建”调用，并轮询或观察资源直到其处于正确的状态才继续处理）。
同样，不要假设 API 端点是 100% 可用的。
它们并非如此。
在高负载的条件下，API 调用可能会暂时失败或超时。
在这样的情况之下退避或重试数次是合适的（在这种情况下使错误信息非常清楚地说明发生了什么，例如，“Retried http://... 3 times - all failed with xxx”）。
请使用下面详细介绍的库当中提供的标准重试机制。

### 一些具体的工具供你使用

显然上述大部分目标适用于许多测试，不仅仅是你的。
所以我们开发了一系列可重用的测试基础设施、库与最佳实践来帮助你做正确的事情，或者至少和其它测试做相同的事情，这样如果后来发现是错误的，就可以在一个地方修复使其成为正确的，而不是上百个地方。

这里有几个要点：

- [e2e 框架](https://git.k8s.io/kubernetes/test/e2e/framework/framework.go)：
  使你自己熟悉这个测试框架以及如何使用它。
  其中，它可以自动创建唯一命名的 namespace 使你的测试能够在其中运行以避免命名冲突，并且在测试完成之后可靠地自动清理混乱（它只是删除了 namespace 中的所有东西）。
  这有助于确保测试不会泄漏资源。
  需要注意的是，删除一个 namespace（也意味着其中的一切）目前是一个昂贵的操作。
  因此，你创建的资源越少，框架所需要做的清理工作越少，你的测试（以及与你的测试并发运行的其它测试）完成得越快。
  你的测试应该始终使用这个框架。
  事实证明尝试其它自创的方法来避免命名冲突和资源泄漏是一个非常糟糕的主意。

- [e2e 工具库](https://git.k8s.io/kubernetes/test/e2e/framework/util.go)：
  这个方便的库提供了大量的可重用的代码，用于许多需要的常用测试功能，包括等待资源进行指定的状态，安全且一致地重试失败的操作，有效地报告错误等。
  确保你熟悉了那里可用的内容并使用它。
  同样，如果你遇到了一个普遍有用的机制，而那里还未实现，你可以将其加入库中这样其他人就能从你的智慧中受益。
  尤其要注意文件顶部中德各种超时和重试相关的常量。
  一定要尽量重用这些常量而不是自行定义。
  即使这些值可能并不是你想要使用的（超时时间、重试次数等），但是在整个测试套件中保证其一致并且中心化配置的好处通常会超过你的个人偏好设置。

- **遵循稳定的且编写良好的测试用例：**
  我们现有的一些端到端测试比其它测试写得更好更可靠。
  编写良好的测试的几个例子包括：[Replication Controllers](https://git.k8s.io/kubernetes/test/e2e/apps/rc.go)、[Services](https://git.k8s.io/kubernetes/test/e2e/network/service.go) 与 [Reboot](https://git.k8s.io/kubernetes/test/e2e/cloud/gcp/reboot.go)。
- [Ginkgo 测试框架](https://github.com/onsi/ginkgo)：
  这是我们的 e2e 测试基于的测试库与运行器。
  在你编写或重构一个测试之前，请阅读文档并确保你了解它是如何工作的。
  尤其需要注意的是每个测试都是由 `Describe` 子句和嵌套的 `It` 子句组合而成的，这是唯一的标识和描述（例如，在测试报告中）。所以例如，`Describe("Pods",...).... It(""should be scheduled with cpu and memory limits")` 会产生一个正常的测试标识符和描述符 `Pods should be scheduled with cpu and memory limits`，这明确了正在被测试的是什么，以及如果因此失败的话什么是不工作的。其它好的例子包括：

```text
   CAdvisor should be healthy on every node
```

以及

```text
   Daemon set should run and stop complex daemon
```

反之（这些都是真实的例子），以下是不大好的测试描述符：

```text
   KubeProxy should test kube-proxy
```

以及

```text
Nodes [Disruptive] Network when a node becomes unreachable
[replication controller] recreates pods scheduled on the
unreachable node AND allows scheduling of pods on a node after
it rejoins the cluster
```

一种改进可能是

```text
Unreachable nodes are evacuated and then repopulated upon rejoining [Disruptive]
```

需要注意的是，我们欢迎为了具体且更好的工具开启 issue，更欢迎其代码实现。

### 资源使用

当编写测试时，测试当中使用的资源应该被具体且理智地选择。

因此，使用的资源：

1. 适合于测试的
2. 低开销的（包含较小的或没有额外开销）
3. 创建恰当数量的
4. 需要在测试结束后进行清理的

是重要的。例如：

1. 只使用适合 `test/e2e/<AREA>/<SPECIFIC_AREA>` 的资源类型
2. 资源类型 `ConfigMap` 是低开销、通用和无状态的。
   它应该被用于获取已创建的资源
3. 虽然用于测试的集群一般都很强大，但是不应该创建过多的资源，因为是不必要的
4. 使用 `afterEach`，确保你的测试销毁了测试当中遗留的任何资源

### 日志

当编写测试时，对所发生的事情进行日志的记录（至少在给定的测试的开发过程中）通常是很有用的。
要进行日志记录，需要导入 `framework` 模块。
一旦导入，在测试中你就可以调用 `framework.Logf`。

#### 使用范例

1. 打印包裹在一个字符串中的单个字符串

```go
testvar := "Hello World"
framework.Logf("Logf says: '%v'", testvar)
```

2. 打印一个字符串和包裹在字符串中的数字。

```go
testvar1 := "a string"
testvar2 := 1
framework.Logf("testvar1: %v; testvar2: %v", testvar1, testvar2)
```

要获取更多信息，请参考[框架的文档](https://godoc.org/k8s.io/kubernetes/test/e2e/framework#Logf)。
