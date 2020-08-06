---
title: "Securing Key-Value Storages with SGX"
description: 本文简要介绍了两篇基于 SGX 进行的存储相关的安全优化的工作，SPEICHER 和 ShieldStore。这两篇工作发表的时间是平行的，两者具有相同的切入点，但基于两者的数据结构有不同的侧重点。
date: 2020-07-27T08:33:27+08:00
categories: ["storage", "security"]
tags: ["sgx", "lsm-tree", "storage"]
---

## 引言

随着云计算的发展，键值对存储作为持久化的存储系统被广泛使用，如 in-memory 的 Memcached 和 Redis，以及基于 LSM-tree 的 LevelDB 和 RocksDB 等，但在云端这样一个不受信任的环境之中如何保证存储系统的安全是一个很大的问题。为了提供一个能被信任的环境，
Intel 和 ARM 分别提出了基于硬件的 TEE（Trusted Execution Environment）的支持，即 Intel SGX 和 ARM TrustZone，通过 TEE 可以在不被信任的的基础设施之上有一个独立的安全的 memory space，我们称其为 enclave，来进行 shielded execution 保证了数据或代码的机密性和完整性。

这篇文章主要想介绍的是基于 SGX 进行存储相关的安全优化的两篇工作，一篇是来自爱丁堡大学的 SPEICHER，另一篇是来自韩国科学技术研究院的 ShieldStore。这两篇工作发表的时间是平行的，前者发表在 FAST '19 上，后者发表在 EuroSys '19 上，两者具有相同的切入点，即两者同样意识到了根据现有的 SGX 的实现，由于其本身的限制，不可能将所有存储的数据结构都存储在 EPC 当中，同时频繁的 enclave exiting 会带来严重的性能开销。两者的不同之处在于前者是基于 LSM-tree 的实现，大部分的存储结构是基于 HDD / SSD 的，所以需要调整 LSM tree 的实现才能保证其安全性；后者是 in-memory 的实现，主要根据 hashing 进行存储的映射，同时为了规避 hashing collision 的情况采用了链表作为相同 bucket 时的数据结构。

## 背景

那么基于 SGX 的 shielded execution 具体存在着怎样的问题呢？首先我们可以想到的是这个 enclave 的区域肯定不是无限大的，尤其是其基于硬件的实现，肯定存在着一个存储的上限。实际上 enclave 的 memory 是位于 EPC（Enclave Page Cache）当中的，其大小只有 128 MB，除去掉一些存储 metadata 的保留空间，真正可用的空间大概只有 94 MB。

为了存储超过该上限的数据，SGX 提供了 securing paging 的机制，该机制可以让操作系统通过 SGX 的指令将 EPC pages 驱逐到未受保护的内存当中，当 EPC pages 被驱逐的时候存储在里面的数据会被加密，当被驱逐的 EPC page 重新被 load 回来的时候会进行解密并验证其完整性，但是这个操作会带来很大的性能开销。通过实验可以发现在超过 EPC 大小的 workload 的情况之下，未使用 SGX 加密的 KV store 的 throughput 大幅高于使用 SGX 加密的 KV store，在使用 4 GB 的 workload 的时候两者的差距可以高达 134.4 倍。

## SPEICHER

大部分基于 LSM-tree 的 KV store 的存储结构都是存储在 HDD / SSD 中的。LSM-tree 会将 write 的请求按照顺序 buffer 在 MemTable 中，其内部实现是 skiplist，与此同时会生成对应的 WAL。当其大小超过一定的阈值之后会固定为 immutable MemTable，然后 allocate 新的 MemTable 和 WAL。随后 immutable MemTable 会被 flush 到 disk 上存储在一个叫 SSTable 的结构当中，这个过程称为 minor compaction。被 flush 到 disk 上的 SSTable 会被存储在一个多层结构的第零层中，这些 SSTable 的范围是有重合的。当达到另一个设定的阈值的时候，LSM-tree 会将低层的数据和高层的数据进行合并，淘汰掉旧的数据，这个过程称为 major compaction。LSM-tree 会不停重复上述的步骤保证整体的空间利用率且每个 SSTable 对于每个 key 最多只有一个 entry。

上文提到的 shielded execution 主要是被用来对 in-memory 的计算进行加密的，如何将这个针对 stateless 的 enclave 的加密扩展到这种 stateful 的存储结构上就是一个很大的挑战。因此这篇工作主要在不被信任的的基础设施上实现了一个安全的基于 LSM-tree 的 KV Store，他们基于 Intel SPDK 设计了 shielded execution 的 I/O library，针对 EPC 的特性对 LSM-tree 的数据结构进行了调整，包括 MemTable、SSTable 和 WAL 等，使其能够保证机密性和完整性，以及对应的相关操作的算法，同时实现了一个异步的单调计数器来保证数据的 freshness 防止 rollback 和 forking attack。

