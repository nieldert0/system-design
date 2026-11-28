---
slug: kubernetes
title: Kubernetes
section: devops
upgraded: true
readFirst:
  - docker
  - service-discovery
  - load-balancers
sources:
  - id: k8s-overview
    title: Kubernetes Documentation, Overview
    url: https://kubernetes.io/docs/concepts/overview/
    license: CC BY 4.0
    use: reworded
  - id: k8s-components
    title: Kubernetes Documentation, Kubernetes Components
    url: https://kubernetes.io/docs/concepts/overview/components/
    license: CC BY 4.0
    use: reworded
  - id: k8s-pods
    title: Kubernetes Documentation, Pods
    url: https://kubernetes.io/docs/concepts/workloads/pods/
    license: CC BY 4.0
    use: reworded
  - id: k8s-controllers
    title: Kubernetes Documentation, Controllers
    url: https://kubernetes.io/docs/concepts/architecture/controller/
    license: CC BY 4.0
    use: reworded
  - id: k8s-service
    title: Kubernetes Documentation, Service
    url: https://kubernetes.io/docs/concepts/services-networking/service/
    license: CC BY 4.0
    use: reworded
  - id: k8s-sts
    title: Kubernetes Documentation, StatefulSets
    url: https://kubernetes.io/docs/concepts/workloads/controllers/statefulset/
    license: CC BY 4.0
    use: reworded
  - id: k8s-hpa
    title: Kubernetes Documentation, Horizontal Pod Autoscaling
    url: https://kubernetes.io/docs/concepts/workloads/autoscaling/horizontal-pod-autoscale/
    license: CC BY 4.0
    use: reworded
quiz:
  - prompt: What is a pod?
    options:
      - A container image
      - A physical server
      - The smallest deployable unit, one or more containers that share network and storage
      - A load balancer
    correct: 2
    explanation: Most pods run one main container; helpers (sidecars) can share the pod.
  - prompt: You declare "3 replicas" in a Deployment. One pod crashes. What happens?
    options:
      - Nothing until an engineer acts
      - The controller sees 2 running instead of 3 and creates a replacement
      - All pods restart
      - The cluster shuts down
    correct: 1
    explanation: Controllers keep moving actual state toward desired state.
  - prompt: Which component decides which node a new pod runs on?
    options:
      - etcd
      - The container registry
      - The kubelet
      - The scheduler
    correct: 3
    explanation: The scheduler picks a node based on resource requests and constraints; the kubelet on that node runs it.
  - prompt: A pod's liveness probe calls the database, and the database has a 30-second blip. What goes wrong?
    options:
      - Nothing, probes are only informational
      - Every pod fails liveness at once and gets restarted, turning a short database blip into a full outage
      - The scheduler moves the database
      - The Service gets a new IP
    correct: 1
    explanation: Liveness should check only the process itself. Dependency problems belong in readiness, which removes a pod from traffic without killing it.
  - prompt: In the worked example, the HPA targets 60% CPU against a 500m request. Six pods average 900m of CPU. How many replicas does it ask for?
    options:
      - 6
      - 9
      - 12
      - 18
    correct: 3
    explanation: Utilisation is 900/500 = 180% against a 60% target, so desired = ceil(6 × 180/60) = 18.
  - prompt: The HPA asks for 18 pods but only 14 are running and 4 are Pending. Why?
    options:
      - The image is broken
      - The nodes have no room left for the pods' resource requests, so the scheduler cannot place them until the cluster autoscaler adds nodes
      - The Service is full
      - etcd is down
    correct: 1
    explanation: The HPA scales pods, not machines. The cluster autoscaler reacts to unschedulable pods by adding nodes, which takes a minute or more.
  - prompt: Why do clients call a Service instead of pod IPs?
    options:
      - Pods come and go with new IPs; a Service gives a stable name and spreads traffic across ready pods
      - Services are faster than pods
      - Pods cannot receive traffic
      - Pod IPs are secret
    correct: 0
    explanation: It is built-in service discovery and load balancing.
  - prompt: Where does Kubernetes store the cluster's desired state?
    options:
      - In DNS
      - In each pod
      - In etcd, a consistent key-value store
      - In the Docker image
    correct: 2
    explanation: The API server reads and writes cluster state in etcd, which uses Raft to stay consistent.
---

<script>
	import Src from '#lib/components/Src.svelte';
	import Term from '#lib/components/Term.svelte';
	import KubernetesHealFlow from '#lib/diagrams/KubernetesHealFlow.svelte';
