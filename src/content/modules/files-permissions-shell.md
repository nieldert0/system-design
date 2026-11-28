---
slug: files-permissions-shell
title: Files, permissions and the shell
section: linux
upgraded: true
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
  - prompt: In the worked example, a proxy holds 900 client connections and opens one upstream connection for each, with a limit of 1,024 descriptors. Why does it fail with "too many open files" well before 1,024 clients?
    options:
      - Each client uses two descriptors (client socket plus upstream socket), so 900 clients need about 1,800
      - Disk is full
      - Sockets do not use descriptors
      - The kernel reserves half the limit for root
    correct: 0
    explanation: A proxy pays twice per connection, plus log files and listening sockets. Raise LimitNOFILE and count both sides.
  - prompt: df says the disk is 100% full, but du over every directory adds up to 40%. What is the most likely explanation?
    options:
      - du is broken
      - A running process still holds a deleted file open, so its space is not freed
      - The filesystem is read-only
      - The permissions hide the files
    correct: 1
    explanation: Deleting a file only removes its name. The data stays until the last descriptor closes. Find it with lsof +L1, then restart or truncate.
  - prompt: You raised ulimit -n to 65536 in your shell, but the systemd service still hits 1,024. Why?
    options:
      - The change needs a reboot
      - A shell's ulimit only applies to processes started from that shell; systemd services take LimitNOFILE from their unit
      - Linux caps descriptors at 1,024
      - The service runs as root
    correct: 1
    explanation: Limits are per process and inherited from the parent. Set LimitNOFILE= in the unit file and restart the service.
---

<script>
	import Src from '#lib/components/Src.svelte';
	import Term from '#lib/components/Term.svelte';
	import FilePermissions from '#lib/diagrams/FilePermissions.svelte';
	import PipeFlow from '#lib/diagrams/PipeFlow.svelte';
</script>

On Linux, almost everything is a file. Files, permissions and the shell are the everyday tools for running and debugging servers, and they explain a class of production failures that have nothing to do with your code.

## What it is

A load test pushes an API server to 1,100 concurrent users and it starts refusing connections with `EMFILE: too many open files`. CPU is at 15% and memory is fine. The server has run out of file descriptors, because every network connection is a file as far as the kernel is concerned, and the default limit is 1,024. Understanding files, permissions and the shell is what lets you diagnose that in two minutes instead of two days.

A process reaches open files, sockets and pipes through **<Term id="file-descriptor">file descriptors</Term>**: small integers the kernel hands out, one per open thing. By convention 0 is standard input (stdin), 1 is standard output (stdout) and 2 is standard error (stderr). <Src id="wiki-fd" />

**Permissions** decide who can read, write or execute a file. Each file has an owning user and group, and three sets of bits: for the owner, the group and everyone else. <Src id="wiki-perm" />

The **shell** (usually bash or zsh) runs programs and wires them together. A **pipe** (`|`) sends one program's stdout straight into the next program's stdin, so small tools combine into bigger ones. <Src id="wiki-pipe" />

## How it works

### Files, inodes and descriptors

On disk, a file's data and metadata (owner, permissions, size, where the blocks live) are stored in an **<Term id="inode">inode</Term>**. A file name is just a directory entry pointing at an inode, which is why a file can have several names (hard links) and why renaming within one filesystem is instant.

When a process calls `open()`, the kernel creates an entry in its open-file table and returns the lowest free descriptor number. Reads, writes and `close()` all take that number. Sockets from `socket()` and `accept()`, pipes, and even timers and event queues like `epoll` are descriptors too, so one limit covers them all. <Src id="wiki-fd" />

Each process has a limit on open descriptors, shown by `ulimit -n`. It has a soft value (the one enforced) and a hard value (the ceiling the process may raise the soft one to). The common default soft limit is 1,024, which a busy server outgrows quickly. There is also a system-wide ceiling, `fs.file-max`, which is rarely the problem on modern kernels. You can see exactly what a process holds with `ls /proc/<pid>/fd` or `lsof -p <pid>`.

A subtle consequence: deleting a file (`rm`) only removes the name. If a process still has it open, the inode and its data stay on disk until the last descriptor closes. A log file deleted while the app is still writing to it keeps growing invisibly.

### Permissions

Permissions are written as `rwx` triples or in octal: read = 4, write = 2, execute = 1, added up for each of owner, group and others. `chmod 755` gives the owner everything and others read and execute, the usual setting for programs and directories. `chmod 640` lets the owner read and write and the group read, a good fit for a config file a service reads. `chmod 600` keeps a file private to its owner, which is what SSH insists on for private keys. <Src id="wiki-perm" />

