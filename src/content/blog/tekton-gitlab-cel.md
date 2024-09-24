---
title: 在 Tekton 中使用 CEL 表达式过滤 GitLab Webhook 事件的文件变更
description: 本文介绍了如何在使用 GitLab 作为代码存储库的时候，在 Tekton Triggers 中基于 CEL Interceptor 利用 CEL 表达式实现对变更文件的过滤，并触发相对应的流水线。
pubDate: 2024-02-15T17:43:55+08:00
categories:
  - Tekton
  - GitOps
tags:
  - Tekton
  - CEL
---

## TL;DR

在 Tekton Triggers 的 CEL Interceptor 中使用 CEL 表达式实现 Python 项目文件变更的过滤：

```text
body.commits.map(commit, commit.added + commit.modified + commit.removed).exists(files, true in files.map(file, matches(file, "^(src|tests)|^pyproject.toml$")))
```

```yaml
triggers:
  - name: gitlab-listener
    interceptors:
      - ref:
          name: gitlab
          kind: ClusterInterceptor
        params:
          - name: secretRef
            value:
              secretName: gitlab-secret
              secretKey: secretToken
          - name: eventTypes
            value:
              - Push Hook
      - ref:
          name: cel
          kind: ClusterInterceptor
        params:
          - name: filter
            value: body.commits.map(commit, commit.added + commit.modified + commit.removed).exists(files, true in files.map(file, matches(file, "^(src|tests)|^pyproject.toml$")))
          - name: overlays
            value:
              - key: truncated_sha
                expression: body.pull_request.head.sha.truncate(7)
              - key: branch_name
                expression: body.ref.split("/")[2]
```

## 背景

在 CI/CD 平台中，通过过滤提交到 Git 的文件变更来触发不同的流水线是一种常见的需求，如在开发流程中过滤代码相关文件变更触发测试流水线，在发布流程中通过过滤 Tag Push 事件触发发布流水线等。

如在 Github Actions 中，可编写如下配置使得在 `push` 事件发生并且文件变更包含 JavaScript 文件时会触发工作流。

```yaml
on:
  push:
    paths:
      - "**.js"
```

### Tekton Triggers

在 Tekton 中，Tekton Triggers 中的 EventListener 与 Trigger 负责拦截各种事件，并根据自定义资源的定义触发相应的流水线。具体的流程如下：

1. 代码存储库中发生事件；
2. 根据代码存储库的 Webhook 的配置，发送 POST 请求至指定的地址；
3. Tekton Triggers 的 EventListener Service 接收 Webhook 事件；
4. EventListener 触发对应的 Trigger 并通过 Trigger 中定义的 Interceptor，Interceptor 的职能包括 Token 验证与事件过滤等；
5. Trigger 通过 TriggerTemplate 与 TemplateBinding 创建对应的 TaskRun 或 PipelineRun。

用户可以自行编排流水线来实现自身的使用需求，如在流水线结束后通过 IM 发送流水线运行的结果。

### CEL

通用表达式语言（Common Express Language，CEL）[^cel]是 Google 开源的非图灵完备语言，用于实现表达式评估的常见语义。目前 CEL 被应用于 Kubernetes 的 API 验证规则与策略规则中[^kubernetes-cel][^kubernetes-crd-validation-using-cel]，以及 Google Cloud 的部分服务中，如 Secure Web Proxy[^secure-web-proxy-cel]。

Tekton 提供了 CEL Interceptor 用于在 Trigger 中使用 CEL 表达式来过滤或修改事件的 Payload。

### Interceptors

Tekton Triggers 的 Interceptor 是一种事件处理器，它会在 TriggerBinding 之前运行，便于用户对事件的 Payload 进行拦截、修改与验证等操作，也可将修改过的 Payload 的部份传递给 TriggerBinding，进而传递给具体运行流水线的 TaskRun 或 PipelineRun。

如果用户使用的代码存储库是 GitHub 的话，Trigger 中的 GitHub Interceptor 提供了 `addChangedFiles` 参数，可在 CEL Interceptor 中使用 `extensions.changed_files` 来获取变更的文件[^tekton-interceptor-adding-changed-files]，并结合 CEL 表达式进行条件判断决定是否触发对应的 Pipeline。

```yaml
triggers:
  - name: github-listener
    interceptors:
      - ref:
          name: "github"
          kind: ClusterInterceptor
          apiVersion: triggers.tekton.dev
        params:
          - name: "secretRef"
            value:
              secretName: github-secret
              secretKey: secretToken
          - name: "eventTypes"
            value: ["pull_request", "push"]
          - name: "addChangedFiles"
            value:
              enabled: true
      - ref:
          name: cel
        params:
          - name: filter
            # execute only when a file within the controllers directory has changed
            value: extensions.changed_files.matches('controllers/')
```

