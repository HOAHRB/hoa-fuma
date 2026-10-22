# 博客撰写

目标仓库：[`HOAHRB/hoa-blog`](https://github.com/HOAHRB/hoa-blog)，博客位于 `blog/` 目录。仓库不大，本地编辑即可。

## 文件树

单篇博客的最小结构：

```
blog/
└── <博客名标识符>/        # 小写英文加连字符
    └── index.zh-cn.md    # 正文
```

多文章专栏：博客文件夹下每篇文章一个子文件夹（各含 `index.zh-cn.md`），外加一个 `_index.zh-cn.md` 索引文件——只承载元信息，写正文也不会显示。子文件夹可继续嵌套成子专栏。图片、PDF 等附件与正文放在同一文件夹。

## 元信息（frontmatter）

`index.zh-cn.md`：

```markdown
---
title: 标题
date: 2026-07-25
description: 显示在索引页面的文章简介
authors:
  - name: 作者名
    link: https://github.com/用户名
    image: https://github.com/用户名.png
excludeSearch: false
# 以下仅多文章专栏使用
weight: 1 # 索引页排序，1 最前
next: false # 或指向另一篇的路径
prev: false
---

正文
```

`_index.zh-cn.md` 只需 `title`、`date`、`description`。

正文内容切题即可，无格式限制。支持多作者。完成后回到 SKILL.md 第 6 步公约检查。
