---
title: Working as a Mentee of LFX Mentorship Program with Volcano Community
description: The LFX Mentorship program is a program designed to provide an opportunity for mentees to gain exposure to the development of open-source projects. I was honored to have the opportunity to work closely with the Volcano community, a sandbox project of CNCF, for the system stability enhancement task. In this post, I would like to share my experience and lessons learned during the project as a mentee of the Volcano project.
date: 2021-06-13T16:53:30+08:00
tags:
  - volcano
  - kubernetes
  - lfx-mentorship
---

The [LFX Mentorship](https://lfx.linuxfoundation.org/tools/mentorship/) program is a program designed to provide an opportunity for mentees to gain exposure to the development of open-source projects. Cloud Native Computing Foundation, or CNCF, is actively using it as the mentorship platform across the CNCF projects. In spring 2021, I was honored to have the opportunity to work closely with the [Volcano](https://github.com/volcano-sh/volcano) community, a sandbox project of CNCF, for the [System Stability Enhancement](https://github.com/cncf/mentoring/tree/master/lfx-mentorship/2021/01-Spring#system-stability-enhancement) task. In this post, I would like to share my experience and lessons learned during the project as a mentee of the Volcano project.

## The Beginning of the Journey

Since I was an undergraduate, encouraged by my advisor, I have started my journey to the world of cloud-native. I have also attended KubeCons offline and online several times. It was inspirational to know the latest progress of the development of CNCF projects from the community and some valuable best practices from the industry. Taking this as an opportunity, I started to contribute to open-source projects and gain precious experience working with the open-source communities.

During my master's studies, I chose to combine cloud-native technologies with my current research topic, the resource management of distributed stream processing systems with Kubernetes, including elastic scheduling and autoscaling. As a result, I began to deep dive into the solutions of resource scheduling on Kubernetes, both in academia and industry.

Recommended by [Liang Tang](https://github.com/shinytang6), a friend of mine in university focusing on systems for deep learning related to Kubernetes, I learned of the LFX Mentorship program and the [Volcano](https://github.com/volcano-sh/volcano) project. He was also a mentee of this program (ex-Community Bridge) in 2020, and currently an active maintainer of Volcano. He briefly introduced the project and the community to me and I believed it would be a great chance for me to get close to the open-source community and understand the latest solutions in the industry.

I remembered that was an afternoon of the weekend when I got a phone call from [Lei Wu](https://github.com/Thor-wl), a member of the Volcano community. We had a nice discussion about the understanding of Kubernetes and resource scheduling. I introduced some publications previously related to cluster resource management and scheduling during the discussion. Fortunately, I was informed to be selected as a mentee of the project the next day.

## Volcano 101

{{< figure src="volcano-logo.png" >}}

{{< figure src="volcano-architecture.png" title="Volcano Architecture" >}}

[Volcano](https://github.com/volcano-sh/volcano) is a batch scheduling system built on Kubernetes, partly based on [kube-batch](https://github.com/kubernetes-sigs/kube-batch). It provides powerful mechanisms for batching and elastic workloads in cloud-native architecture including machine learning, bioinformatics and big data applications such as batch processing, and stream processing. Compared with Kubernetes default scheduler, Volcano is more capable of various scenarios benefiting from the extensibility gain from its job lifecycle management via manifold plugins.

{{< figure src="volcano-scheduler-workflow.png" title="Volcano Scheduler Workflow" >}}

This is the main workflow of the scheduler of Volcano. Volcano defines five actions as extension points during the lifecycle of a scheduling session. Users could register user-defined plugins to extension points and these plugins would be executed in the corresponding sequence. The scheduler works as follows:

1. Watch and then cache the `Job` submitted to the Volcano cluster.
2. Create a `Session` object to store data required in the current scheduling lifecycle.
3. Transfer `Job`s not scheduled in the cache to the (to be scheduled) queue in the session.
4. Execute the defined actions consequently and find the most suitable node for each `Job`.
5. Bing the `Job` to the node.
6. Close the `Session`.

## On the Road: How to Move Forward

My task was to enhance the system stability by importing a series of unit tests and e2e tests. As for open-source projects, testing is the most important part which ensures the codes meet quality standards. In general, these tests are integrated into the process of continuous integration infrastructure when reviewing the codes and making releases, while its maintainability would be easily ignored because of its lower priority during the rapid iteration.

E2e tests are designed to provide a mechanism to test the end-to-end behavior of the system and find the bugs that were not detected by unit tests or integration tests. In Kubernetes related ecosystem, developers tend to use [Ginkgo](http://onsi.github.io/ginkgo/) and [Gomega](http://onsi.github.io/gomega/) as testing frameworks with behavior-driven development (BDD) style. In terms of the Volcano, the e2e testing lacks robustness and extensibility. In particular, there are lots of homogeneous codes with the same functionality, and the structure of the tests is lacking in well-design. Consequently, I started by focusing on the enhancement of e2e tests.

Since I was not quite familiar with e2e tests based on Kubernetes before, I decided to stand on the shoulders of giants - figuring out some best practices used in Kubernetes and other CNCF projects. I read about the best practices about the e2e tests from sig-testing of Kubernetes community as listed below:

- [End-to-End Testing in Kubernetes](https://github.com/kubernetes/community/blob/master/contributors/devel/sig-testing/e2e-tests.md) (with kubetest)
- [End-to-End Testing in Kubernetes](https://github.com/kubernetes/community/blob/master/contributors/devel/sig-testing/e2e-tests-kubetest2.md) (with kubetest2)
- [Writing good e2e tests for Kubernetes](https://github.com/kubernetes/community/blob/master/contributors/devel/sig-testing/writing-good-e2e-tests.md)

The posts pointed out that e2e tests with only 99% reliability were useless with the continuous integration environment since these tests would provide unreliable indicators and delay the process of development. This was my key point of optimization for the e2e tests of Volcano.

Besides, I made connections with developers working with e2e testing based on Kubernetes in other projects. They gave me constructive suggestions about the refactoring of the testing frameworks.

Based on the survey, I raised my initial proposal to my mentor, including the optimization of the testing structure and the scripts related to continuous integration. During the implementation, I had to follow up the development process of the community, since e2e tests were deeply related to the main functionality. It was impressive that my first pull request was merged after the review and discussion with the community.

### Lessons What I Have Learned

Here are some lessons I have learned during the process of the program:

**Share your insights.** It would be helpful to share the ideas or insights with mentors since they had been working on the project for a long time and more familiar with its architecture. We had meetings weekly to get synced with the latest progress. Sometimes I shared my proposal about the refactoring of the e2e testing or the obstacles met.

**Join the meetings.** The Volcano community held the meeting weekly. It was a great opportunity to get close to the community members and grasp the latest development progress of the project (e.g., topics the community focusing on currently). The community members discussed the issues and pull requests to be processed on that week, and people from various affiliations shared their use cases with the project, though it may be a little bit tough for the beginners to follow their steps.

**Discuss with your partners.** Besides the community meetings, my mentor also held a series of seminars via Zoom meetings with students interested in cloud-native technologies. We made discussions about the fundamentals of cloud-native technologies, including the architecture of Kubernetes and Volcano, and some design philosophies widely used on them. Transforming inputs into outputs was quite challenging but beneficial. My mentor guided us to dive deep into the realistic scenarios, and let us figure out how and why the solution was.

## Outside the Ivory Tower: It's Not the End

We often say that there is a gap between *academia* and *industry* because of various scenarios. In terms of academia, researchers tend to gain better performance in certain metrics such as latency and throughput, while lacking the consideration of stability. On the other hand, developers consider stability as first-class citizens since they have to meet the requirements of service level objectives, or SLOs. In summary, implementing cutting-edge research from academia into the industry is quite challenging.

I believe it is worth my attempt to bridge such a gap via the LFX mentorship program. I have been working closely with the community and gain valuable experience from the operation and communication with community members outside the ivory tower. This experience would also encourage me to continuously explore the world of cloud-native, and contribute to open-source projects.

Finally, I would like to thank my mentors, [Lei Wu](https://github.com/Thor-wl) and [Leibo Wang](https://github.com/william-wang), who have given me valuable suggestions and kind assistance during the program, as well as the community members of the Volcano community. Besides, I also want to thank [Liang Tang](https://github.com/shinytang6) and [Ce Gao](https://github.com/gaocegege) for their primitive guidance of the project, and [Yilong Li](https://github.com/dragonly) for sharing his experience about the refactoring of the e2e testing framework in the TiDB community. Thanks to Linux Foundation and Cloud Native Computing Foundation for providing the platform and organizing the mentorship program.

## References

- [Volcano: Collision between containers and batch computing](https://www.cncf.io/blog/2021/02/26/volcano-collision-between-containers-and-batch-computing/)
