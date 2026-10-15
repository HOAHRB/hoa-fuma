# hoa-fuma

The framework for building courses-sharing platform, built by [HOA](https://github.com/HITSZ-OpenAuto).

<div align="center">
  <img src="./public/HITSZOpenAuto-Shadow.png" width="400" alt="logo" />
</div>

## Getting Started

```bash
make prepare # minimal frontend setup
make content # fetch full HOA content
make dev # start dev
```

## Branch workflow

- Commit general changes to `main`.
- Commit static-only changes to `static-main`.
- After `origin/main` changes, rebase `static-main` onto the latest `origin/main`.
- If the target branch is unclear, ask the user where to commit. When rewriting remote history, use only `--force-with-lease`; never use `--force`.

> [!IMPORTANT]
> 当前站点仅发布普通本科培养方案。辅修、第二学士学位、Y 类、微专业和未分类数据
> 仍完整保存在 `hoa-major-data` 中，但 `scripts/fetch-content.sh` 只会保留
> `本_*.toml`。如需恢复其他类别，请调整该白名单并重新运行 `make content`。

Course repository membership is discovered from `HOAHRB-Courses` at runtime.
`hoa-backend --fetch` obtains the same organization membership before generating pages.

## 缓存：与上游的差异

相对上游 [#161](https://github.com/HITSZ-OpenAuto/hoa-fuma/pull/161)：

- 上游依赖部署后清理域名 CDN 缓存；本项目通过 Worker 代理，公开页面和 RSS 使用 `revalidate = 3600`、`expireTime: 3600`，一小时后过期，不依赖该清理步骤。
- 保留上游删除的 `/docs/<学期>/<课程代码>` 旧链接，跳转保留 `/hoahrb` 前缀和 Cookie 选路。
- 搜索的空查询、无效语言分支也返回 `no-store`，补齐上游遗漏。

首次应用需重新部署代理 Worker，并保持 `cross_version_cache` 关闭，使旧的一年期缓存失效；代理须保留 `Cache-Control` 和 `Vary`。

署名：Codex（2026-10-15）。

## Contributing

Contributions are welcome. Please read the [contributing guide](/.github/contributing.md) before submitting a pull request.

## License

- Documentation: [CC BY-NC-SA 4.0 License](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.en).

- Code: [MIT License](LICENSE).

## Credits

- All the core members and contributors to [HOA](https://github.com/HITSZ-OpenAuto).
- [Petrica](https://github.com/PetricaT) designed the wonderful [logo](./public/HITSZOpenAuto-Shadow.png).
- [Fumadocs](https://github.com/fuma-nama/fumadocs).