### 系统设计

{{< figure src="https://rudeigerc-images.oss-cn-shanghai.aliyuncs.com/blog/speicher-overview.png" title="SPEICHER overview" alt="speicher-overview" >}}

整个系统包括 SPEICHER 的 controller，shielded execution 的 I/O library，受信任的单调计数器，存储引擎，还有改进的 LSM data structure。SPEICHER 这边利用了 SCONE 的 container support 来进行自身的部署，并且基于 SPDK 建立了一个 shielded I/O library。SPDK 是一个高性能的 user mode 的 storage library，其通过将 direct memory access（DMA）的 buffer 映射到用户地址空间实现了 zero-copy 的 I/O。

#### MemTable

SPEICHER 将 MemTable 中的 key 和 value 拆成了两部分，原先 key 和 value 是一起被存储在 skiplist 当中的。实际上将 key 和 value 进行拆分是一个比较直观的想法，在引入 SSD 之后也有一些优化 LSM-tree 的工作利用其 random I/O 的性能将 SSTable 中的 key 和 value 拆开了存储，只是这里的应用场景变成了在内存当中。这里将 key 存储在了 encalve 当中然后将加密后的 value 存储在 untrusted 的 host memory 当中，同时存储了指向 value 位置的 pointer 以及验证其 integrity 和 freshness 的 hash value。论文在这里介绍了在他们所使用的参数配置之下可以达到 95.2% 的空间降低。

#### SSTable

对于 SSTable，可以看到这里维护的是一个 key-value pair 的 array，当然这里实际上可能还会存储一些如 Bloom filter 的结构来加快其读的性能这里先忽略不计，这里为了保证其安全性 key-value 都进行了加密，同时以一个 block 为单位（32 KB）维护了其 hash value。这些 block 的 hash value 被集中存储在 SSTable 的 footer，当在读取的时候会访问对应的 key value 还有其对应的 hash value 来验证其完整性。为了保证这个 footer 的完整性 footer 也会进行一次 hashing 并将值存储在 manifest 当中，形成了一个 merkle tree。

#### Log 文件

最后是 WAL 和 manifest 的结构，原先 WAL 中存储的是对应的 record 的结构，这里增加了 trusted counter 和对应的 key-value 的 hash 值，这样在 restore 的时候就可以利用两者验证 kv，然后对操作进行 replay。

### 评估

