---
title: 排查在 Tekton 中使用来自自签名私有镜像仓库的镜像时的证书问题
description: 本文介绍了排查在 Tekton 中使用来自自签名私有镜像仓库的镜像时的证书问题的症状、原因以及解决方案。
pubDate: 2024-09-09T16:56:35+08:00
categories:
  - Troubleshooting
tags:
  - Kubernetes
  - Tekton
---

## 背景

- Tekton Pipelines

Tasks:

- [`git-clone`](https://hub.tekton.dev/tekton/task/git-clone)
- **[`kaniko`](https://hub.tekton.dev/tekton/task/kaniko)**

## 症状

在 Tekton Pipelines 中运行 `kaniko` Task 时，出现以下错误：

```plaintext
failed to create task run pod "task-run": translating TaskSpec to Pod: error getting image manifest: Get https://registry.private/v2/: x509: certificate signed by unknown authority. Maybe missing or invalid Task default/task
```

## 原因

看到 x509 相关的报错的时候，首先会联想到是证书相关的问题，因为公司内部的私有镜像仓库使用的是自签名证书，可以初步判断是在 Tekton reconcile 过程中的某个步骤没有指定 CA 证书，从而导致了前述错误。

由于先前在使用其它 Task 的时候没有触发过相关问题，仅在 `kaniko` 中会出现，所以起初以为是 `kaniko` 的 Task 本身的问题，尝试了一些修改 `kaniko` 运行参数的方法都没办法解决。
后来通过在 [tektoncd/pipeline](https://github.com/tektoncd/pipeline) 中搜索相关的 Issue 发现，在 [tektoncd/pipeline#3105](https://github.com/tektoncd/pipeline/issues/3105) 中，Tekton 的维护者 [@vdemeester](https://github.com/vdemeester) 在评论中提到：

> It is correct _in a way_. This error happens **before** pulling the image. Tekton is doing some entrypoint magic (cc @bobcatfish @imjasonh for their talk link 😁) : in case no `command` is specified, the controller will try to fetch the image configuration to get the command (`entrypoint` is the "docker" sense)… And this is where it fails, because the tekton controller might not have the certificates available.

前述错误的根本原因在于，Tekton 会对 entrypoint 进行一些 hacking，因此当 Task 中未指定 `command` 的时候，Controller 会尝试访问镜像元数据获取镜像配置中设置的 `entrypoint`，当没有对应的 CA 证书的时候就会报错。

### Walkthrough

我们可以通过嵌套的 error traceback 大致上判断错误发生的位置，大概的调用链如下：

1. `pkg/reconciler/taskrun/taskrun.go#L233` taskrun.Reconciler.ReconcileKind：Tekton `TaskRun` 的主要 Reconcile 逻辑
2. `pkg/reconciler/taskrun/taskrun.go#L221` taskrun.Reconciler.ReconcileKind
3. `pkg/reconciler/taskrun/taskrun.go#L660` taskrun.Reconciler.reconcile
4. `pkg/reconciler/taskrun/taskrun.go#L656` taskrun.Reconciler.reconcile
5. `pkg/reconciler/taskrun/taskrun.go#L905` taskrun.Reconciler.createPod：根据 `Task` 的配置构建 Pod
6. `pkg/reconciler/taskrun/taskrun.go#L899` taskrun.Reconciler.createPod
7. `pkg/pod/pod.go#L265` pod.Build：根据 `TaskRun` 与 `TaskSpec` 构建 Pod
8. `pkg/pod/entrypoint_lookup.go#L75` pod.resolveEntrypoints：针对没有指定 `command` 的所有 `step`，获取对应镜像的 `entrypoint`
9. `pkg/pod/entrypoint_lookup_impl.go#L82` pod.entrypointCache.get
10. `google/go-containerregistry/pkg/v1/remote/descriptor.go#L73` remote.Get：基于镜像 Reference 返回对应的 Descriptor
11. `google/go-containerregistry/pkg/v1/remote/puller.go#L94` remote.puller.Get
12. `google/go-containerregistry/pkg/v1/remote/fetcher.go#L103` remote.fetcher.get
13. `google/go-containerregistry/pkg/v1/remote/fetcher.go#L129` remote.fetcher.fetchManifest：通过镜像 Reference 向镜像存储发送请求获取镜像相关的元数据

因此，实际上是在最后一步通过 `f.client.Do(req.withContext(ctx))` 发送 HTTP 请求的时候触发了 x509 相关的错误。

### 小结

通过查询相关的 Issue，以及分析错误的调用链，我们可以判断前述问题主要是由于 Tekton 在基于 `Task` 构建对应的 Pod 的时候，针对没有指定 `command` 的 `step` 的时候会去获取相应的镜像的 `entrypoint` 填充，由此导致了在发送请求的时候 x509 证书验证错误。

## 解决方案

在 [tektoncd/pipeline#2787](https://github.com/tektoncd/pipeline/pull/2787) 之后，可以在 `config-registry-cert` ConfigMap 中添加自签名的 CA 证书。

通过 `openssl` 获取特定域名的 CA 证书：

```shell
echo | openssl s_client -connect example.com:443 2>/dev/null | openssl x509
```

将证书内容添加到 `config-registry-cert` ConfigMap 中：

```shell
kubectl edit cm -n tekton-pipelines config-registry-cert
```

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: config-registry-cert
  namespace: tekton-pipelines
  labels:
    app.kubernetes.io/instance: default
    app.kubernetes.io/part-of: tekton-pipelines
data:
  cert: |
    -----BEGIN CERTIFICATE-----
    ...
    -----END CERTIFICATE-----
```

(Reference: [pipeline/config/config-registry-cert.yaml](https://github.com/tektoncd/pipeline/blob/main/config/config-registry-cert.yaml))

随后重启 Tekton Pipeline 对应的 Deployment 即可。

## 参考

- [Additional Configuration Options | Tekton](https://tekton.dev/vault/pipelines-main/additional-configs/#configuring-self-signed-cert-for-private-registry)

相关 Issue：

- [tektoncd/pipeline#1171 - x509 certificate signed by unknown authority](https://github.com/tektoncd/pipeline/issues/1171)
- [tektoncd/pipeline#3105 - translating TaskSpec to Pod: error getting image manifest](https://github.com/tektoncd/pipeline/issues/3105)

相关仓库：

- [golang/go](https://github.com/golang/go)
- [tektoncd/pipeline](https://github.com/tektoncd/pipeline)
- [google/go-containerregistry](https://github.com/google/go-containerregistry)
