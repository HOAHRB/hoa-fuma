# HOAHRB 域名与子路径迁移维护说明

本文记录上游 bc9e2adc（canonical 与可索引页面）和 7d8f67af（课程、文章分享元数据）的本地适配及后续域名迁移操作。它是维护文档，不是实施计划。

## 当前地址与配置来源

当前公开地址为 https://test.hitchhike.work/hoahrb/。

| 文件                | 作用                                                                                                      | 迁移时的处理                                                         |
| ------------------- | --------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| next.config.mjs     | siteUrl 是当前构建的地址来源；pathname 推导 basePath，并导出 NEXT_PUBLIC_SITE_URL / NEXT_PUBLIC_BASE_PATH | 将 siteUrl 改为完整新地址，保留末尾 /，重新构建                      |
| lib/base-path.ts    | 导出 siteUrl，withBasePath 给静态资源和搜索 API 添加部署子路径                                            | 通常无需修改；确认构建得到正确变量                                   |
| app/layout.tsx      | metadataBase、首页 canonical、RSS discovery、站点分享图片及 favicon                                       | 自动随 siteUrl 更新；检查输出 HTML                                   |
| app/sitemap.ts      | 通过 siteUrl 拼接可索引内容的完整地址                                                                     | 自动更新；必须保留去掉路径开头 / 的逻辑，以免 URL 解析丢失部署子路径 |
| public/robots.txt   | 爬虫规则、Content-Signal、绝对 Sitemap 地址                                                               | 手动更新最后的 Sitemap 行；该文件不会自动读取 siteUrl                |
| lib/rss.ts          | RSS feed、文章、图片及 favicon 的绝对地址                                                                 | 自动随 siteUrl 更新；检查两份 feed                                   |
| app/sitemap.test.ts | 固定模拟当前 origin 与子路径，防止 sitemap 回归丢失子路径                                                 | 这组旧地址是测试夹具，不是生产配置；可保留，也可补充新部署形态的测试 |

next.config.mjs 当前把 URL 写在源码中。仅修改部署机器的 NEXT_PUBLIC_SITE_URL 或 NEXT_PUBLIC_BASE_PATH 不会可靠替换此配置；应修改配置后重新构建。basePath 是构建期设置，仅重启旧镜像不能完成子路径迁移。

新地址示例：

- https://example.org/：basePath 为空字符串，应用部署在根目录。
- https://example.org/hoahrb/：basePath 为 /hoahrb，应用继续部署在子路径。

example.org 仅为示例，不能直接用于生产发布。

## SEO 行为及保持不变的规则

bc9e2adc 为首页、博客、新闻、静态页面和课程页提供 canonical，并生成 sitemap；文档语言为 zh-CN。

课程按末段课程编码（转大写）去重：选择最新年份的非占位页面作为 canonical，同一年份有多份页面时选 URL 字典序靠前者。其余实际课程页仍可索引，但声明该 canonical；sitemap 只列去重后的 canonical。index.md/index.mdx 导航页、包含特定“暂未收录对应的 GitHub 仓库”文案的课程占位页不可索引。占位识别依赖原文字符串，后端若修改文案，应同步 lib/docs-seo.ts 并运行相关测试。

博客标签页、新闻 weekly / daily 路径声明 noindex、follow；sitemap 不包含它们。博客与新闻列表页、其他文章和静态内容页可以索引。noindex 是页面元数据，不应误改成 robots 全站禁抓。

7d8f67af 为课程标题加入课程编码，为文章加入 Open Graph / Twitter 信息；非系列汇总文章具有发布时间和作者。分享图片使用 /apple-icon.png，文章和静态页的描述作为元数据，不再额外显示在正文顶部。

本地适配保留相对应用路径（如 /docs/2025/...），由 metadataBase 解析为部署地址；sitemap 则以 siteUrl 加无开头斜杠的相对路径拼接。两者不可机械替换为同一套 URL 拼接写法。

## 迁移操作

1. 在 next.config.mjs 修改 siteUrl，在 public/robots.txt 同步 Sitemap 的完整新地址。根目录部署应为 https://新域名/sitemap.xml；子路径部署应包含对应前缀。
2. 配置新域名的 DNS、TLS、反向代理与实际应用路径。特别确认 /_next、图片优化、/api/search 和 RSS 请求使用正确子路径。
3. 使用正式培养方案与内容生成产物，重新安装锁定依赖并运行 make check、pnpm test、pnpm build；不要以样例内容构建替代完整内容验证。
4. 在新部署核对 canonical、og:url、og:image、twitter:image、RSS discovery、sitemap 和 robots；确认静态资源、首页选择器、侧边栏、搜索及课程短链接可以工作。
5. 在旧站点或旧反向代理配置永久重定向（301 或 308），保留路径与查询参数。若移除 /hoahrb 前缀，应明确映射到新地址的应用根目录，不要把旧前缀再次带过去。不要把所有旧课程页面一律重定向到首页。
6. 对需要管理搜索收录的部署，在搜索站长平台提交新 sitemap；旧域名继续保持有效重定向。回滚时同时恢复地址配置、robots、代理路径及对应构建镜像。

## 发布核对示例

对于目标站点根地址 NEW_SITE_URL（必须含末尾 /），检查：

- 首页及 /about、/links、/privacy 输出的 canonical 都使用新地址。
- 同一课程的旧年份页面 canonical 指向新域名下最新非占位页面。
- sitemap 中所有 loc 都使用新域名和预期子路径，不包含旧站点地址、标签页或 weekly/daily 新闻。
- robots 的 Sitemap 能直接访问；AI 训练爬虫与搜索爬虫规则保持预期。
- /blog/rss.xml 与 /news/rss.xml 的 feed、条目、图片地址正确。
- favicon、Logo、友链图标、分享图片、图片优化和搜索 API 均可访问；页面无重复 /hoahrb/hoahrb 前缀。
- 旧地址访问一个真实课程页，永久重定向后到达对应新页面，查询参数保留。

## 不应随本站域名一起替换的地址

hoa.moe、wiki.hoa.moe、contrib.hoa.moe、prev.hoa.moe，以及 GitHub 组织地址是上游项目或外部服务，不是本站 origin。关于上游页面有意链接它们；请勿全仓替换 hoa.moe 为新本站域名。

## 已知验证边界

2026-10-12 审阅时，当前主工作区仅有 8 个文档样例。已通过类型检查、27 个测试、生产构建与实际 HTTP canonical/sitemap/robots 验证；尚不能据此证明全部培养方案页面可构建，且浏览器交互未验证。未来正式迁移应使用完整内容重复上述检查。
