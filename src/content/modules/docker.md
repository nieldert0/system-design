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
    explanation: Containers use kernel features (namespaces and cgroups) instead of emulating hardware.
  - prompt: What is the difference between an image and a container?
    options:
      - They are the same thing
      - An image is the read-only package; a container is a running instance of it
      - A container is stored in the registry; an image runs
      - Images are only for Windows
    correct: 1
    explanation: Like a class and an object, one image can start many containers.
  - prompt: Which Linux feature stops a container from using more than 512 MB of memory?
    options:
      - Namespaces
      - Image layers
      - cgroups
      - The registry
    correct: 2
    explanation: Namespaces limit what a process can see; cgroups limit how much it can use. Going over a memory limit gets the process OOM-killed.
  - prompt: In the worked example, a deploy changes only application code. Why does each node download about 6 MB instead of the whole 180 MB image?
    options:
      - The registry compresses images to 6 MB
      - Nodes already hold the unchanged base and dependency layers, so they pull only the new code layer
      - Docker skips the download and builds on the node
      - The image is streamed lazily on first request
    correct: 1
    explanation: Layers are addressed by content hash, so a node only fetches layers it does not have. Ordering the Dockerfile so code is copied last keeps that layer small.
  - prompt: Why order a Dockerfile so dependencies are installed before the app code is copied?
    options:
      - It encrypts the image
      - It is required syntax
      - Layers are cached, so changing code does not reinstall dependencies on every build
      - It makes the image run faster
    correct: 2
    explanation: A change only rebuilds its layer and the ones after it.
  - prompt: Production pulls shop/api:latest. Yesterday's deploy and today's restart run different code. What is the fix?
    options:
      - Restart less often
      - Deploy by an immutable version tag or, better, by digest (sha256), so every pull gets the same bytes
      - Use a bigger registry
      - Rebuild the image on each server
    correct: 1
    explanation: Tags such as latest can be moved to a new image at any time; a digest names exact content.
  - prompt: A container exits with code 137 a few minutes after start, under load. What is the most likely cause?
    options:
      - A syntax error in the Dockerfile
      - The registry is down
      - The kernel killed it for exceeding its cgroup memory limit (137 = 128 + SIGKILL)
      - The image tag is wrong
    correct: 2
    explanation: Raise the limit or fix the memory use; for runtimes like the JVM, also make sure the heap size respects the container limit.
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

Containers package an app with everything it needs, so it runs the same on a laptop, in CI and in production. They are how almost every modern service is shipped, so an interviewer expects you to know what they are, what they cost, and where they break.

## What it is

Here is the problem. Your service works on your laptop with Python 3.12 and a particular version of OpenSSL. The production server has Python 3.9 and a different OpenSSL, a teammate's laptop has something else again, and a second app on the same server needs a conflicting library version. "Works on my machine" is not a deployment plan. The classic fix was one virtual machine per app, but a VM boots a whole guest operating system, takes tens of seconds to start and gigabytes of disk, and you fit only a handful on a host.

A **<Term id="container">container</Term>** solves this more cheaply. It is an ordinary Linux process that the kernel isolates: it shares the host's kernel, but it gets its own filesystem, its own network interfaces, and its own view of other processes, so to the app inside it looks like a machine of its own. This is called OS-level virtualization. Two kernel features do the work. **<Term id="linux-namespace">Namespaces</Term>** control what the process can *see* (its own process IDs, mount points, network stack, host name), and **<Term id="cgroup">cgroups</Term>** control how much it can *use* (CPU, memory, disk I/O). <Src id="wiki-os-virt" />

**Docker** is the tool that made containers easy to build, share and run, starting in 2013. <Src id="wiki-docker" /> Its key idea is the **<Term id="container-image">container image</Term>**: a read-only package holding the app, its libraries, its runtime and its default settings. A container is a running instance of an image, in the way an object is an instance of a class. Because the image carries everything above the kernel, the same image behaves the same on any Linux host. <Src id="k8s-containers" />

Containers are a building block for the rest of this section: [Kubernetes](/modules/kubernetes) runs them across a cluster, and [CI/CD](/modules/ci-cd-and-deployment) builds and ships them.

## How it works

### Building an image

A **Dockerfile** lists the steps to build an image: start from a base image (for example `python:3.12-slim`), copy files in, install dependencies, and set the command to run. Each instruction produces an **<Term id="image-layer">image layer</Term>**, a snapshot of the files that step added or changed. Layers stack: the final image is the base layer plus each change on top. <Src id="wiki-docker" />

Layers are identified by a hash of their content, which gives two useful properties. First, **build caching**: when you rebuild, Docker reuses every layer whose instruction and inputs have not changed, and only reruns from the first changed step onward. Second, **sharing**: ten images built from the same base store that base once on disk, and a server that already has a layer never downloads it again.

