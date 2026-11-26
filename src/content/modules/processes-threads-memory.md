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
  - prompt: What is a context switch?
    options:
      - Changing the active git branch
      - The CPU saving one task's state and loading another's
      - Switching DNS servers
      - Restarting the machine
    correct: 1
    explanation: Switching costs time, which is why thousands of busy threads can slow a server down.
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
  - prompt: Why do servers like Node.js or NGINX use an event loop?
    options:
      - To avoid using TCP
      - To handle many connections that mostly wait on I/O without a thread per connection
      - Because threads are not available on Linux
      - To use more memory
    correct: 1
    explanation: One thread can juggle thousands of idle connections, avoiding per-thread memory and switching cost.
---

<script>
	import Src from '#lib/components/Src.svelte';
	import Term from '#lib/components/Term.svelte';
</script>

Every server you design runs as processes and threads on an operating system. Knowing how they share CPU and memory explains many scaling limits.

## What it is

A **<Term id="process">process</Term>** is a running program: its code, its memory and the resources the OS gave it, such as open files and sockets. Processes are isolated from each other. <Src id="wiki-process" />

A **<Term id="thread">thread</Term>** is a sequence of instructions the OS can schedule. A process has one or more threads, and the threads of one process share its memory. <Src id="wiki-thread" />

**Virtual memory** gives each process its own address space. The OS maps those addresses onto physical RAM, and can move rarely used pages out to disk. <Src id="wiki-vm" />

## How it works

The OS scheduler gives each runnable thread a slice of CPU time. Switching from one thread to another (a context switch) means saving and loading registers and often losing CPU cache warmth, so it is not free. <Src id="wiki-thread" />

Threads are cheap to create and share data easily, but shared memory means races and locks. Processes are heavier but isolated: a crash in one does not corrupt another. <Src id="wiki-process" />

When memory runs short, the OS swaps pages to disk. Disk is thousands of times slower than RAM, so a swapping server can look "hung" while its CPU sits idle. <Src id="wiki-vm" />

Servers handle concurrency in a few common ways:

- **Process per worker** (e.g. PHP-FPM, Gunicorn workers): isolated, uses more memory.
- **Thread per request** (e.g. classic Java servers): simple code, memory and switching cost grow with connections.
- **Event loop** (e.g. Node.js, NGINX): one thread serves many connections that mostly wait on I/O; CPU-heavy work blocks everyone.

## Trade-offs

- **Processes vs threads:** isolation and safety against memory and start-up cost.
- **More threads is not more speed.** Past the number of cores, CPU-bound threads only add switching.
- **Event loops scale I/O, not CPU.** Offload heavy computation to a worker pool.
- **Memory is a hard limit.** Running out leads to swapping or the kernel's out-of-memory killer.

## Interview tips

- Say whether a workload is CPU-bound or I/O-bound; it decides threads vs event loop and how many cores you need.
- When estimating capacity, count memory per connection, not just requests per second.
- "Stateless app servers" means no user data lives in process memory, so any copy can serve any request.