</script>

Running one container is easy. Running hundreds across many servers, restarting them when they fail, rolling out new versions and scaling with load needs an orchestrator, and Kubernetes is the one most teams use.

## What it is

Here is the problem. You have 20 services, each packaged as a [container image](/modules/docker), and 30 servers. Someone has to decide which container runs on which server so none is overloaded, restart containers that crash, move them off a server that dies at 3 a.m., tell callers the new addresses, roll out version 1.5 without downtime, and add copies when traffic doubles. Doing this with scripts and SSH works for three servers and falls apart at thirty.

**<Term id="kubernetes">Kubernetes</Term>** (K8s) is an open-source platform that does this job. It runs containerized workloads across a cluster of machines and handles placement, restarts, scaling, service discovery, load balancing and rolling updates. It grew out of Google's internal systems, Borg and Omega. <Src id="k8s-overview" />

The central idea is **desired state**. You do not tell Kubernetes "start a container on server 7". You write down what you want, for example "run 3 replicas of `shop/api:1.4.2`, each with half a CPU, reachable as `api` on port 80", and Kubernetes keeps working, forever, to make the cluster match. If reality drifts, because a pod crashed or a node vanished, it notices and fixes it. <Src id="k8s-overview" />

## How it works

### The cluster

A **<Term id="control-plane">control plane</Term>** manages a set of worker **nodes** (the machines that run your containers). The control plane has four main parts: <Src id="k8s-components" />

- The **API server** is the front door. Every change, from `kubectl apply` to a controller updating status, goes through it.
- **etcd** is a consistent key-value store that holds all cluster state. It uses the Raft consensus protocol across 3 or 5 members, so it survives the loss of a minority of them.
- The **scheduler** picks a node for each new pod.
- **Controllers** watch the state and act on it (more below).

Each node runs a **kubelet**, an agent that receives the pods assigned to its node, starts their containers through the container runtime, and reports their health back.

### Pods

A **<Term id="pod">pod</Term>** is the smallest unit you deploy: one or more containers that share a network address and storage volumes and are always placed together. Most pods have one main container; helpers such as a log shipper or a proxy run beside it as a <Term id="sidecar">sidecar</Term>. Pods are disposable. When one is replaced, the new one gets a new name and a new IP. <Src id="k8s-pods" />

Each container declares **<Term id="resource-requests-limits">resource requests and limits</Term>**. The request ("I need 500m", meaning half a CPU core, "and 256Mi of memory") is what the scheduler reserves when it places the pod: a node with 4 cores fits at most eight 500m pods, however idle they are. The limit is the ceiling enforced by cgroups: CPU over the limit is throttled, and memory over the limit gets the container OOM-killed.

### Controllers and self-healing

A controller is a **<Term id="reconciliation-loop">reconciliation loop</Term>**: it watches the actual state, compares it with the desired state, and acts to close the gap, over and over. <Src id="k8s-controllers" />

A **Deployment** is the controller for stateless services. It keeps the declared number of pod replicas running and, when you change the image, rolls out the new version a few pods at a time (see [CI/CD and deployment](/modules/ci-cd-and-deployment)). Say a Deployment wants 2 replicas, one on each of two nodes, and a node crashes. The node stops sending <Term id="heartbeat">heartbeats</Term>; after a timeout the control plane marks it not ready and evicts its pods, the Deployment's controller sees one replica missing and creates a new pod, and the scheduler places it on a healthy node. Nobody was paged.

<KubernetesHealFlow />

Other controllers cover other shapes of work: a **StatefulSet** gives each pod a stable name (`db-0`, `db-1`) and its own persistent volume, for databases and other stateful systems; a **DaemonSet** runs one pod on every node, for agents like log collectors; a **Job** runs pods to completion. <Src id="k8s-sts" />

### Health checks

The kubelet runs two kinds of <Term id="health-check">health check</Term> against each container:

- A **<Term id="liveness-probe">liveness probe</Term>** asks "is this process stuck?" If it fails several times in a row, the kubelet restarts the container.
- A **<Term id="readiness-probe">readiness probe</Term>** asks "can this pod take traffic right now?" If it fails, the pod is taken out of its Service's load balancing but left running, for example while it warms a cache or while a dependency is down.

### Services and traffic

