---
slug: processes-threads-memory
title: Processes, threads and memory
section: linux
readFirst:
  - performance-vs-scalability
sources:
  - id: wiki-process
    title: Wikipedia, Process (computing)
    url: https://en.wikipedia.org/wiki/Process_(computing)
    license: CC BY-SA 4.0
    use: reworded
  - id: wiki-thread
    title: Wikipedia, Thread (computing)
    url: https://en.wikipedia.org/wiki/Thread_(computing)
    license: CC BY-SA 4.0
    use: reworded
  - id: wiki-vm
    title: Wikipedia, Virtual memory
    url: https://en.wikipedia.org/wiki/Virtual_memory
    license: CC BY-SA 4.0
    use: reworded
quiz:
  - prompt: What is the key difference between a process and a thread?
    options:
      - Threads are always faster
      - Processes have their own memory space; threads in one process share memory
      - Processes cannot run in parallel
      - Threads need their own IP address
    correct: 1
    explanation: Each process is isolated in its own address space. Threads inside a process share it.
  - prompt: A worker crashes with a bad pointer. Which model limits the damage to one worker?
    options:
      - Many threads in one process
      - Many separate processes
      - One thread
      - It makes no difference
    correct: 1
    explanation: Process isolation means one process crashing does not take others' memory with it.
  - prompt: What does virtual memory give each process?
    options:
      - Its own private address space, mapped by the OS onto physical RAM (or disk)
      - Infinite RAM
      - A faster CPU
      - A network socket
    correct: 0
    explanation: The OS maps each process's virtual addresses to physical memory and can page to disk.
  - prompt: A server suddenly gets very slow and the disk is busy, though CPU is low. What is a likely cause?
    options:
      - DNS caching
      - Swapping, because memory ran out and pages are moving to disk
      - Too few threads
      - TLS handshakes
    correct: 1
    explanation: When RAM runs out the OS pages to disk, which is orders of magnitude slower.
  - prompt: In the worked example, a 16 GB box runs thread-per-connection with 1 MB of stack actually touched per thread. Roughly how many concurrent connections fit before memory, not CPU, becomes the limit?
    options:
      - About 1,000
      - About 12,000, after leaving room for the OS and the heap
      - About 1,000,000
      - Unlimited, because stacks are virtual
    correct: 1
    explanation: With about 12 GB left for stacks at 1 MB each you get roughly 12,000 threads. An event loop holding a few KB per connection fits hundreds of thousands.
  - prompt: A Node.js API serves 5,000 requests per second fine, then one endpoint starts hashing passwords synchronously with bcrypt.hashSync() for 100 ms each. What happens to the other endpoints?
    options:
      - Nothing, Node runs each request on its own thread
      - Their latency jumps, because the CPU work blocks the single event-loop thread
      - They get faster because the CPU is warmed up
      - Node automatically spreads the work over all cores
    correct: 1
    explanation: The event loop can only do one thing at a time. Move CPU-heavy work to a worker pool (worker_threads) or a separate service.
  - prompt: A container with a 2 GB memory limit keeps getting killed with exit code 137 while the host has 30 GB free. Why?
    options:
      - The host is swapping
      - The container's cgroup hit its own limit, so the kernel's OOM killer ended a process inside it
      - The network dropped
      - Exit code 137 means a segmentation fault
    correct: 1
    explanation: 137 is 128 + 9, a SIGKILL. A cgroup limit triggers the OOM killer no matter how much the host has free.
  - prompt: An 8-core machine runs a purely CPU-bound job. Going from 8 to 64 threads will most likely
    options:
      - Make it about 8 times faster
      - Make it no faster, and maybe slower, because extra threads only add context switches
      - Use less memory
      - Halve the latency
    correct: 1
    explanation: Only 8 threads can run at once. The rest wait their turn and cost switching and cache misses.
---

<script>
	import Src from '#lib/components/Src.svelte';
	import Term from '#lib/components/Term.svelte';
	import ConcurrencyModelsFlow from '#lib/diagrams/ConcurrencyModelsFlow.svelte';
</script>

Every server you design runs as processes and threads on an operating system. Knowing how they share CPU and memory explains a surprising number of scaling limits: why a box tops out at a few thousand connections, why adding threads stops helping, and why a server can freeze with its CPU sitting idle.

## What it is

