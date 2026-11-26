---
slug: files-permissions-shell
title: Files, permissions and the shell
section: linux
readFirst:
  - processes-threads-memory
sources:
  - id: wiki-fd
    title: Wikipedia, File descriptor
    url: https://en.wikipedia.org/wiki/File_descriptor
    license: CC BY-SA 4.0
    use: reworded
  - id: wiki-perm
    title: Wikipedia, File-system permissions
    url: https://en.wikipedia.org/wiki/File-system_permissions
    license: CC BY-SA 4.0
    use: reworded
  - id: wiki-pipe
    title: Wikipedia, Pipeline (Unix)
    url: https://en.wikipedia.org/wiki/Pipeline_(Unix)
    license: CC BY-SA 4.0
    use: reworded
quiz:
  - prompt: In Unix, what is a file descriptor?
    options:
      - A file's name
      - A small integer a process uses to refer to an open file, socket or pipe
      - A permission bit
      - A disk block
    correct: 1
    explanation: Files, sockets and pipes are all reached through file descriptors.
  - prompt: A busy server logs "too many open files". What is it running out of?
    options:
      - Disk space
      - File descriptors, which every socket also uses
      - Threads
      - DNS entries
    correct: 1
    explanation: Each connection is a file descriptor. Raise the limit (ulimit -n) or close leaked ones.
  - prompt: What does chmod 640 mean?
    options:
      - Everyone can read and write
      - Owner read/write, group read, others nothing
      - Owner execute only
      - Group read/write, others read
    correct: 1
    explanation: 6 = rw-, 4 = r--, 0 = ---, for owner, group, others.
  - prompt: Why should a web server not run as root?
    options:
      - It runs slower
      - If attacked, the attacker gets full control of the machine
      - Root cannot open sockets
      - Root has no shell
    correct: 1
    explanation: Least privilege limits what a compromised process can do.
  - prompt: What does `grep ERROR app.log | wc -l` do?
    options:
      - Deletes error lines
      - Counts the lines containing ERROR by piping grep's output into wc
      - Opens two files
      - Runs grep twice
    correct: 1
    explanation: A pipe connects one program's output to the next program's input.
  - prompt: Which stream do programs usually write error messages to?
    options:
      - stdin
      - stdout
      - stderr
      - /dev/null
    correct: 2
    explanation: stdin is 0, stdout is 1, stderr is 2.
---

<script>
	import Src from '#lib/components/Src.svelte';
	import Term from '#lib/components/Term.svelte';
</script>

On Linux, almost everything is a file. Files, permissions and the shell are the everyday tools for running and debugging servers.

## What it is

A process reaches open files, sockets and pipes through **<Term id="file-descriptor">file descriptors</Term>**: small integers the kernel hands out. By convention 0 is standard input, 1 is standard output and 2 is standard error. <Src id="wiki-fd" />

**Permissions** decide who can read, write or execute a file. Each file has an owner and a group, and three sets of bits: for the owner, the group and everyone else. <Src id="wiki-perm" />

The **shell** runs programs and connects them. A pipe (`|`) sends one program's output straight into the next program's input. <Src id="wiki-pipe" />

## How it works

Permissions are often written in octal: read = 4, write = 2, execute = 1, added up for each of owner, group and others. `chmod 755` gives the owner everything and others read and execute; `chmod 600` keeps a file private to its owner. <Src id="wiki-perm" />

Each process has a limit on open file descriptors. Every network connection uses one, so a busy server can hit "too many open files" long before it runs out of CPU. <Src id="wiki-fd" />

Pipes let small tools combine into one-off analyses: <Src id="wiki-pipe" />

```sh
# Top 5 client IPs in an access log
cut -d' ' -f1 access.log | sort | uniq -c | sort -rn | head -5
```

Handy commands when a server misbehaves: `top` or `htop` (CPU and memory), `df -h` (disk space), `ss -tlnp` (listening sockets), `tail -f` (follow a log), `journalctl -u name` (service logs).

## Trade-offs

- **<Term id="least-privilege">Least privilege</Term> vs convenience.** Running services as their own unprivileged user is safer and costs a little setup.
- **Higher descriptor limits** let a server hold more connections but use more kernel memory.
- **Shell one-liners** are fast for exploring, but anything you run repeatedly belongs in a script or proper tooling.

## Interview tips

- Know that sockets are file descriptors; it explains connection limits on a single box.
- Mention running services as non-root users with only the permissions they need.
- In a debugging question, walk through what you'd check: CPU, memory, disk, open connections, logs.
