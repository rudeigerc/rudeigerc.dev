---
title: 在 Github Actions 中动态地为 Matrix 赋值
description: 本文介绍了如何在 GitHub Actions 中动态地为 Matrix 赋值，以实现在不同的 Event 下运行不同的 Job。
pubDate: 2022-06-13T00:02:32+08:00
categories:
  - DevOps
tags:
  - DevOps
---

最近在参与开源项目 [tensorchord/envd](https://github.com/tensorchord/envd) 的时候，我们遇到了需要动态处理 GitHub Actions 中的 Matrix 的场景，因而撰写本文希望给遇到类似问题的朋友一些参考。

由于该项目在创始之初是私有的，而在私有仓库中 GitHub 对 CI 的使用时间进行了限制，其中 macOS 的权重比较昂贵，因此我们希望只在 Release 的时候运行 macOS 的 CI 来节省使用限额。Release 对应的 GitHub Actions 的 Event 是 Push，可以通过 Git 的 reference 来对推送的内容进行判断，tags 的 reference 会以 `refs/tags/` 打头。

## 在 Job 中使用静态的 Matrix

Matrix 是可以让用户在单个 Job 内自动地根据 Matrix 中变量的组合创建多个 Job 运行的上下文。

```yaml
jobs:
  ...
  test:
    name: test
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest]
    runs-on: ${{ matrix.os }}
    ...
```

官方文档中提供了许多静态地使用 Matrix 的例子[^1]。一个比较常见的使用场景就是用户希望在不同的操作系统上运行测试以确保软件在不同操作系统上的兼容性，在上述的例子中，该 Workflow 可以通过 `matrix.os` 获取定义在 `strategy.matrix` 中的 `os` 的值，并将其传递给 `runs-on`。在 CI 被触发的时候，GitHub Actions 会创建两个并行的 `test` Job，其中一个运行在 `ubuntu-latest` 之上，另一个运行在 `macos-latest` 之上。

## 在 Job 中使用动态的 Matrix

我们的目标在于根据 Push Event 的 ref 来对 `matrix.os` 进行动态赋值，而 Matrix 本身并不支持条件判断，我们需要另寻他法。

### Trial and Error

GitHub Actions 支持行内表达式，所以原先的想法是直接利用 `AND` 和 `OR` 实现分支判断，这个方法有时候在编写前端代码的时候也会运用到。我们希望在 Push Tag 的时候，即 Release 的时候触发 Ubuntu 与 macOS 的测试，默认情况下仅触发在 Ubuntu 上运行测试。使用 `github.event_name == 'push' && startsWith(github.ref, 'refs/tags/')` 表达式可以对 Push 事件的对象是否为 tags 进行判断。

```yaml
jobs:
  ...
  test:
    name: test
    strategy:
      matrix:
        os: ${{ github.event_name == 'push' && startsWith(github.ref, 'refs/tags/') && [ubuntu-latest, macos-latest] || [ubuntu-latest] }}
    runs-on: ${{ matrix.os }}
    ...
```

```plaintext
The workflow is not valid. .github/workflows/CI.yml (Line: 66, Col: 13): Unexpected symbol: '['. Located at position 72 within expression: github.event_name == 'push' && startsWith(github.ref, 'refs/tags/') && [ubuntu-latest, macos-latest] || [ubuntu-latest] .github/workflows/CI.yml (Line: 66, Col: 13): Unexpected value '${{ github.event_name == 'push' && startsWith(github.ref, 'refs/tags/') && [ubuntu-latest, macos-latest] || [ubuntu-latest] }}'
```

在进行了以上尝试之后，我们得到了 GitHub Actions 的报错，根据错误信息可以发现虽然行内表达式的判断结果是符合我们期望的，但是 GitHub Actions 将其返回值当成了普通的 string 而不是 array，因此仅仅通过行内表达式对 Matrix 进行动态赋值是无法成功的。

### 使用 Output 传递参数

通过参考一些文章[^2][^3][^4]，我们发现可以通过 `::set-output`[^5] 在前一个 Job 对输出赋值，将参数传递给需要动态为 Matrix 赋值的 Job。

```yaml
jobs:
  ...
  setup:
    name: setup
    runs-on: ubuntu-latest
    outputs:
      os: ${{ steps.setup.outputs.os }}
    steps:
      - name: setup
        id: setup
        run: |
          if ${{ github.event_name == 'push' && startsWith(github.ref, 'refs/tags/') }}; then
            os='["ubuntu-latest","macos-latest"]'
          else
            os='["ubuntu-latest"]'
          fi
          list=$(echo ${os} | jq -c)
          echo "::set-output name=os::${list}"
  test:
    name: test
    needs: setup
    strategy:
      matrix:
        os: ${{ fromJson(needs.setup.outputs.os) }}
    runs-on: ${{ matrix.os }}
    ...
```

在上述的例子中，我们首先定义一个新的 Job `setup`，在该 Job 中进行与上文相同的判断为 `os` 赋值，接着通过 `jq` 将 `os` 变量从 string 转换成 JSON 格式，并将其赋值给 `setup.outputs.os`。在 `test` Job 中，将 `setup` 设置成 `needs` 即可对其输出进行访问，即通过 `needs.setup.outputs.os` 获取先前在 `setup` Job 中设置成输出的值。我们通过内置的 `fromJson` 函数可以将 JSON 对象作为表达式或是从字符串转换环境变量[^6]，由此可以正确地将 `os` 作为 array 对 `matrix.os` 进行赋值。

## 结语

通过 `::set-output` 与 `fromJson` 的结合，我们就可以动态地为包括 Matrix 在内的 Workflow 中的值进行动态赋值，使得 GitHub Actions 的使用更加具有扩展性。

[^1]: https://docs.github.com/en/actions/using-jobs/using-a-matrix-for-your-jobs

[^2]: Dynamic Matrices in GitHub Actions. https://thekevinwang.com/2021/09/19/github-actions-dynamic-matrix/

[^3]: GitHubActionsでmatrixの値を動的に扱う. https://swfz.hatenablog.com/entry/2021/06/29/195359

[^4]: How to make a Dynamic Matrix in GitHub Actions | Tomas Votruba. https://tomasvotruba.com/blog/2020/11/16/how-to-make-dynamic-matrix-in-github-actions/

[^5]: https://docs.github.com/en/actions/using-workflows/workflow-commands-for-github-actions#setting-an-output-parameter

[^6]: https://docs.github.com/cn/actions/learn-github-actions/expressions#fromjson