Picture a Java server that starts one thread per connection. At 500 users it is fine. At 20,000 users it falls over, not because the CPU is busy, but because 20,000 thread stacks have eaten the RAM and the machine spends its time switching between threads instead of running them. The fix depends on understanding three things the operating system gives every program.

A **<Term id="process">process</Term>** is a running program: its code, its memory, and the resources the kernel has handed it, such as open files and sockets. Each process is walled off from the others, so one cannot read or scribble over another's memory. <Src id="wiki-process" />

A **<Term id="thread">thread</Term>** is one sequence of instructions the kernel can schedule onto a CPU core. A process has one or more threads, and all the threads in a process share its memory. That sharing is what makes threads cheap to start and easy to pass data between, and it is also what makes them dangerous. <Src id="wiki-thread" />

**<Term id="virtual-memory">Virtual memory</Term>** gives every process the illusion of its own large, private address space. The kernel maps those addresses onto physical RAM page by page (a page is usually 4 KB), and can move pages nobody is using out to disk. <Src id="wiki-vm" />

## How it works

### Scheduling and context switches

A machine with 8 cores can run exactly 8 threads at any instant. The kernel's scheduler (on Linux, the Completely Fair Scheduler and its successor EEVDF) gives each runnable thread a short slice of CPU time, then picks another. Swapping one thread out for another is a **<Term id="context-switch">context switch</Term>**: the kernel saves the registers of the old thread, loads the new one's, and, if the new thread belongs to another process, switches the memory mapping too. <Src id="wiki-thread" />

A switch costs a few microseconds directly, but the bigger cost is indirect: the new thread finds the CPU <Term id="cache">cache</Term> full of the old thread's data and runs slowly until it warms up again. A few thousand switches a second is nothing. Hundreds of thousands a second, which you get from tens of thousands of busy threads, is a real tax.

Threads that are waiting, for a disk read, a network reply or a lock, are not runnable and cost no CPU. This is the key to the I/O-bound versus CPU-bound split. A **CPU-bound** workload (image resizing, compression, hashing) wants about one thread per core; more just queue up. An **I/O-bound** workload (most web APIs, which spend their time waiting on databases) can keep many more requests in flight than there are cores, because most of them are waiting at any moment.

### Processes vs threads

Threads share memory, so two threads can update the same variable at once and corrupt it. That is a **race condition**, and the cure is locks, which bring their own problems: contention (threads queueing for the same lock) and deadlocks (two threads each waiting for the lock the other holds). A bad pointer in one thread can also crash the whole process, taking every other thread down with it. <Src id="wiki-thread" />

Processes do not share memory by default, so a crash in one worker leaves the others untouched. They cost more to start and they talk to each other through pipes, sockets or explicitly shared memory rather than plain variables. <Src id="wiki-process" /> Linux narrows the start-up gap with **<Term id="copy-on-write">copy-on-write</Term>**: when a process calls `fork()` to create a child, the child initially shares all the parent's pages, and a page is only copied when one side writes to it. That is why a pre-fork server like Gunicorn can start 16 workers almost instantly.

### Memory: resident, virtual and swapped

Because addresses are virtual, two numbers describe a process's memory. **Virtual size** (VSZ in `ps`) is everything it has reserved, which can be huge and mostly means nothing. **Resident set size** (RSS) is how much is actually in RAM right now, and is the number to watch. A thread's stack is a good example: Linux reserves 8 MB of virtual space per thread by default, but only the pages the thread actually touches become resident.

When a process touches a page that is not in RAM, the CPU raises a **<Term id="page-fault">page fault</Term>** and the kernel fills it in. A minor fault (the page just needs mapping) is cheap. A major fault (the page has to come back from disk) costs milliseconds. When RAM runs out, the kernel pushes pages to swap on disk. Disk is thousands of times slower than RAM, so a swapping server can look hung while its CPU sits idle and its disk is pinned. <Src id="wiki-vm" />

If there is no swap, or swap is full too, the kernel's **<Term id="oom-killer">OOM killer</Term>** picks a process, usually the biggest, and kills it with SIGKILL. In a container the same thing happens when the container hits its own memory limit, set through a <Term id="cgroup">cgroup</Term>, even if the host has plenty free.

### Concurrency models

Servers handle many requests at once in three common ways:

- **Process per worker** (PHP-FPM, Gunicorn sync workers, Postgres backends): each worker is isolated, so a crash or a leak kills one worker. Memory cost is a full process per concurrent request, often 30 to 100 MB.
- **Thread per request** (classic Tomcat, Spring MVC): straightforward blocking code. Memory and switching cost grow with concurrent connections, so a fixed thread pool caps concurrency.
- **<Term id="event-loop">Event loop</Term>** (Node.js, NGINX, Redis): one thread watches thousands of sockets with `epoll` and runs whichever is ready. Idle connections cost a few KB each. The catch is that any CPU-heavy work on that thread blocks every other connection.

<ConcurrencyModelsFlow />

Modern runtimes blur the line. Go's goroutines and Java 21's virtual threads let you write blocking-style code while the runtime multiplexes many lightweight tasks onto a few kernel threads, so each waiting task costs kilobytes, not a megabyte. The same scaling thinking applies to the whole system in [performance vs scalability](/modules/performance-vs-scalability), and the per-connection cost shows up again in [TCP and UDP](/modules/tcp-and-udp).

## Worked example

You run a chat service on one machine with 8 cores and 16 GB of RAM. Each user holds a long-lived connection that is idle 99% of the time. How many users fit, under each model?

1. **Budget the memory.** The OS, page cache and the app's own heap need about 4 GB, leaving 12 GB for per-connection cost.
2. **Thread per connection.** Each thread reserves 8 MB of stack but touches, say, 1 MB once the request handlers and buffers are in use, plus about 10 KB of kernel bookkeeping. 12 GB / 1 MB is about **12,000 connections**. Long before that, 12,000 threads waking on messages push context switches into the hundreds of thousands per second, and the scheduler starts to show up in the CPU profile.
3. **Event loop.** Each connection is a socket plus a small user-space buffer, about 10 KB in total. 12 GB / 10 KB is about **1.2 million connections** by memory. In practice you hit other limits first, such as the file descriptor limit covered in [files, permissions and the shell](/modules/files-permissions-shell), and the CPU cost of the messages themselves. Run 8 event-loop processes, one per core, to use all the CPU.
4. **Now add CPU work.** Suppose 1% of messages trigger a 50 ms image thumbnail. At 2,000 messages per second that is 20 thumbnails a second, or 1 full core-second per second. In a single event loop, every one of those 50 ms blocks stalls every other user on that loop, so chat latency for everyone jumps from about 1 ms to tens of milliseconds. Moving thumbnails to a pool of 2 worker threads keeps the loop free and costs 1 of your 8 cores.
5. **Then run out of memory.** A leak adds 1 MB per hour per process. After a week each of the 8 processes has grown by 168 MB, which is fine. A leak of 100 MB per hour fills the 12 GB headroom in about 15 hours: the kernel starts swapping, p99 latency goes from 5 ms to seconds, and then the OOM killer terminates a worker and drops 150,000 connections at once. A memory limit per worker plus a restart policy turns that into a planned, smaller failure.

The lesson: count memory per connection and CPU per request separately, because they decide different limits.

## In the real world

- **Gunicorn.** Python's common app server forks worker processes. The docs suggest `workers = (2 x cores) + 1` as a starting point; `--max-requests` recycles a worker after N requests to contain memory leaks, and `--worker-class gthread` or `gevent` adds threads or green threads per worker for I/O-bound apps.
- **NGINX.** `worker_processes auto` starts one event-loop process per core, and `worker_connections` (default 512) caps connections per worker, so total capacity is roughly the product. It is the textbook event-loop server.
- **Node.js.** One event loop per process, plus a libuv thread pool for file and DNS work sized by `UV_THREADPOOL_SIZE` (default 4). CPU-heavy JavaScript goes to `worker_threads`, and `--max-old-space-size` sets the heap ceiling.
- **Linux kernel knobs.** `vm.swappiness` (default 60) controls how eagerly the kernel swaps; many database hosts set it to 1 to 10. `vm.overcommit_memory` decides whether the kernel promises more memory than it has, and `oom_score_adj` per process steers which one the OOM killer picks. Postgres docs, for example, recommend protecting the postmaster this way.

## Trade-offs