A **Service** gives a set of pods one stable DNS name and virtual IP and spreads traffic across the ones that are *ready*, so callers never track pod IPs. This is [service discovery](/modules/service-discovery) built into the platform. A component on every node (kube-proxy, or an eBPF-based replacement such as Cilium) programs the node so that connections to the Service's IP go to one of its pods. An **Ingress** or the newer **Gateway API** routes outside HTTP traffic to Services, much like a [reverse proxy](/modules/reverse-proxies-api-gateways). <Src id="k8s-service" />

### Scaling

A **Horizontal Pod Autoscaler** (HPA) changes a Deployment's replica count from metrics. By default it checks every 15 seconds and computes:

desired replicas = ceil(current replicas × current metric ÷ target metric)

CPU utilisation is measured against the pod's *request*, not the node. The **cluster autoscaler** works one level down: when pods cannot be scheduled because no node has room for their requests, it adds nodes, and it removes nodes that sit mostly empty. Both are forms of <Term id="autoscaling">autoscaling</Term>. <Src id="k8s-hpa" />

## Worked example

An API runs as a Deployment of **6 replicas**. Each pod requests **500m CPU** and 512Mi of memory, with a memory limit of 512Mi. The nodes have 4 cores and 16 GiB each, and system agents reserve about half a core, so each node fits **7 pods** by CPU request. The cluster has 3 nodes. The HPA targets **60% CPU**, with a minimum of 4 and a maximum of 30 replicas.

**Step 1, normal load.** Each pod handles about 200 requests/s and uses about 300m CPU, which is 300/500 = 60% of its request. The HPA computes ceil(6 × 60/60) = 6. Nothing changes.

**Step 2, a traffic spike.** Traffic triples to 3,600 requests/s. Each of the 6 pods now uses about 900m, which is **180%** of its request (pods can use more than their request when the node has spare CPU, up to their limit). The HPA computes ceil(6 × 180/60) = **18 replicas**.

**Step 3, the cluster runs out of room.** Three nodes hold 3 × 7 = 21 pod slots, but other workloads already use 7 of them, so only 14 API pods fit. The other **4 pods sit in Pending**: the scheduler has no node with 500m of unreserved CPU. The cluster autoscaler sees the Pending pods and asks the cloud provider for a node. A new VM takes about 60 to 90 seconds to boot and join, and the kubelet then pulls the image (this is where a small image from the [Docker](/modules/docker) module pays off). Until then, 14 pods carry 3,600 requests/s, about 257 each, at around 77% CPU of request: slower, but up.

**Step 4, a bad liveness probe turns a blip into an outage.** Suppose the liveness probe is `/health`, and `/health` queries the database. The database fails over and is unreachable for 30 seconds. With the default probe settings (every 10 s, 3 failures to restart), every API pod fails liveness within about 30 s, and the kubelet restarts **all 18** at once. They come back cold, all reconnect to the recovering database together, and users get errors for several minutes instead of 30 seconds. The fix: liveness checks only that the process can respond; the database check goes in readiness, so pods stop taking traffic while the database is down and resume instantly when it returns, with no restarts.

**Step 5, scale down.** When the spike ends, CPU drops. The HPA waits through a **5-minute stabilisation window** before removing pods, so a brief dip does not cause flapping, then scales back toward 6. The cluster autoscaler later removes the extra node once it has been underused for about 10 minutes.

## In the real world

- **Managed control planes (EKS, GKE, AKS).** The cloud runs the API server and etcd for you, with upgrades and backups. EKS charges about $0.10 per cluster-hour for the control plane; GKE Autopilot goes further and bills per pod request, managing the nodes as well. Most teams should not run etcd themselves.
- **Deployment rollout knobs.** A Deployment's `strategy.rollingUpdate` defaults to `maxSurge: 25%` (extra pods allowed during the rollout) and `maxUnavailable: 25%` (pods allowed to be down). `revisionHistoryLimit` (default 10) keeps old ReplicaSets so `kubectl rollout undo` can roll back.
- **HPA behaviour.** Defaults are a 15-second sync period, a 10% tolerance (no change if the ratio is within 0.9 to 1.1), and a 300-second scale-down stabilisation window, all tunable under `spec.behavior`. KEDA extends the HPA to scale on queue length, Kafka lag or other external metrics, including down to zero.
- **Google Borg.** Kubernetes' ancestor. The 2015 Borg paper reports clusters of tens of thousands of machines, and introduced ideas Kubernetes kept: declarative jobs, priority and preemption, and packing batch work into the gaps left by services' reservations.

## Trade-offs

