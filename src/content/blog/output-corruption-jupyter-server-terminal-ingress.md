---
title: 排查通过 Ingress 暴露的 Jupyter Lab 的伪终端间歇性输出字符问题
description: 本文介绍了排查通过 Ingress 暴露的 Jupyter Lab 的伪终端间歇性输出字符问题的症状、原因以及解决方案。
pubDate: 2023-11-27T21:50:10+08:00
categories:
- Troubleshooting
tags:
- Kubernetes
- Jupyter
- Ingress
---

## 背景

- Python 3.8.10
- Vim 8.1
- jupyterlab 3.6.5
- jupyter-server 2.6.0
- jupyter-server-terminals 0.4.4
- terminado 0.17.1

在公司的内部环境中，我们将 Jupyter Lab 作为一个服务部署在 Kubernetes 集群中作为用户的开发环境，并通过 Ingress 将其暴露在内网上。用户可以通过浏览器访问 Jupyter Lab，同时也可以通过 Jupyter Lab 内置的伪终端与容器交互。Kubernetes 集群所使用的 Ingress Controller 是 [Ingress NGINX Controller](https://kubernetes.github.io/ingress-nginx/)。

## 症状

在 Jupyter Lab 的终端页面中，终端会间歇性地输出先前已经输出过的字符，有时候会包含一些乱码字符，形如：

```shell
2R0;276;0c10;rgb:0000/0000/000011;rgb:ffff/ffff/ffff12;2$y
```

## 原因

首先需要排查间接性输出先前的输出内容的原因。Jupyter Lab 是通过 Websocket 将伪终端的内容发送给 Jupyter Server 的，且输出字符的时间点与 Websocket 的链接断开并重新建立的时间点一致，因此推断出这个问题与 Websocket 的重连有关。

### Nginx Ingress Controller

我们使用 Ingress NGINX Controller 作为 Kubernetes 集群的 Ingress Controller，其[文档](https://kubernetes.github.io/ingress-nginx/user-guide/miscellaneous/#websockets)中推荐在使用 Websocket 的时候将 `proxy-read-timeout` 与 `proxy-send-timeout` 由默认的 60 秒设置为至少 3600 秒（即一小时），以避免 Websocket 断开链接，但是并没有起作用。

随后，我们发现这个现象与 NGINX 的 reload 机制有关。在用户创建或者删除开发环境的时候，服务端会随之动态地增加或删除对应的 Ingress 资源，这个动作会导致 NGINX reload，导致所有的 Websocket 链接都会被断开。这也解释了为什么这个问题是间歇性的，因为用户创建或者删除开发环境的频率不是恒定的，此外，我们确实也发现在深夜此现象并不会出现，进一步证实了这个推断。

### Websocket Read Buffer

在前一部分中我们提到，Jupyter Lab 通过 Websocket 使得伪终端与服务端进行通信，而在 NGINX reload 过后，Websocket 的链接会在一定时间后断开并建立新的 Websocket 链接。

Jupyter Lab 中与 Websocket 相关的库主要是以下两个：

- [jupyter-server/jupyter_server_terminals](https://github.com/jupyter-server/jupyter_server_terminals) - A Jupyter Server Extension Providing Support for Terminals
- [jupyter/terminado](https://github.com/jupyter/terminado) - Terminals served by tornado websockets

在 terminado v0.12.2 中，开发者引入了一个新的特性，即在 Websocket 重新链接的时候，会从服务端的 Buffer 中读取先前的输出并返回给客户端，导致了间歇性输出字符这个问题的出现。

在 `terminado/websocket.py` 中：

```python {linenos=false,hl_lines=[65,67,69,71],linenostart=47}
def open(self, url_component=None):
    """Websocket connection opened.

    Call our terminal manager to get a terminal, and connect to it as a
    client.
    """
    # Jupyter has a mixin to ping websockets and keep connections through
    # proxies alive. Call super() to allow that to set up:
    super(TermSocket, self).open(url_component)

    self._logger.info("TermSocket.open: %s", url_component)

    url_component = _cast_unicode(url_component)
    self.term_name = url_component or 'tty'
    self.terminal = self.term_manager.get_terminal(url_component)
    self.terminal.clients.append(self)
    self.send_json_message(["setup", {}])
    self._logger.info("TermSocket.open: Opened %s", self.term_name)
    # Now drain the preopen buffer, if reconnect.
    buffered = ""
    preopen_buffer = self.terminal.read_buffer.copy()
    while True:
        if not preopen_buffer:
            break
        s = preopen_buffer.popleft()
        buffered += s
    if buffered:
        self.on_pty_read(buffered)
```

### 转义字符

```shell
2R0;276;0c10;rgb:0000/0000/000011;rgb:ffff/ffff/ffff12;2$y
```

最终，我们需要知道这些控制字符具体代表的含义以及为何会出现在数据流中。我们发现这些字符是在执行 Vim 相关操作的时候才会产生的。

通过 Websocket 传输的数据流可以发现，实际上这是五段 ANSI 转义序列（ANSI escape sequence）的组合。

> ANSI 转义序列是一种带内信号（in-band signaling）的转义序列标准，用于控制视频文本终端上的光标位置、颜色和其他选项。在文本中嵌入确定的字节序列，大部分以 ESC 转义字符和 "[" 字符开始，终端会把这些字节序列解释为相应的指令，而不是普通的字符编码。

```text
STDOUT ...
STDIN \u001b[2;2R
STDIN \u001b[>0;276;0c
STDIN \u001b]10;rgb:0000/0000/0000\u001b\\
STDIN \u001b]11;rgb:ffff/ffff/ffff\u001b\\
STDOUT ...
STDIN \u001b[?12;2$y
```

`\u001b` 是 `ESC` 的 Unicode 编码，`\u001b[` 代表控制序列导入器（Control Sequence Introducer，**CSI**），`\u001b]` 代表操作系统命令（Operating System Command，**OSC**），`\u001b\` 代表字符串终止（String Terminator，**ST**）。

```text

```text
CSI P s n

Device Status Report (DSR)

P s = 5 → Status Report CSI 0 n (‘‘OK’’)
P s = 6 → Report Cursor Position (CPR) [row;column] as
CSI r ; c R
```

`\u001b[2;2R` 即 `CSI 2 ; 2 R`，表示光标的位置是第 2 行第 2 列，该序列是状态控制报告（Device Status Report，DSR）。

---

```text
CSI > P s c

Send Device Attributes (Secondary DA)

P s = 0 or omitted → request the terminal’s identification code. The response depends on the decTerminalID resource setting. It should apply only to VT220 and up, but xterm extends this to VT100.
→ CSI > P p ; P v ; P c c
where P p denotes the terminal type
→ 0 (‘‘VT100’’)
→ 1 (‘‘VT220’’)
and P v is the firmware version (for xterm, this is the XFree86 patch number, starting with 95). In a DEC terminal, P c indicates the ROM cartridge registration number and is always zero.
```

`\u001b[>0;276;0c` 即 `CSI > 0 ; 276 ; 0 c`，表示该终端类型是 `VT100`，固件的版本是 `276`，ROM 芯片的注册号是 `0`，该序列是 DA2 报告。

---

```text
OSC P s ; P t ST

P s = 1 0 → Change VT100 text foreground color to P t
P s = 1 1 → Change VT100 text background color to P t
```

`\u001b]10;rgb:0000/0000/0000\u001b\\` 即 `OSC 10 ; rgb : 0000 / 0000 / 0000 ST`，表示将前景色设置为黑色。
`\u001b]11;rgb:ffff/ffff/ffff\u001b\\` 即 `OSC 11 ; rgb : ffff / ffff / ffff ST`，表示将背景色设置为白色。

```text
CSI ? P m h

DEC Private Mode Set (DECSET)

P s = 1 2 → Start Blinking Cursor (att610)

CSI Ps $ p
          Request ANSI mode (DECRQM).  For VT300 and up, reply DECRPM is
            CSI Ps; Pm $ y
          where Ps is the mode number as in SM/RM, and Pm is the mode
          value:
            0 - not recognized
            1 - set
            **2 - reset**
            3 - permanently set
            4 - permanently reset

CSI ? Ps $ p
          Request DEC private mode (DECRQM).  For VT300 and up, reply
          DECRPM is
            CSI ? Ps; Pm $ y
          where Ps is the mode number as in DECSET/DECSET, Pm is the
          mode value as in the ANSI DECRQM.
          Two private modes are read-only (i.e., 1 3  and 1 4 ),
          provided only for reporting their values using this control
          sequence.  They correspond to the resources cursorBlink and
          cursorBlinkXOR.
```

`\u001b[?12;2$y` 即 `CSI ? 12 ; 2 $ y`，表示将光标闪烁模式开启。

因此实际上这些字符都是在与伪终端中的 Vim 交互的时候产生的转义序列，而这些转义序列通过 Websocket 被错误地发送给了 Jupyter Server。

### 小结

综上，我们可以发现这个问题是由于三个现象的叠加导致的：

1. 在新增或删除 Ingress 资源的时候，NGINX reload 会被触发，导致所有的 Websocket 链接都会被断开。
2. 在 jupyter/terminado 0.12.2 之后，服务端会读取重连之前的 Read Buffer 数据并返回给客户端。[[CHANGELOG]](https://github.com/jupyter/terminado/compare/0.12.1...v0.12.2)
3. Vim 相关操作的转义序列被错误地发送给了 Jupyter Server。

## 解决方案

针对前述第一个问题，我们可以通过在 Nginx 当中配置 `worker-shutdown-timeout`（默认为 240 秒）来延长 NGINX worker gracefully shutdown 的时间，从而避免 Websocket 的链接被频繁断开。然而采用这种方式会导致原先应该被回收的 Worker 一直被保留，最终可能导致 NGINX OOM，因此是否需要通过该配置来解决这个问题还需要进一步的评估。

针对前述第二与第三个问题，我们可以将 `terminado` 降级至 0.12.1 版本，在该版本下 Jupyter Lab 的 Terminal 在重新链接 Websocket 的时候不会读取 Buffer，虽然并没有从根本上解决，但可以间接规避掉这个问题。

然而，在 macOS 环境下实际上我并没有办法复现这个问题，即在 Jupyter Lab 的 Termninal 中使用 Vim 的时候，Websocket 不会将 Vim 转义序列作为输入发送给 Jupyter Server，也因此在重放的时候不会出现这个问题。此现象可能要在特定的环境下才会出现，而这点还需要进一步的排查。

## 参考

- [Xterm Control Sequences](https://www.xfree86.org/current/ctlseqs.html)
- [ctlseqs(ms)](https://invisible-island.net/xterm/ctlseqs/ctlseqs.html)


相关 Issue：

- [kubernetes/ingress-nginx#6731 - Frequent backend reloads causing disruption](https://github.com/kubernetes/ingress-nginx/issues/6731)
- [sagemathinc/cocalc#1269 - terminal -- control code corruption](https://github.com/sagemathinc/cocalc/issues/1269)
- [sagemathinc/cocalc#3277 - xterm.js terminal -- control code corruption](https://github.com/sagemathinc/cocalc/issues/3277)
- [coder/code-server#3657 - restored terminal from browser reload may append 2R0;276;0c some times](https://github.com/coder/code-server/issues/3657)
- [xtermjs/xterm.js#3307 - Control Sequences emitted when opening vim](https://github.com/xtermjs/xterm.js/issues/3307)
- [xtermjs/xterm.js#4127 - Destructive console output after exiting vim editor](https://github.com/xtermjs/xterm.js/issues/4127)
