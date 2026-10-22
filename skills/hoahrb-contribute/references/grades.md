# 成绩构成更新

目标文件：[`hoa-major-data/grades_summary.json`](https://github.com/HOAHRB/hoa-major-data/blob/main/grades_summary.json)。页面课程信息栏的成绩构成由此文件生成。课程正文中带 `source = "grades_summary"` 的成绩徽章由课程仓库的 `readme.toml` 生成，两处目前分别读取数据。

## 流程

1. Fork `HOAHRB/hoa-major-data` 并 clone
2. 先通过 `lookup_table.toml` 解析仓库 ID，再在 `grades_summary.json` 中搜索该仓库 ID 找到对应条目
3. 按现有条目的 JSON 结构**新增**一个键，键名格式为 `入学年份_标识`：
   - 各专业相同：`"2024_default"`
   - 不同专业成绩构成不同：`"2021_自动化"`
   - `"default"` 键仅因历史原因存在，不要新写
4. 校验 JSON 语法（如 `python3 -m json.tool grades_summary.json > /dev/null`）
5. 按用户要求交付修改（回到 SKILL.md 第 7 步）