<FilePermissions />

On a directory the bits mean something slightly different: read lists the names, write creates and deletes entries, and execute lets you pass through it to reach files inside. A file with mode 644 inside a directory with mode 700 is still unreachable to others.

New files get their mode from what the program requests minus the **<Term id="umask">umask</Term>**. With the common umask of 022, a file requested as 666 is created as 644. A few special bits matter too: **setuid** on a program makes it run as the file's owner rather than the caller (that is how `passwd` edits a root-owned file), and the **sticky bit** on `/tmp` stops users deleting each other's files. Root bypasses ordinary permission checks entirely, which is why services should not run as root. Linux also splits root's power into **capabilities**, so a process can be granted just `CAP_NET_BIND_SERVICE` to bind port 80 without being root. This is <Term id="least-privilege">least privilege</Term> applied at the OS level; [security basics](/modules/security-basics) covers it across the stack.

### The shell, redirection and pipes

Programs read stdin and write stdout and stderr, and the shell decides where those go. `>` sends stdout to a file (overwriting), `>>` appends, `2>&1` sends stderr wherever stdout is going, and `< file` feeds a file into stdin. Keeping errors on stderr means a pipeline's data stays clean while errors still reach your terminal or the service's log. <Src id="wiki-pipe" />

A pipe is a small kernel buffer (64 KB by default on Linux) between two processes running at the same time. When the buffer is full the writer blocks, and when it is empty the reader blocks, so a pipeline processes a 10 GB log in constant memory: <Src id="wiki-pipe" />

```sh
# Top 5 client IPs in an access log
cut -d' ' -f1 access.log | sort | uniq -c | sort -rn | head -5
```

<PipeFlow />

Every program also returns an **exit code**: 0 for success, anything else for failure. Shells use it for `&&` and `||`, and supervisors use it to decide whether to restart a service. A code above 128 means the process died from a signal; 137 is 128 + 9, a SIGKILL, often from the out-of-memory killer described in [processes, threads and memory](/modules/processes-threads-memory).

### Debugging toolkit

When a server misbehaves, these are the first commands: `top` or `htop` (CPU and memory per process), `free -m` (RAM and swap), `df -h` (disk space per filesystem), `du -sh *` (what is using it), `ss -tlnp` (listening sockets and their processes), `lsof -p <pid>` (open files), `tail -f` (follow a log) and `journalctl -u name` (logs of a systemd service).

## Worked example

A reverse proxy runs as a systemd service on a host with the default limit of 1,024 descriptors. Each client connection uses one descriptor, and the proxy opens one upstream connection per client to the app servers, so each client costs two. Add 3 listening sockets, 4 log files and about 10 internal descriptors (epoll, pipes, timers).

1. **Find the ceiling.** Usable descriptors: 1,024 - 17 = 1,007. At 2 per client the proxy tops out at about **503 concurrent clients**, not 1,024.
2. **Watch it fail.** Traffic grows to 600 concurrent clients. The 504th `accept()` returns `EMFILE`. New clients see connection resets or timeouts, while CPU sits at 10%. `ls /proc/$(pidof proxy)/fd | wc -l` prints 1024.
3. **Fix it properly.** Raising `ulimit -n` in your SSH session does nothing for the service, because limits are per process and inherited from the parent, and the service's parent is systemd. Set `LimitNOFILE=65536` in the unit file, run `systemctl daemon-reload` and restart. New ceiling: (65,536 - 17) / 2, about **32,750 clients**.
4. **Check the cost.** Each open socket costs a few KB of kernel memory plus the proxy's own buffers. At 32,000 clients and about 16 KB per connection pair, that is about 500 MB, comfortably within a 4 GB box. The limit was never protecting anything important.
5. **The disk-full twist.** A week later `df -h` shows `/var` at 100%, but `du -sh /var/*` adds up to 40%. Someone `rm`-ed a 30 GB `access.log` that the proxy still had open. `lsof +L1` lists open files with zero links and shows the culprit. Truncating with `: > /proc/<pid>/fd/<n>`, or reloading the proxy so it reopens its logs, frees the space. The real fix is log rotation that signals the process to reopen its files.

## In the real world