That is why Dockerfiles copy the dependency list (`requirements.txt`, `package.json`) and install dependencies *before* copying the rest of the source. Code changes on every commit; dependencies change rarely. Put the stable layers first and most builds reuse them.

A **<Term id="multi-stage-build">multi-stage build</Term>** goes further: one stage has compilers and build tools and produces the binary or bundle, and a final, small stage copies in only that output. The compilers never ship.

### Shipping an image

Images are named and tagged, as in `shop/api:1.4.2`, and stored in a **<Term id="container-registry">container registry</Term>** such as Docker Hub, Amazon ECR or GitHub Container Registry. Any machine with access can pull an image by name and run it. <Src id="k8s-images" />

A tag is a movable label: someone can push a new image as `1.4.2` or, more often, as `latest`. The exact bytes are named by the **<Term id="image-digest">image digest</Term>**, a SHA-256 hash such as `shop/api@sha256:9f86d0...`. Deploying by digest, or at least by a tag your registry refuses to overwrite, guarantees every server runs the same code. <Src id="k8s-images" />

The lifecycle is: `docker build` an image, `docker push` it to a registry, `docker pull` it on a server, and `docker run` a container from it.

<DockerFlow />

### Running a container

When a container starts, the runtime creates its namespaces and cgroup, stacks the image layers read-only, adds a thin **writable layer** on top for any files the app writes, and starts the process. No guest OS boots, so startup is roughly the time your app itself takes to start, often well under a second.

Limits come from cgroups. `docker run --memory 512m --cpus 1.5` caps the container at 512 MB of RAM and one and a half CPU cores. If the process goes over its memory limit, the kernel's out-of-memory killer ends it, an **<Term id="oom-kill">OOM kill</Term>**, and the container exits with code 137. CPU over its limit is not killed, only slowed (throttled).

### Containers are disposable

Anything written to the writable layer is lost when the container is removed, and in production containers are removed all the time: on every deploy, on every crash, when a host is drained. So persistent data goes in a **volume** (a directory mounted from the host or from network storage) or, more commonly, in an external store such as a database or [object storage](/modules/object-storage). Configuration and secrets come in through environment variables or mounted files, so one image runs unchanged in staging and production. A container that keeps no state of its own is <Term id="stateless">stateless</Term>, and stateless containers can be replaced, copied and moved freely. <Src id="k8s-containers" />

## Worked example

A team runs a Node.js API on **50 servers**, each with a 1 Gbit/s network link (about 100 MB/s in practice). They deploy about **10 times a day**.

**Step 1, the naive image.** The Dockerfile starts `FROM node:22` (about 1.1 GB, because it includes compilers and a full Debian userland), runs `COPY . .` and then `npm install`. The final image is **1.3 GB**. Because the source is copied before dependencies are installed, every code change invalidates the `npm install` layer, so every build reinstalls 200 MB of packages (about 90 s in CI) and produces new layers for both code and dependencies.

On deploy, each server pulls the changed layers, about 210 MB, in roughly 2 s at full link speed, but 50 servers pulling at once means the registry serves 50 × 210 MB = **10.5 GB per deploy**, or about 105 GB a day. A brand-new server, added during a traffic spike, must pull the full 1.3 GB before it can serve: around 13 s of download, plus decompression, before the app even starts.

**Step 2, reorder the layers.** Copy `package.json` and `package-lock.json` first, run `npm ci`, then copy the source. Now a code-only change rebuilds only the last layer, about **6 MB**. CI build time drops from about 90 s to about 10 s. Each deploy moves 50 × 6 MB = **300 MB** instead of 10.5 GB, a 35× cut.

**Step 3, multi-stage and a slim base.** The build stage uses `node:22` to compile TypeScript and install production dependencies; the final stage starts from `node:22-slim` (about 200 MB) and copies only `dist/` and `node_modules`. The image is now about **180 MB**. A fresh server pulls it in under 2 s, which matters when [autoscaling](/modules/kubernetes) adds servers mid-spike. The final image also has no compilers for an attacker to use, though slim images still ship npm and apt; a distroless base such as `gcr.io/distroless/nodejs22-debian12` removes the package managers and the shell as well.

**Step 4, a memory limit.** Each container runs with `--memory 512m`. Under a load test, one container exits with code 137 every few minutes. That is an OOM kill: the app's heap grows past 512 MB. The runtime's heap ceiling was never matched to the container's limit, so the fix is to set `--max-old-space-size=384` (leaving headroom for buffers and native memory) or raise the limit. Without the limit, the same leak would have slowly starved the other containers on the host instead of failing loudly in one.

Result: deploys are 35× lighter on the network, builds are 9× faster, and failures are contained to the container that caused them.

## In the real world

