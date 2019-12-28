---
title: "Cloud Native Infrastructure: Part 1 Service Discovery"
description: Service discovery components maintain a list of service instances that are available for work within a microservice domain.
date: 2019-05-27T22:23:43+08:00
categories: ["cloud-native"]
tags: ["cloud-native", "microservices", "service-discovery"]
---

## Introduction

**Service discovery** components maintain a list of service instances that are available for work within a microservice domain, which is the most important part in microservice architecture. The advantage of service discovery components is that clients do not need to know the exact position of services, what they have are just the registered name of services if they want to call or use them.

Usually, a microservice will register itself to the center of service discovery components when it was started successfully, including necessary parameters such as the unique name of service, IP address and the port bind. This process is called as **Service Registry**.

The mainstream solutions of service discovery include **mDNS**（multicast Domain Name Service）, **ZooKeeper** and **etcd**, which are based on distributed key-value storage service, **Eureka**, open-sourced by Netflix, and [**Consul**](https://www.consul.io/), open-sourced by HashiCorp etc.

## Consul

Consul is a service mesh solution providing a full featured control plane with service discovery, configuration, and segmentation functionality.

### Installation

#### Development Environment

**NOTICE: You should not just use `consul agent -dev` in production environment.**

In `docker-compose.yml`:

```yaml
version: "3"
services:
  consul:
    image: consul
    container_name: consul
    ports:
      - "8300:8300"
      - "8400:8400"
      - "8500:8500"
      - "8600:53/udp"
```

Just run `docker-compose up -d` and then the container named `consul` will be created.

Consul provides HTTP API for users to check the status of nodes in the cluster, and a UI at `:8500` by default.

```bash
$ curl localhost:8500/v1/catalog/nodes
[
    {
        "ID": "fbd0daa0-84e4-41d4-69d2-9c446c79c5c2",
        "Node": "c7bc60a1e9b0",
        "Address": "127.0.0.1",
        "Datacenter": "dc1",
        "TaggedAddresses": {
            "lan": "127.0.0.1",
            "wan": "127.0.0.1"
        },
        "Meta": {
            "consul-network-segment": ""
        },
        "CreateIndex": 9,
        "ModifyIndex": 10
    }
]
```

## Summary

Service discovery is the basic of microservices, which provides the registry center in the distributed application system.
