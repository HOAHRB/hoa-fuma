# 受限网络下访问 GitHub

国内网络直连 GitHub 常见失败：网页打不开、clone/push 超时、`Failed to connect to github.com port 443`、`SSL_ERROR_SYSCALL`。按成本从低到高尝试：

## 1. HOA 文件代理（只下载文件时）

[https://gh.hoa.moe/](https://gh.hoa.moe/) 可加速下载 HOA 组织内的文件。

## 2. 修改 hosts 文件

将 GitHub 域名直接映射到可达 IP，绕过 DNS 污染。

1. 获取 IP：
   - 现成列表（每天多次更新，推荐）：Gitee 仓库 [若风/github-hosts](https://gitee.com/if-the-wind/github-hosts) 的 README
   - 手动查询：在 [ipaddress.com/ip-lookup](https://www.ipaddress.com/ip-lookup) 依次查 `github.com`、`api.github.com`、`github.global.ssl.fastly.net`、`codeload.github.com`
2. 以管理员权限编辑 hosts 文件并在末尾追加映射：
   - Windows：`C:\Windows\System32\drivers\etc\hosts`（管理员终端 `notepad` 打开）
   - macOS/Linux：`sudo nano /etc/hosts`

   ```text
   # GitHub
   140.82.113.3 github.com
   140.82.113.5 api.github.com
   146.75.77.194 github.global.ssl.fastly.net
   140.82.114.9 codeload.github.com
   ```

3. `ping github.com` 验证连通

IP 会变动，再次连不上时重新查询更新。

## 3. 其他

- [Watt Toolkit](https://steampp.net/)（原 Steam++）：开箱即用的开源加速工具，支持 Windows/macOS/Linux/Android
- GitHub Codespaces：在云端编辑，完全绕开本地网络问题（浏览器能打开 GitHub 即可用）