| | Process per worker | Thread per request | Event loop |
| --- | --- | --- | --- |
| Isolation | Strong, crash kills one worker | Weak, crash kills all | Weak, crash kills all |
| Memory per in-flight request | Tens of MB | About 1 MB | A few KB |
| Code style | Simple, blocking | Simple, blocking, needs locks | Callbacks or async/await |
| CPU-heavy work | Fine | Fine | Blocks everyone, needs offloading |

- **More threads is not more speed.** Past the number of cores, CPU-bound threads only add switching.
- **Event loops scale I/O, not CPU.** Offload heavy computation to a worker pool.
- **Memory is a hard limit.** Running out leads to swapping or the OOM killer, and both are worse than refusing new work early.

**Common mistakes:**

- **Sizing thread pools by gut.** Setting 1,000 threads for a CPU-bound job on 8 cores just adds context switches. Size CPU-bound pools near the core count and I/O-bound pools by how long requests wait.
- **Reading VSZ instead of RSS.** A Java process showing 20 GB virtual but 2 GB resident is not using 20 GB. Alerting on virtual size raises false alarms and hides real leaks.
- **Blocking the event loop.** A synchronous file read, a big `JSON.parse` or a regex with catastrophic backtracking stalls every connection on that loop.
- **Enabling generous swap on latency-sensitive hosts.** Swap turns a crisp out-of-memory failure into minutes of near-hang, which load balancers often fail to detect.

## Interview tips

- Say whether a workload is CPU-bound or I/O-bound; it decides threads versus an event loop and how many cores you need.
- When estimating capacity, count memory per connection, not just requests per second.
- "Stateless app servers" means no user data lives in process memory, so any copy can serve any request and a crashed process loses nothing important. That is what lets you scale out with a load balancer.
- If asked about a slow server, check CPU, memory and swap first (`top`, `free -m`, `vmstat 1`), then disk and network.

## Common follow-up questions

### How many threads should a thread pool have?

For CPU-bound work, about the number of cores, maybe plus one. For I/O-bound work, use the ratio of waiting to computing: threads = cores x (1 + wait time / compute time). A request that computes for 5 ms and waits 45 ms on the database wants about 10 threads per core. Then measure, because the database usually becomes the real limit first.

### Why is `fork()` fast if it copies the whole process?

It does not copy anything up front. With copy-on-write, parent and child share the same physical pages, marked read-only, and the kernel copies a page only when one of them writes to it. A child that immediately calls `exec()` to run another program copies almost nothing.

### What is the difference between a thread and a goroutine or virtual thread?

A kernel thread is scheduled by the OS and reserves a megabyte-scale stack. A goroutine or Java virtual thread is scheduled by the language runtime onto a small pool of kernel threads, starts with a stack of a few KB that grows on demand, and parks cheaply when it blocks on I/O. You get blocking-style code with event-loop-like memory cost, so a million of them is practical.

### What happens when a Linux machine runs out of memory?

First the kernel drops page cache, which is free to discard. Then it swaps anonymous pages to disk if swap exists, and latency degrades badly. If it still cannot find memory, the OOM killer picks a victim based on `oom_score`, mostly how much memory it uses, and sends SIGKILL. In a container, the cgroup's own limit triggers this independently of the host.

### Why is Redis single-threaded and still so fast?

Each command is a quick in-memory operation, so the bottleneck is network I/O, not CPU. One thread with an event loop avoids locks entirely and keeps the CPU cache warm. Redis 6 added optional I/O threads (`io-threads`) for reading and writing sockets, but commands still execute on one thread, which is why a slow command like `KEYS *` blocks everyone. See [cache strategies and eviction](/modules/cache-strategies-and-eviction) for how Redis is used.

## Go deeper

- [Brendan Gregg, Linux Performance](https://www.brendangregg.com/linuxperf.html): the standard map of Linux observability tools and what each one measures.
- [Mel Gorman, Understanding the Linux Virtual Memory Manager: Out Of Memory Management](https://www.kernel.org/doc/gorman/html/understand/understand016.html): how the kernel chooses what to kill when memory runs out.
- [Node.js, Don't Block the Event Loop](https://nodejs.org/en/learn/asynchronous-work/dont-block-the-event-loop): concrete examples of what stalls an event loop and how to offload it.
- [Dan Kegel, The C10K problem](http://www.kegel.com/c10k.html): the classic essay on serving 10,000 connections and why event loops won.