然而，上述的参数在 GitLab 与 BitBucket Interceptor 中并不支持，两者都仅支持简易的 Token 验证（`secretRef`）以及事件类型的过滤（`eventTypes`），因此如果要在使用 GitLab 或 BitBucket 的情况下实现文件变更的过滤的话，除了对 Tekton Triggers 有关 Interceptor 的部份[^tekton-triggers-interceptors-gitlab][^tekton-triggers-interceptors-bitbucket]进行修改以外，只能尝试通过 CEL 表达式来实现相应的效果。

## 过滤 GitLab Webhook 事件的文件变更

GitLab Webhook 的文档[^gitlab-webhook-push-events]给出了 Push Event 被触发的时候的 Payload 的例子：

```json
{
  "object_kind": "push",
  "event_name": "push",
  "before": "95790bf891e76fee5e1747ab589903a6a1f80f22",
  "after": "da1560886d4f094c3e6c9ef40349f7d38b5d27d7",
  "ref": "refs/heads/master",
  "ref_protected": true,
  "checkout_sha": "da1560886d4f094c3e6c9ef40349f7d38b5d27d7",
  "user_id": 4,
  "user_name": "John Smith",
  "user_username": "jsmith",
  "user_email": "john@example.com",
  "user_avatar": "https://s.gravatar.com/avatar/d4c74594d841139328695756648b6bd6?s=8://s.gravatar.com/avatar/d4c74594d841139328695756648b6bd6?s=80",
  "project_id": 15,
  "project": {
    "id": 15,
    "name": "Diaspora",
    "description": "",
    "web_url": "http://example.com/mike/diaspora",
    "avatar_url": null,
    "git_ssh_url": "git@example.com:mike/diaspora.git",
    "git_http_url": "http://example.com/mike/diaspora.git",
    "namespace": "Mike",
    "visibility_level": 0,
    "path_with_namespace": "mike/diaspora",
    "default_branch": "master",
    "homepage": "http://example.com/mike/diaspora",
    "url": "git@example.com:mike/diaspora.git",
    "ssh_url": "git@example.com:mike/diaspora.git",
    "http_url": "http://example.com/mike/diaspora.git"
  },
  "repository": {
    "name": "Diaspora",
    "url": "git@example.com:mike/diaspora.git",
    "description": "",
    "homepage": "http://example.com/mike/diaspora",
    "git_http_url": "http://example.com/mike/diaspora.git",
    "git_ssh_url": "git@example.com:mike/diaspora.git",
    "visibility_level": 0
  },
  "commits": [
    {
      "id": "b6568db1bc1dcd7f8b4d5a946b0b91f9dacd7327",
      "message": "Update Catalan translation to e38cb41.\n\nSee https://gitlab.com/gitlab-org/gitlab for more information",
      "title": "Update Catalan translation to e38cb41.",
      "timestamp": "2011-12-12T14:27:31+02:00",
      "url": "http://example.com/mike/diaspora/commit/b6568db1bc1dcd7f8b4d5a946b0b91f9dacd7327",
      "author": {
        "name": "Jordi Mallach",
        "email": "jordi@softcatala.org"
      },
      "added": ["CHANGELOG"],
      "modified": ["app/controller/application.rb"],
      "removed": []
    },
    {
      "id": "da1560886d4f094c3e6c9ef40349f7d38b5d27d7",
      "message": "fixed readme",
      "title": "fixed readme",
      "timestamp": "2012-01-03T23:36:29+02:00",
      "url": "http://example.com/mike/diaspora/commit/da1560886d4f094c3e6c9ef40349f7d38b5d27d7",
      "author": {
        "name": "GitLab dev user",
        "email": "gitlabdev@dv6700.(none)"
      },
      "added": ["CHANGELOG"],
      "modified": ["app/controller/application.rb"],
      "removed": []
    }
  ],
  "total_commits_count": 4
}
```

可以发现主要需要关注的是 `commits` 数组中的 `added`、`modified` 与 `removed` 的部份，只需要将每个 commit 中的三者结合起来并过滤掉重复的部分，即可得到一次 Push Event 中整体的文件变更的列表。

如果使用如 JavaScript 等对函数式支持比较好的语言的话，可以通过 `flatMap()` 与 `filter()` 的组合来获取所有的变更文件：

```javascript
body.commits
  .flatMap((commit) => commit.added.concat(commit.modified, commit.removed))
  .filter((item, index, array) => array.indexOf(item) === index);
```

但是由于 CEL 表达式不支持类似 `flatten()` 或是 `reduce()` 之类的降维操作，需要采用一点迂回的方法才能实现相同的效果：

```text
body.commits.map(commit, commit.added + commit.modified + commit.removed).exists(files, true in files.map(file, matches(file, "^(app|tests)|^Gemfile$")))
```

