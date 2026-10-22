# 添加课程 / 课程代码映射

学校课程每年增删调整，改动较小的课程沿用原仓库，通过课程代码映射指向同一仓库。

目标文件：[`hoa-major-data/lookup_table.toml`](https://github.com/HOAHRB/hoa-major-data/blob/main/lookup_table.toml)。

## 映射表结构

```toml
[新课程代码]          # 表名：无引号
DEFAULT = "仓库 ID"   # 键：培养方案号或 DEFAULT；值：带引号
```

例：25 级 COMP1013「计算思维与实践」沿用 `COMP1011` 仓库：

```toml
[COMP1013]
DEFAULT = "COMP1011"
```

- 键用 `DEFAULT`，除非同一课程代码在不同专业指向不同课程——此时到 [`major_mapping.json`](https://github.com/HOAHRB/hoa-major-data/blob/main/major_mapping.json) 查对应年级专业的培养方案号作键
- 添加映射前与用户确认课程沿革（旧课程可在校内「本研教学管理与服务平台 - 选课业务 - 全校课表（本）」查询）；不确定时在 PR 描述中说明依据，交维护者判断

## 课程仓库不存在

课程在 [培养方案](https://github.com/HOAHRB/hoa-major-data/tree/main/plans) 中但没有对应仓库时，到 [hoa-major-data 提交 Issue](https://github.com/HOAHRB/hoa-major-data/issues)，说明课程代码、名称和对应培养方案，由维护者创建。
