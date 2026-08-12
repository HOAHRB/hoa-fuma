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

## Contributing

Contributions are welcome. Please read the [contributing guide](/.github/contributing.md) before submitting a pull request.

## License

- Documentation: [CC BY-NC-SA 4.0 License](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.en).

- Code: [MIT License](LICENSE).

## Credits

- All the core members and contributors to [HOA](https://github.com/HITSZ-OpenAuto).
- [Petrica](https://github.com/PetricaT) designed the wonderful [logo](./public/HITSZOpenAuto-Shadow.png).
- [Fumadocs](https://github.com/fuma-nama/fumadocs).