- **Docker Engine, containerd and runc.** `docker` is a client; the Docker daemon hands containers to **containerd**, which manages images and lifecycles, and containerd calls **runc** to set up namespaces and cgroups and start the process. Kubernetes talks to containerd or CRI-O directly through its Container Runtime Interface, and dropped its built-in Docker support (dockershim) in version 1.24. Images are portable across all of them because they follow the OCI (Open Container Initiative) image format.
- **BuildKit.** Docker's default builder since Docker 23. It runs independent stages in parallel, supports cache mounts (`RUN --mount=type=cache,target=/root/.npm`) so package downloads survive across builds, and can export the layer cache to a registry so CI machines share it.
- **Amazon ECR.** A managed registry with **tag immutability** (refuse to overwrite an existing tag), **lifecycle policies** (for example keep the last 30 images and expire untagged ones after 14 days, since registries otherwise grow forever), and image scanning for known vulnerabilities.
- **gVisor and Firecracker.** For untrusted code, a shared kernel is too much exposure. Google's **gVisor** puts a user-space kernel between the container and the host, and AWS's **Firecracker** runs each workload in a tiny virtual machine that boots in about 125 ms. AWS Lambda and Fargate use Firecracker, so customers get container-like speed with VM-like isolation.

## Trade-offs

| | Container | Virtual machine |
| --- | --- | --- |
| Isolation | Process-level, shared kernel | Full, own kernel |
| Start time | Under a second to seconds | Tens of seconds to minutes |
| Size | MBs to hundreds of MBs | GBs |
| Density | Dozens to hundreds per host | A handful to dozens per host |

- **Weaker isolation than VMs.** Every container on a host shares one kernel, so a kernel bug or a container running as root with extra privileges can reach its neighbours. Untrusted code runs in VMs or sandboxed runtimes such as gVisor. <Src id="wiki-os-virt" />
- **Image size against convenience.** Full base images include shells and debugging tools; slim or distroless images are smaller and safer but harder to debug in place.
- **Many containers need orchestration.** Placement, restarts, scaling and networking across many hosts is what [Kubernetes](/modules/kubernetes) is for. <Src id="k8s-containers" />

## Interview tips

- Say "each service ships as a container image, built once in CI, pushed to a registry, and deployed by digest".
- Keep containers stateless; put state in databases, caches and object storage.
- Know the difference between image and container, and between container and VM, and say which kernel features (namespaces, cgroups) make containers work.
- When an interviewer asks how a new server joins quickly, mention small images and layer caching.

**Common mistakes:**

- Deploying `:latest`. The tag moves, so two servers, or one server before and after a restart, can run different code, and rollback has nothing fixed to return to.
- Copying the whole source before installing dependencies, which throws away the layer cache on every commit.
- Writing data that matters to the container's filesystem and losing it on the next deploy.
- Running containers without memory limits, so one leaking process starves everything on the host.
- Baking secrets into the image. Anyone who can pull the image can read every layer, including files a later step deleted.

## Common follow-up questions

### How is a container different from a virtual machine?

A VM emulates hardware and runs its own kernel on a hypervisor, so it is strongly isolated but heavy: gigabytes of disk and tens of seconds to boot. A container is a process on the host kernel, fenced off with namespaces and cgroups, so it is light and starts in about the time the app takes, but every container shares one kernel and so one set of kernel bugs. In practice clouds run containers inside VMs: the VM separates customers, containers separate services.

### How do you make images small and builds fast?

Use a slim or distroless base, a multi-stage build so build tools stay out of the final image, a `.dockerignore` so `node_modules`, `.git` and test data are not sent to the builder, and order the Dockerfile from least to most frequently changing. In CI, share the layer cache between runners (BuildKit can push it to the registry).

### How should a containerised app handle configuration and secrets?

Build one image and inject the differences at run time: environment variables for plain settings, and secrets from a secret manager (AWS Secrets Manager, Vault, Kubernetes Secrets) mounted as files or variables. Never put them in the Dockerfile or the image, because image layers are readable by anyone who can pull the image.

### What happens when a container runs out of memory?

If it exceeds its cgroup memory limit, the kernel kills the process and the container exits with code 137. An orchestrator restarts it, but if the cause is a leak or a heap sized for the whole machine, it will crash again. Fix it by sizing the runtime's heap to the limit (the JVM does this with `-XX:MaxRAMPercentage`) and leaving headroom for non-heap memory.

### Should a database run in a container?

It can, with its data on a volume that outlives the container, and many teams do this for development and testing. In production, the hard parts of a database are replication, backups and failover, not packaging, so most teams use a managed database service and keep containers for stateless services.

## Go deeper

- [Docker building best practices](https://docs.docker.com/build/building/best-practices/): layer ordering, `.dockerignore`, pinning base images by digest, and keeping images small.
- [Docker multi-stage builds](https://docs.docker.com/build/building/multi-stage/): how to separate build and runtime stages, with examples.
- [Linux namespaces(7) man page](https://man7.org/linux/man-pages/man7/namespaces.7.html): every namespace type the kernel provides and what each one isolates.
- [What is gVisor?](https://gvisor.dev/docs/): why a shared kernel is a security boundary problem and how a user-space kernel narrows it.