- **Power against complexity.** Kubernetes solves scheduling, healing and scaling, but it has many moving parts (networking plugins, ingress controllers, RBAC, upgrades every few months) and a steep learning curve. A handful of services may be better served by a managed platform such as Cloud Run, ECS or plain VMs behind a [load balancer](/modules/load-balancers).
- **Managed against self-run.** Managed offerings run the control plane for you; self-hosting means operating etcd, certificates and upgrades yourself.
- **Stateless is easy, stateful is harder.** Databases on Kubernetes need StatefulSets, persistent volumes and careful handling of failover; many teams keep them on managed database services. <Src id="k8s-sts" />
- **Requests set too high waste money; too low hurt latency.** The scheduler packs by request, so inflated requests leave nodes mostly idle, while low requests let busy neighbours squeeze each other's CPU.

## Interview tips

- Use the vocabulary briefly: a Deployment with N replicas, a Service in front, an HPA on CPU or queue length, readiness probes, and a cluster autoscaler for nodes.
- Explain self-healing as a control loop: desired against actual state.
- When you scale, say what scales the pods (HPA) and what scales the machines (cluster autoscaler), and that new nodes take a minute or more.
- Don't make Kubernetes the centre of the design; it is the platform, not the architecture.

**Common mistakes:**

- Putting dependency checks in the liveness probe, so a database blip restarts every pod at once (Step 4 above).
- Leaving out resource requests. The scheduler then packs pods blindly, and the HPA cannot compute CPU utilisation at all.
- Expecting the HPA to absorb a sudden spike instantly. Pod scale-up takes seconds to a minute and node scale-up takes longer, so keep headroom or scale on a leading signal such as queue length.
- Running a single replica of anything that matters. A node drain or rollout then means downtime; run at least 2, spread across zones, with a <Term id="pod-disruption-budget">PodDisruptionBudget</Term>.

## Common follow-up questions

### What happens, step by step, when you run kubectl apply on a Deployment?

`kubectl` sends the manifest to the API server, which authenticates it, validates it and stores it in etcd. The Deployment controller notices the new object and creates a ReplicaSet, whose controller creates pod objects with no node assigned. The scheduler sees unassigned pods, picks a node for each by filtering on free resources and constraints and then scoring the candidates, and writes the choice back. The kubelet on each chosen node sees its new pod, pulls the image, starts the containers and reports status. Every step is a separate component watching the API server, not one central script.

### How does Kubernetes do a zero-downtime deploy?

A rolling update starts new pods (up to `maxSurge`), waits until they pass readiness, adds them to the Service, and only then terminates old ones (keeping no more than `maxUnavailable` down). Terminating pods get a SIGTERM and a grace period (default 30 s) to finish in-flight requests. The app must handle SIGTERM and stop accepting new work, or users see errors during each rollout.

### How do you run a database on Kubernetes?

With a StatefulSet, which gives each replica a stable identity and its own persistent volume that follows it if the pod moves, usually managed by an operator (a controller that knows how to do failover and backups for that database, such as CloudNativePG for Postgres). It works, but you now own the database's failure modes; most teams use a managed database unless they have a strong reason not to.

### What is the difference between requests and limits, and what should you set?

Requests are what the scheduler reserves and what the HPA measures against; limits are hard caps. Set requests from measured typical use (for example the p90 of real usage), set the memory limit equal to the memory request so the pod's memory is guaranteed and predictable, and be careful with CPU limits, because throttling adds latency even when the node has idle cores.

### What does etcd losing quorum do?

With 3 etcd members, losing 2 means no majority, so etcd stops accepting writes. The API server can no longer change anything: no new pods, no scaling, no rollouts. Running pods keep running, because kubelets and the data path do not need the control plane moment to moment, but the cluster cannot heal or change until <Term id="quorum">quorum</Term> returns.

## Go deeper

- [Borg, Omega, and Kubernetes (ACM Queue, 2016)](https://queue.acm.org/detail.cfm?id=2898444): the lessons from ten years of Google cluster managers that shaped Kubernetes' design.
- [Large-scale cluster management at Google with Borg (EuroSys 2015)](https://research.google/pubs/large-scale-cluster-management-at-google-with-borg/): the paper behind the ideas of declarative jobs, packing and priority.
- [Resource Management for Pods and Containers](https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/): how requests and limits affect scheduling, throttling and OOM kills.
- [Pod Lifecycle](https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/): probes, restart policy and graceful termination in detail.
