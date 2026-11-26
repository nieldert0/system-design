---
slug: kubernetes
title: Kubernetes
section: devops
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
  - prompt: Why do clients call a Service instead of pod IPs?
    options:
      - Pods come and go with new IPs; a Service gives a stable name and spreads traffic across healthy pods
      - Services are faster than pods
      - Pods cannot receive traffic
      - Pod IPs are secret
    correct: 0
    explanation: It is built-in service discovery and load balancing.
  - prompt: Which component decides which node a new pod runs on?
    options:
      - etcd
      - The container registry
      - The kubelet
      - The scheduler
    correct: 3
    explanation: The scheduler picks a node based on resources and constraints; the kubelet on that node runs it.
  - prompt: Where does Kubernetes store the cluster's desired state?
    options:
      - In DNS
      - In each pod
      - In etcd, a consistent key-value store
      - In the Docker image
    correct: 2
    explanation: The API server reads and writes cluster state in etcd.
  - prompt: What does a Horizontal Pod Autoscaler do?
    options:
      - Adds nodes to the cluster
      - Changes the number of pod replicas based on metrics such as CPU
      - Makes pods larger
      - Restarts failed pods
    correct: 1
    explanation: It scales out and in; the cluster autoscaler adds or removes nodes.
---

<script>
	import Src from '#lib/components/Src.svelte';
	import Term from '#lib/components/Term.svelte';
	import KubernetesHealFlow from '#lib/diagrams/KubernetesHealFlow.svelte';
</script>

Running one container is easy. Running hundreds across many servers, restarting them when they fail and scaling them with load, needs an orchestrator.

## What it is

**<Term id="kubernetes">Kubernetes</Term>** (K8s) is an open-source platform for running containerized workloads across a cluster of machines. It handles placement, restarts, scaling, service discovery, load balancing and rolling updates. <Src id="k8s-overview" />

You describe the **desired state** (run 3 replicas of this image, exposed on port 80) and Kubernetes works to make the cluster match it. <Src id="k8s-overview" />

## How it works

**Cluster.** A **control plane** manages a set of worker **nodes**. The control plane runs the API server (the front door for every change), etcd (a consistent key-value store holding cluster state), the scheduler (picks a node for each new pod) and controllers. Each node runs a kubelet, which starts and watches the containers assigned to it. <Src id="k8s-components" />

**Pods.** A **<Term id="pod">pod</Term>** is the smallest unit you deploy: one or more containers that share a network address and storage. Pods are disposable and get new IPs when they are replaced. <Src id="k8s-pods" />

**Controllers and self-healing.** A controller is a control loop: it watches the actual state, compares it with the desired state, and acts to close the gap. A Deployment controller keeps the right number of pod replicas running and rolls out new versions gradually. Say a Deployment wants 2 replicas, one on each of two nodes, and a node crashes: its pod dies, the controller sees one replica missing, and the scheduler places a replacement on a healthy node. <Src id="k8s-controllers" />

<KubernetesHealFlow />

**Services.** A Service gives a set of pods one stable name and virtual IP, and spreads traffic across the healthy ones, so callers never track pod IPs. An Ingress or gateway routes outside HTTP traffic to Services. <Src id="k8s-service" />

**Scaling.** A Horizontal Pod Autoscaler changes the replica count based on metrics such as CPU use; a cluster autoscaler adds or removes nodes. <Src id="k8s-hpa" />

## Trade-offs

- **Power vs complexity.** Kubernetes solves scheduling, healing and scaling, but it has many moving parts and a steep learning curve. A few services may be better served by a managed platform or plain VMs.
- **Managed vs self-run.** Managed offerings (EKS, GKE, AKS) run the control plane for you; self-hosting means operating etcd and upgrades yourself.
- **Stateless is easy, stateful is harder.** Databases on Kubernetes need StatefulSets and persistent volumes; many teams keep them on managed database services. <Src id="k8s-sts" />

## Interview tips

- Use Kubernetes vocabulary briefly: Deployment with N replicas, a Service in front, an HPA on CPU or queue length.
- Explain self-healing as a control loop: desired vs actual state.
- Don't make Kubernetes the centre of the design; it is the platform, not the architecture.
