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

> [!IMPORTANT]
> 当前站点仅发布普通本科培养方案。辅修和第二学士学位数据仍完整保存在
> `hoa-major-data` 中，但 `scripts/fetch-content.sh` 会在临时构建副本中排除它们。
> 如需恢复发布，请删除该脚本中的对应过滤命令并重新运行 `make content`。

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