1. 将 `commits` 数组中的 `added`、`modified` 与 `removed` 合并为二维数组（`e.map(x, t)`）。结果为 `[['CHANGELOG', 'app/controller/application.rb'], ['CHANGELOG', 'app/controller/application.rb']]`。
2. 判断是否存在某个 commit 中的变更文件满足模式 `true in files.map(file, matches(file, "^(app|tests)|^Gemfile$"))`（`e.exists(x, p)`）。结果为 `true in [true, true] = true`。
   1. 判断是否存在某个文件满足正则表达式 `^(app|tests)|^Gemfile$`（`matches(x, p)`）。结果为 `[false, true]`。

`matches` 支持在匹配的模式中使用正则表达式，只需要对这部份进行修改就可以满足不同使用场景。在前述的例子中，该表达式会过滤以 `app` 与 `tests` 开头的文件以及 `Gemfile` 文件的变更。

### 验证 CEL 表达式

Tekton Triggers 提供了一个 `cel-eval` 工具，可以用来验证 CEL 表达式的行为是否符合期望。

```shell
go install github.com/tektoncd/triggers/cmd/cel-eval@latest
```

> 由于 Tekton Triggers 在 `go.mod` 中使用 `replace` 替换了部分 Kubernetes 相关的包，因此在 `go install` 的时候会失败。目前只能直接 clone 仓库并通过 `make bin/cel-eval` 来编译。

```shell
git clone github.com/tektoncd/triggers --depth 1
cd triggers
make bin/cel-eval
```

我们基于前文所提到的 GitLab 的文档中所给出的 Push Event 的 Payload 作为例子来验证 CEL 表达式。

将前述的 CEL 表达式保存到 `expression.txt` 文件中，并将前述的事件的 Payload 写入 `http.txt` 中（替换省略号的部分）。

> 注意：应根据实际的 Payload 的长度修改 `Content-Length`。

```http
POST /foo HTTP/1.1
Content-Length: 2589
Content-Type: application/json
X-Header: tacocat

...
```

将 `expression.txt` 作为表达式文件，`http.txt` 作为 HTTP 请求文件作为参数输入 `cel-eval`：

```shell
cel-eval -e expression.txt -r http.txt
```

如果 CEL 表达式的结果符合预期的话，`cel-eval` 会返回 `true`，否则返回 `false`。

```shell
true
```

根据 GitLab Webhook Push 事件的 Payload 的例子，该事件中的变更文件为 `['CHANGELOG', 'app/controller/application.rb']`，由于 `app/controller/application.rb` 以 `app` 开头满足正则表达式，所以该 CEL 表达式的结果为 `true`。可以在自行修改 `expression.txt` 与 `http.txt` 的内容以验证不同的 CEL 表达式以及不同的 Payload。

## 结语

本文介绍了如何在使用 GitLab 作为代码存储库的时候，在 Tekton Triggers 中基于 CEL Interceptor 利用 CEL 表达式实现对变更文件的过滤，并触发相对应的流水线。

当然，如果能够在和 GitHub Interceptor 一样在 Tekton Triggers 的代码中直接在 GitLab Interceptor 中集成 `addChangedFiles` 参数的话会更为理想，这样就可以通过在 CEL Interceptor 中使用 `extensions.changed_files.matches('^(app|tests)|^Gemfile$')` 来实现和本文介绍的内容相同的效果。

[^kubernetes-cel]: [Kubernetes 中的通用表达式语言 | Kubernetes](https://kubernetes.io/zh-cn/docs/reference/using-api/cel/)

[^kubernetes-crd-validation-using-cel]: [Kubernetes CRD Validation Using CEL | Google Open Source Blog](https://opensource.googleblog.com/2023/11/kubernetes-crd-validation-using-cel.html)

[^secure-web-proxy-cel]: [CEL matcher language reference | Secure Web Proxy | Google Cloud](https://cloud.google.com/secure-web-proxy/docs/cel-matcher-language-reference)

[^tekton-interceptor-adding-changed-files]: [Tekton](https://tekton.dev/docs/triggers/interceptors/#adding-changed-files)

[^tekton-triggers-interceptors-gitlab]: https://github.com/tektoncd/triggers/blob/main/pkg/interceptors/gitlab/gitlab.go

[^tekton-triggers-interceptors-bitbucket]: https://github.com/tektoncd/triggers/blob/main/pkg/interceptors/bitbucket/bitbucket.go

[^cel]: [google/cel-spec: Common Expression Language](https://github.com/google/cel-spec)

[^gitlab-webhook-push-events]: [Webhook events | GitLab](https://docs.gitlab.com/ee/user/project/integrations/webhook_events.html#push-events)