- **systemd.** Most Linux services run under systemd units. `LimitNOFILE=` sets the descriptor limit (systemd's default soft limit is 1,024 with a much higher hard limit), `User=` and `Group=` drop root, `DynamicUser=yes` invents a throwaway user, and `ProtectSystem=strict` and `AmbientCapabilities=CAP_NET_BIND_SERVICE` lock the service down while still letting it bind port 80.
- **NGINX.** `worker_rlimit_nofile` raises the descriptor limit for worker processes, and it must cover `worker_connections` plus log files and other non-connection descriptors. `worker_connections` already counts both client and upstream connections, so when proxying each worker serves only about half that many clients. The master process starts as root to bind ports 80 and 443, then workers run as the unprivileged `user` (often `nginx` or `www-data`).
- **PostgreSQL.** The server refuses to start if its data directory is readable by others: it requires mode 0700 (or 0750 with group access). `max_files_per_process` (default 1,000) caps how many files each backend keeps open.
- **logrotate.** Rotates logs daily or by size, then uses `postrotate` to signal the app (for NGINX, `kill -USR1`) to reopen its files, or `copytruncate` for apps that cannot reopen, which avoids exactly the deleted-but-open trap above.

## Trade-offs

- **Least privilege vs convenience.** Running each service as its own unprivileged user, with only the capabilities it needs, costs a little setup and blocks most damage from a compromise.
- **Higher descriptor limits** let a server hold more connections, and cost only kernel memory per open descriptor. Very high limits can hide a leak for longer, so pair them with a metric on open descriptors.
- **Shell one-liners vs scripts.** One-liners are unbeatable for exploring a live box. Anything you run twice, or anything that touches production state, belongs in a reviewed script or proper tooling.

**Common mistakes:**

- **`chmod -R 777` to make an error go away.** It gives every user, and every compromised process, write access. Find which user needs which access and grant only that.
- **Raising `ulimit` in the wrong place.** A shell's limit does not reach a systemd service or a container; set it in the unit file or the container runtime.
- **Deleting a log file that a process still has open.** The space is not freed until the process closes it. Truncate, or signal the process to reopen.
- **Leaking descriptors.** Forgetting to close files or HTTP response bodies makes descriptor count climb until the process hits its limit, often days after a deploy.

## Interview tips

- Know that sockets are file descriptors; it explains connection limits on a single box and why a proxy needs twice as many.
- Mention running services as non-root users with only the permissions they need.
- In a debugging question, walk through what you would check in order: CPU, memory, disk, open connections and descriptors, then logs.
- If the topic is containers, link this to [Docker](/modules/docker): a container is still a process with descriptors, a user and a filesystem view.

## Common follow-up questions

### How many connections can one Linux server hold?

The descriptor limit is the first wall, and it is a configuration choice; millions are possible. Past that, each connection costs kernel memory for socket buffers, and the client side runs out of ephemeral ports (about 28,000 by default) per destination address and port. Well-tuned event-loop servers hold a million idle connections on one box; the real ceiling is usually memory and the work each connection generates.

### What is the difference between a hard link and a symbolic link?

A hard link is a second directory entry pointing at the same inode, so both names are equally real and the data lives until the last link and the last open descriptor go away. A symbolic link is a tiny file containing a path; it can cross filesystems and point at directories, but breaks if the target moves. Deploy tools often switch a `current` symlink between release directories to make a release atomic.

### How does a process bind port 80 without running as root?

Ports below 1,024 traditionally need root. Options: start as root, bind the socket, then drop to an unprivileged user (what NGINX does); grant only the `CAP_NET_BIND_SERVICE` capability; or listen on a high port like 8080 behind a load balancer or [reverse proxy](/modules/reverse-proxies-api-gateways) that owns port 80. In containers and Kubernetes the last option is the norm.

### Why does `df` disagree with `du`?

`du` walks directory entries and adds up file sizes, while `df` asks the filesystem how many blocks are in use. Files that are deleted but still open have no name, so `du` cannot see them but `df` still counts their blocks. Mounts hiding files underneath and reserved root blocks (5% by default on ext4) explain the smaller differences.

## Go deeper

- [open(2), Linux manual page](https://man7.org/linux/man-pages/man2/open.2.html): exactly how descriptors are created, the flags, and the errors such as EMFILE.
- [credentials(7), Linux manual page](https://man7.org/linux/man-pages/man7/credentials.7.html): users, groups and the real, effective and saved IDs behind permission checks.
- [systemd.exec](https://www.freedesktop.org/software/systemd/man/latest/systemd.exec.html): every sandboxing and limit option for a service, including LimitNOFILE and capabilities.
- [Bash Reference Manual, Redirections](https://www.gnu.org/software/bash/manual/html_node/Redirections.html): the precise rules for >, >>, 2>&1 and friends.
