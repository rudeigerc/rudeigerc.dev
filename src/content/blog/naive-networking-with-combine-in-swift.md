---
title: "Naive Networking with Combine in Swift"
description: Combine 是苹果在 WWDC 提出的两大开发框架之一，该框架提供了一个声明式的 Swift API 去处理异步的事件。本文主要结合基于 Moya 并结合 Combine 自定义了一个简单的网络抽象层，在结合响应式编程的同时又能优雅地对网络请求的数据流进行处理。
pubDate: 2019-12-28T21:22:51+08:00
categories:
  - iOS
tags:
  - iOS
  - Swift
  - Combine
---

## Introduction

[Combine](https://developer.apple.com/documentation/combine) 和 [SwiftUI](https://developer.apple.com/xcode/swiftui/) 是苹果在 WWDC 2019 提出的两大新的开发框架。

> The Combine framework provides a declarative Swift API for processing values over time. These values can represent many kinds of asynchronous events. Combine declares publishers to expose values that can change over time, and subscribers to receive those values from the publishers.

### Reactive Programming

在这里我并不准备过多地介绍响应式编程的基本概念，已经有许多出色的文章详细地介绍了响应式编程。
响应式编程是一种面向数据流和变化传播的编程范式，其核心在于异步的数据流。
在 Combine 问世之前如果想要使用响应式编程开发 iOS 应用一般采用的是 [ReactiveSwift](https://github.com/ReactiveCocoa/ReactiveSwift) 或 [RxSwift](https://github.com/ReactiveX/RxSwift)。

我在先前的项目中自己尝试过使用 RxSwift 结合 MVVM 的方式，我认为这种开发方式相较于传统的 MVC 方式是相当有魅力的，开发过程中只需要集中在数据流的变化对整个系统产生的影响。

## Networking

在原有的响应式编程的项目之中，我是采用 RxSwift + Moya + Alamofire 来进行网络请求，Moya 提供了一个经过封装后的网络抽象层，能够让原本复杂且混乱的网络请求都经过其来进行。

由于 Moya 和 Combine 的结合目前还处于 Beta 测试的阶段[^1]，且没有完善的文档描述其使用方式，但是我们又希望能有一个统一的网络抽象层来处理网络请求，因此我决定借鉴一下 Moya 的实现方式，自行编写一个结合 Combine 使用的简单的网络抽象层。

[^1]: https://github.com/Moya/Moya/issues/1870. 2019-12-29.

```swift
protocol TargetType {
    var baseURL: URL { get }
    var path: String { get }
    var method: HTTPMethod { get }
    var task: Task { get }
    var headers: [String: String]? { get }
}

enum HTTPMethod: String {
    case GET
    case POST
    case PUT
    case DELETE
}

enum Task {
    case requestPlain
    case requestData(data: Data?)
    case requestParameters(parameters: [String: Any])
}
```

首先我们对 TargetType 的 Protocol 进行定义，这部分与 Moya 的定义保持基本一致。`TargetType` 协议要求以下变量被定义：

- `baseURL`： 即该服务基于的 URL。
- `path`：即 API Endpoint 相对于 baseURL的位置。
- `method`：即该请求使用的 HTTP Method。
- `task`：即该请求的模式。`Task` 所对应的枚举类型包括 `requestPlain`、`requestData` 与 `requestParameters`。
  - `requestPlain` 代表不包含参数的请求。
  - `requestData` 代表在 body 中发送 `Data` 的请求。
  - `requestParameters` 代表带有参数的请求。
- `headers`：即该请求带有的 Headers。

基于上述协议，我们已经可以定义出一个请求的雏形，随后便可以对 ApiService 进行具体的实现。

```swift
protocol ApiServiceType: AnyObject {
    associatedtype Target: TargetType
}

final class ApiService<Target: TargetType>: ApiServiceType {

}
```

在 ApiService 中，我们定义了一个简单的 request 函数，并打算将其和 Combine 结合在一起。
这里定义了一个泛型并让其遵守 Codable 协议，其目的在于要根据传入的泛型的具体类型才能进行解码，映射到对应的 Object 上。

```diff
final class ApiService<Target: TargetType>: ApiServiceType {
+    func request<T: Codable>(_ target: Target, with type: T.Type) -> AnyPublisher<T, Error> { }
}
```

`ruquest` 函数的具体实现如下，前半部分主要是根据 TargetType 形成具体的 `URLRequest`，并在后半部分使用 `URLSession.shared.dataTaskPublisher(for: request)` 进行请求，最终解码之后返回带有泛型和 Error 的 AnyPublisher。

```swift
func request<T: Codable>(_ target: Target, with type: T.Type) -> AnyPublisher<T, Error> {
    let decoder = JSONDecoder()
    decoder.keyDecodingStrategy = .convertFromSnakeCase
    decoder.dateDecodingStrategy = .custom { decoder in
        let container = try decoder.singleValueContainer()
        let string = try container.decode(String.self)
        let dateFormatter = ISO8601DateFormatter()
        return dateFormatter.date(from: string) ?? Date()
    }

    let pathURL = URL(string: target.path, relativeTo: target.baseURL)!
    var urlComponents = URLComponents(url: pathURL, resolvingAgainstBaseURL: true)!

    switch target.task {
    case .requestParameters(let parameters):
        urlComponents.queryItems = parameters.map { key, value in
            guard let intValue = value as? Int64 else { return URLQueryItem(name: key, value: "") }
            return URLQueryItem(name: key, value: String(intValue))
        }
    default:
        break
    }

    var request = URLRequest(url: urlComponents.url!)
    request.httpMethod = target.method.rawValue
    if target.headers != nil {
        target.headers?.forEach { header in
            request.addValue(header.1, forHTTPHeaderField: header.0)
        }
    }

    switch target.task {
    case .requestData(let data):
        request.httpBody = data
    default:
        break
    }

    return URLSession.shared
        .dataTaskPublisher(for: request)
        .map { $0.data }
        .decode(type: T.self, decoder: decoder)
        .receive(on: RunLoop.main)
        .eraseToAnyPublisher()
}
```

在以上这些实现之后，我们可以简单地创建 apiService，`Request` 遵循了 `TargetType` 协议为其提供具体的实现。

```swift
extension Request: TargetType { }
internal let apiService = ApiService<Request>()
```

在需要进行网络请求的地方只需要根据在实现中定义好的请求的 Task 以及需要解码的 Model 进行请求即可。

```swift
apiService
    .request(.RequestTask, with: Type.self)
    .sink(
        receiveCompletion: { complete in
            if case .failure(let error) = complete {
                // error handling
            }
    }, receiveValue: { _ in
        // if success
    }
)
    .add(to: self.disposeBag)
```

## Summary

本文主要结合基于 Moya 并结合 Combine 自定义了一个简单的网络抽象层，在结合响应式编程的同时又能优雅地对网络请求的数据流进行处理，比起将请求分散在各个 View 当中我认为这种实现方式是相当有意义的。

当然这样的实现略显粗糙，有很多问题并没有考虑在内，但也算是对 Combine 与 Moya 有了进一步的认识。

## References

- [André Staltz. The introduction to Reactive Programming you've been missing.](https://gist.github.com/staltz/868e7e9bc2a7b8c1f754)
- [Wei Wang. SwiftUI and Combine Programming.](https://objccn.io/products/swift-ui)
- [Combine | Apple Developer Documentation](https://developer.apple.com/documentation/combine)
- [Moya/Moya: Network abstraction layer written in Swift.](https://github.com/Moya/Moya)

## Appendix

这是在 2020 年的第一篇博客，虽然开始写的时候是 2019 年底，不过果然还是不负众望地拖到了 2020 年，形成了变相的跨年。

说起来明明之前发的都是 Cloud Native 相关的，莫名突然冒出一篇 iOS 相关的感觉上就十分地突兀。
实际上我自从结束了实习之后已经一年半没有开发 iOS 应用程序了，这次写起来感觉也没有之前用 RxSwift 的时候顺手，很多操作多少会有点生疏，再加上刚发布的 SwiftUI 也有奇奇怪怪的坑，导致开发进度比现象中还要缓慢，给一起开发的同学造成了一些困扰，心中还是感到有点抱歉。

若行文中出现了错误还望各位斧正。
