---
name: hoahrb-contribute
description: |
  Contribute to HOAHRB — the HIT Harbin course-sharing and training-plan project. Use when the user wants to upload course materials, edit a course page, update grade composition, add a new course or course-code mapping, or write a blog post for HOAHRB.
---

# 向 HOAHRB 贡献内容

HOAHRB 面向哈尔滨工业大学本部，课程资料托管在 [HOAHRB-Courses](https://github.com/HOAHRB-Courses)，数据与网站仓库托管在 [HOAHRB](https://github.com/HOAHRB)：

| 仓库                        | 内容                                                                                            |
| --------------------------- | ----------------------------------------------------------------------------------------------- |
| `HOAHRB-Courses/<课程仓库>` | 每门课一个仓库：`README.md` 课程文档 + `assignments/` `exams/` `notes/` `slides/` 资料文件夹    |
| `HOAHRB/hoa-major-data`     | 结构化数据：`grades_summary.json` 成绩构成、`lookup_table.toml` 课程代码映射、`plans/` 培养方案 |
| `HOAHRB/hoa-blog`           | 博客，位于 `blog/` 目录下                                                                       |

课程页面右侧的 GitHub 图标直接指向对应课程仓库。

## 步骤

1. **确定贡献类型**，读取对应参考文件：
   - 上传试卷、笔记、作业等资料 → [references/upload-materials.md](references/upload-materials.md)
   - 修改课程文档（评价、教师、攻略）→ [references/course-docs.md](references/course-docs.md)
   - 更新成绩构成 → [references/grades.md](references/grades.md)
   - 添加课程 / 课程代码映射 → [references/course-mapping.md](references/course-mapping.md)
   - 写博客 → [references/blog.md](references/blog.md)

2. **确认环境**：`git --version`；`gh auth status`（无 `gh` 则确认用户已登录 GitHub 网页端）。若 `git push`/`clone` 报 `Failed to connect to github.com port 443` 或 `SSL_ERROR_SYSCALL`，说明网络受限 → [references/network.md](references/network.md)。

3. **找到课程仓库**：先按 `hoa-major-data/lookup_table.toml` 解析课程代码。优先使用当前培养方案号的映射，再使用 `DEFAULT`（兼容 `default`），没有映射时使用原课程代码作为仓库 ID。在 `HOAHRB-Courses` 中查找对应仓库，不要默认课程代码就是仓库名。

4. **Fork 目标仓库到用户名下**：课程资料与正文使用 `HOAHRB-Courses/<repo>`，培养方案、课程代码映射及课程信息栏成绩构成使用 `HOAHRB/hoa-major-data`，博客使用 `HOAHRB/hoa-blog`。可运行 `gh repo fork <组织>/<repo> --clone`，或引导用户在网页上 Fork 后 clone 自己的 Fork。

5. **按参考文件完成修改**。完成标准：修改符合参考文件中的格式要求，且通过下方公约检查的每一条。

6. **公约检查**（每一条都要核对）：
   - 未删除或改动他人已有的评价、建议
   - 新增的评价/意见在**所修改部分的最末尾**按格式署名（可用网名）并标注时间：
     ```markdown
     > 文 / [名字](https://github.com/用户名), 2026.7
     ```
   - 不含盗版电子书、盗版软件、未经老师同意的课件；不含与成绩考核直接相关的作业答案与实验代码（难题思路、大实验代码思路可以）
   - 中文与英文、数字之间留空格，标点使用全角

7. **按用户要求交付修改**：
   - commit message 与 PR 标题**用中文**，写明具体内容：「增加 xx 教师的信息及评价」「更新课程大纲」，而非「修改一些内容」
   - 用户明确要求创建 PR 时，再创建 PR；检查目标仓库及所属组织是否提供 PR 模板，有则按模板填写。
   - 创建 PR 后，把链接给到用户，并提醒用户留意 GitHub 和邮箱通知。

完成标准：已完成用户要求的修改并说明验证结果；用户明确要求创建 PR 时，PR 已创建并给出链接。
