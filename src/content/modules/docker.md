---
slug: docker
title: Docker
section: devops
readFirst:
  - processes-threads-memory
  - files-permissions-shell
sources:
  - id: wiki-docker
    title: Wikipedia, Docker (software)
    url: https://en.wikipedia.org/wiki/Docker_(software)
    license: CC BY-SA 4.0
    use: reworded
  - id: wiki-os-virt
    title: Wikipedia, OS-level virtualization
    url: https://en.wikipedia.org/wiki/OS-level_virtualization
    license: CC BY-SA 4.0
    use: reworded
  - id: k8s-containers
    title: Kubernetes Documentation, Containers
    url: https://kubernetes.io/docs/concepts/containers/
    license: CC BY 4.0
    use: reworded
  - id: k8s-images
    title: Kubernetes Documentation, Images
    url: https://kubernetes.io/docs/concepts/containers/images/
    license: CC BY 4.0
    use: reworded
quiz:
  - prompt: What is a container?
    options:
      - A type of database
      - A full virtual machine with its own kernel
      - An isolated process that shares the host's kernel but has its own filesystem, network and process view
      - A physical server
    correct: 2
    explanation: Containers use kernel features (namespaces, cgroups) instead of emulating hardware.
  - prompt: What is the difference between an image and a container?
    options:
      - They are the same thing
      - An image is the read-only package; a container is a running instance of it
      - A container is stored in the registry; an image runs
      - Images are only for Windows
    correct: 1
    explanation: Like a class and an object, one image can start many containers.
  - prompt: Why are containers faster to start than virtual machines?
    options:
      - They do not boot a guest operating system; they start a process on the existing kernel
      - They skip the network
      - They are always smaller than 1 MB
      - They use faster disks
    correct: 0
    explanation: Startup is roughly the time to start the app itself, often well under a second.
  - prompt: What does a registry do?
    options:
      - Balances load
      - Stores logs
      - Runs containers
      - Stores and serves images so any machine can pull them
    correct: 3
    explanation: Docker Hub, Amazon ECR and GitHub Container Registry are examples.
  - prompt: Why order a Dockerfile so dependencies are installed before the app code is copied?
    options:
      - It encrypts the image
      - It is required syntax
      - Layers are cached, so changing code does not reinstall dependencies on every build
      - It makes the image run faster
    correct: 2
    explanation: A change only rebuilds its layer and the ones after it.
  - prompt: Where should a container keep data that must survive a restart?
    options:
      - In its own writable layer
      - In a volume or an external store such as a database or object storage
      - In environment variables
      - In the image
    correct: 1
    explanation: Containers are disposable; their writable layer is lost when they are removed.
---

<script>
	import Src from '#lib/components/Src.svelte';
	import Term from '#lib/components/Term.svelte';
	import DockerFlow from '#lib/diagrams/DockerFlow.svelte';
</script>

Containers package an app with everything it needs, so it runs the same on a laptop, in CI and in production.

## What it is

A **<Term id="container">container</Term>** is an isolated process: it shares the host's kernel, but gets its own filesystem, network and view of other processes. This is OS-level virtualization; the kernel features behind it on Linux are namespaces (what a process can see) and cgroups (how much CPU and memory it can use). <Src id="wiki-os-virt" />

**Docker** is the tool that made containers easy to build, share and run. <Src id="wiki-docker" /> A **<Term id="container-image">container image</Term>** is a read-only package holding the app, its libraries and settings; a container is a running instance of an image. <Src id="k8s-containers" />

## How it works

A **Dockerfile** lists the steps to build an image: start from a base image, copy files, install dependencies, set the start command. Each step adds a **layer**. Layers are cached and shared between images, so a rebuild only redoes the layers that changed. <Src id="wiki-docker" />

Images are named and tagged (`shop/api:1.4.2`) and stored in a **registry**. Any machine can pull an image by name and run it. Pinning a version tag or digest means every server runs exactly the same bits. <Src id="k8s-images" />

The lifecycle: build an image with `docker build`, push it to a registry such as Docker Hub, pull it on a server, and run a container from it. <Src id="wiki-docker" />

<DockerFlow />

**Containers are disposable.** Anything written inside a container is lost when it is removed, so persistent data goes in a volume or an external store, and config comes in through environment variables. <Src id="k8s-containers" />

## Trade-offs

| | Container | Virtual machine |
| --- | --- | --- |
| Isolation | Process-level, shared kernel | Full, own kernel |
| Start time | Under a second to seconds | Tens of seconds to minutes |
| Size | MBs to hundreds of MBs | GBs |
| Density | Many per host | Fewer per host |

- **Weaker isolation** than VMs: a kernel bug can affect every container on a host. Untrusted code often runs in VMs or sandboxed runtimes. <Src id="wiki-os-virt" />
- **Many containers need orchestration** (placement, restarts, scaling, networking); that is what Kubernetes is for. <Src id="k8s-containers" />

## Interview tips

- Say "each service ships as a container image, built in CI and pushed to a registry".
- Keep containers stateless; put state in databases, caches and object storage.
- Know the difference between image and container, and container and VM.
