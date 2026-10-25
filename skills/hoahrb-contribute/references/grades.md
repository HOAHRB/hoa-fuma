# 成绩构成更新

专业课程信息栏的成绩构成只读取对应培养方案 TOML 内、对应原始 `course_code` 的 `grade_details`。不要为此修改中央 `grades_summary.json`（也不要另建 `grade_summary.json`）；课程代码映射只复用正文和资料，不证明两门课的考核比例相同。

## 流程

1. 在 `HOAHRB/hoa-major-data` 的 `plans/` 中按入学年份、专业和 `[info].plan_ID` 找到培养方案。
2. 在该方案中按原始 `course_code` 找到 `[[courses]]`，不要按映射后的仓库 ID 查找。
3. 根据该方案适用的考核要求补充字段，例如：

   ```toml
   [[courses]]
   course_code = "22MA15005"
   course_name = "微积分C（1）"
   grade_details = [
     { name = "平时成绩", percent = "30%" },
     { name = "期末考试", percent = "70%" },
   ]
   ```

4. 在提交说明中标明适用年级、专业及依据。比例用整数百分比字符串；不要把共享资料仓库中的比例直接推广到所有映射课程。
5. 校验 TOML，并按用户要求交付修改（回到 SKILL.md 第 7 步）。同一课程在不同方案中的字段分别维护。

缺少 `grade_details` 或值为 `[]` 时显示暂无成绩构成，不从中央汇总回退。当前培养方案尚未普遍提供此字段，缺失不代表成绩全部来自期末考试。`jwts crawl` 更新方案时会按年份、专业代码和原始课号保留已有的手工 `grade_details`；课程删除或课号变化时不会自动迁移；若会丢失已有贡献，发布会报错，需先确认并迁移或归档。

课程正文中带 `source = "grades_summary"` 的成绩徽章由课程仓库的 `readme.toml` 生成，属于共享正文，与培养方案课程信息栏分别维护。没有培养方案身份的共享分类页仍沿用仓库级 `grades_summary.json`；不要借此为专业课程信息栏补值。