![speicher-evaluation](https://rudeigerc-images.oss-cn-shanghai.aliyuncs.com/blog/speicher-evaluation.png)

在 evaluation 的部分这边作者主要关注的是两个问题，其一是 SPEICHER 用来实现 shielded execution 的 I/O library 的性能，其二是 SPEICHER 所引入的 overhead。针对前者， SPEICHER 的 I/O library 和 native 的 SPDK 的实现相比，两者的 throughput 接近，性能基本上没有损失。针对后者，论文给出了三个不同的场景，包括不同读写比例的 workload，不同 value 的大小的 workload，以及在多线程情况下的性能。

## ShieldStore

ShieldStore 也是基于前述的背景，他们首先产生了一个初步的设想，即可以将主要的数据结构存储在 untrusted 的部分，然后能够从 enclave 内部对其进行访问。实际上这里可以发现 ShieldStore 和 SPEICHER 的想法是十分相似的，两者都是将计算过程在 enclave 的内部执行并存储了 metadata 的部分，同时将加密过后的内容存储在 untrusted 的部分当中，从而规避了 EPC 空间不足以及相对应的 high cost 的 paging context switch 的问题。

### 系统设计

{{< figure src="https://rudeigerc-images.oss-cn-shanghai.aliyuncs.com/blog/shieldstore-overview.png" title="ShieldStore overview" alt="shieldstore-overview" >}}

ShieldStore 整体的设计基本上延续了之前的设想，是将 metadata 存储在 enclave 内部，然后将主要的 data structure 的部分经过加密存储在 untrusted memory region 中，只有 secret keys 和 integrity 的metadata 会存储在 EPC 当中，主要的 hash table 的数据结构存储在 unprotected memory region。

{{< figure src="https://rudeigerc-images.oss-cn-shanghai.aliyuncs.com/blog/shieldstore-data-organization.png" title="ShieldStore data organization" alt="shieldstore-data-organization" >}}

为了防止 rollback attack，ShieldStore 这里和 SPEICHER 一样使用了 Merkle tree，但是这里不可能将每个 key-value pair 都维护在 merkle tree 中，这里的方法是为以 bucket 为单位的 MAC 生成 in-enclave 的 hash，这个会根据 MAC hash 的数量和 bucket 的数量进行调整，这实际上也是一个 trade-off，具体的调参在论文后面的 evaluation 有详细的解释。这里可能会有超出 EPC 大小限制的顾虑，可以通过 paging mechanism 的 eviction 来解决这个问题，虽然会带来我们先前所提到的 drawback。ShieldStore 在加密过程中主要采用的是 AES-CTR 进行加密，这里会将 key 和 value 一起加密，最后会生成包含 key-value pair size 等参数的 128 bit 的 MAC 来保证其完整性。

### 优化

1. MAC bucketing：这边将每个 bucket 里的 MAC 集合在了一起，然后再计算一次 MAC 和在 enclave 当中存储的 MAC 进行比较，保证了其完整性。
2. Searching encrypted key：由于 hashing collision，在搜索一个 key 的时候需要遍历整个 hash chain 并进行解密，为了降低 searching 的开销，ShieldStore 在这里引入了一个 byte 的 hint，可以有效地降低 candidate 的数量，实际上这也是一个 leakage 和 performance 的 trade-off。
3. 自定义的 heap allocator：SGX 实际上维护了两个 memory allocator，分别负责 enclave 的内部和外部，但是对 outside heap allocator 的访问都需要退出 enclave，ShieldStore 这里通过修改 SGX 的 tcmalloc library 创建了自定义的 allocator，运行在 enclave 内部但是 allocate 的是外部的 memory。
4. 多线程的优化：每个线程会负责特定的 partition 来降低线程同步带来的开销。

### 评估

| Data Set | Key Size (B) | Value Size (B) |
| :-: | :-: | :-: |
| Small | 16 | 16 |
| Medium | 16 | 128 |
| Large | 16 | 512 |

论文的 evaluation 主要有三个 metric，一个是 secured memcached，这边采用的实现是 Graphene-SGX，第二个是 ShieldBase，指的是未经过优化的 ShieldStore，第三个是 ShieldOPT，指的是经过上述策略优化的 ShieldStore。

![shieldstore-evaluation-thread](https://rudeigerc-images.oss-cn-shanghai.aliyuncs.com/blog/shieldstore-evaluation-thread.png)
![shieldstore-evaluation-scalability](https://rudeigerc-images.oss-cn-shanghai.aliyuncs.com/blog/shieldstore-evaluation-scalability.png)

ShieldStore 和前两者相比具有显著的 throughput 的提升，可以看到在 value 的大小较小的时候性能的提升越明显。在多线程的情况下 memcached 的 throughput 甚至会有所下滑，在单线程的情况下 ShieldStore 的性能是 secure memcached 的七到八倍，在四个线程的情况下是其的 24 到 27 倍，更详细的对比实验可以参阅论文，包括进行不同优化以及与另外一篇工作 Eleos 的对比。

## 结语

这里对两者进行一个简单的总结，可以看到两者作为同一时期发表的文章不管是 motivation 还是 solution 都是有一定程度上的重合的，只不过两者的应用场景不同，包括存储数据结构的拆分，保证 integrity 所使用的策略，merkle tree 的建立，以及保证 freshness 所采用的单调计数器的设计，只不过 SPEICHER 是基于 LSM 的，ShieldStore 是 in-memory 的，所以两者的侧重点各有不同。

由于我本身的研究方向比较少涉及到 security，这两篇工作主要也是因为课程需要才进行了简单的阅读，我对 SGX 具体的机制和实现也并没有特别深入的了解，如有疏漏还望各位斧正。

## 参考文献

1. Victor Costan and Srinivas Devadas. 2016. Intel SGX explained. (2016).
2. Maurice Bailleu, Jörg Thalheim, Pramod Bhatotia, Christof Fetzer, Michio Honda, and Kapil Vaswani. 2019. Speicher: securing LSM-based key-value stores using shielded execution. In Proceedings of the 17th USENIX Conference on File and Storage Technologies (FAST’19). USENIX Association, USA, 173–190.
3. Taehoon Kim, Joongun Park, Jaewook Woo, Seungheun Jeon, and Jaehyuk Huh. 2019. ShieldStore: Shielded In-memory Key-value Storage with SGX. In Proceedings of the Fourteenth EuroSys Conference 2019 (EuroSys ’19). Association for Computing Machinery, New York, NY, USA, Article 14, 1–15. DOI:https://doi.org/10.1145/3302424.3303951
