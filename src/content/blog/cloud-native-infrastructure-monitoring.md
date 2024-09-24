---
title: "Cloud Native Infrastructure: Part 2 Monitoring"
description: The post introduces the combination of Prometheus and Grafana.
pubDate: 2019-05-27T22:44:05+08:00
categories: ["cloud-native"]
tags: ["cloud-native", "microservices", "monitoring"]
---

## Introduction

## Prometheus

[Prometheus](https://prometheus.io/) is an open-source systems monitoring and alerting toolkit.

### Installation

In `docker-compose.yml`:

```yaml
services:
  prometheus:
    image: prom/prometheus
    restart: always
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - ./prometheus:/prometheus
    ports:
      - 9090:9090
    user: root
```

Prometheus provides a UI at `:9090` by default.

### Node Exporter

[**Node Exporter**](https://github.com/prometheus/node_exporter) is designed ad a Prometheus exporter for hardware and OS metrics exposed by \*NIX kernels.

According to the documentation, it's not recommended to deploy it as a Docker container because it requires access to the host system, so you could just download the binary release version.

```bash
$ wget https://github.com/prometheus/node_exporter/releases/download/v0.18.0/node_exporter-0.18.0.linux-amd64.tar.gz
$ tar -xvf node_exporter-0.18.0.linux-amd64.tar.gz
$ cd node_exporter-0.18.0.linux-amd64
# It's recommended to run the following instruction in tmux in order to keep it running after exit.
$ ./node_exporter &
```

After started, `node_exporter` will be listening at `:9100`.

### Service Registry

In order to combine service `node-exporter` with **Consul**, a config directory should be configured.

In `consul.d/node_exporter.json`:

```json
{
  "service": {
    "name": "node_exporter",
    "tags": ["exporter"],
    "address": "$PRIVATE_IP_ADDRESS",
    "port": 9100
  }
}
```

In `docker-compose.yml` of Consul:

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
    volumes:
      - ./consul.d:/etc/consul.d
    command: agent -dev -client 0.0.0.0 -config-dir=/etc/consul.d
```

### Configuration

In `prometheus.yml`:

```yaml
global:
  scrape_interval: 15s

scrape_configs:
  # Self-monitoring
  - job_name: "prometheus"
    static_configs:
      - targets: ["localhost:9090"]
      - labels:
          instance: prometheus
  # Without service discovery
  - job_name: "node_exporter"
    static_configs:
      - targets: ["$PRIVATE_IP_ADDRESS:9100"]
      - labels:
          instance: node_exporter
  # With service discovery, discard the job above
  - job_name: "node_exporter"
    consul_sd_configs:
      - server: $PRIVATE_IP_ADDRESS:8500
        services:
          - node_exporter
```

## Grafana

[Grafana](https://grafana.com/) allows users to query, visualize, alert on and understand your metrics no matter where they are stored, supports multiple data sources and provides very powerful dashboard for displaying multiple metrics.

### Installation

In `docker-compose.yml`:

```yaml
services:
  grafana:
    image: grafana/grafana
    restart: always
    ports:
      - 3000:3000
    volumes:
      - grafana:/var/lib/grafana
volumes:
  grafana:
```

Grafana provides a UI at `:3000` by default.

You could follow the instructions in Grafana to add data sources including Prometheus and import dashboards.

[This dashboard](https://grafana.com/dashboards/159) could show system status according to the data collected by Prometheus.

## References

- https://prometheus.io/docs/introduction/overview/
- https://grafana.com/docs/
- https://yunlzheng.gitbook.io/prometheus-book/part-ii-prometheus-jin-jie/sd/service-discovery-with-consul
