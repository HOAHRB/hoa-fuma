此仓库为HOA前端v3版本的主仓库。

运行时输入：

- `github::repos-management/repos_list.txt` -> `repos_list.txt`
- `github::hoa-major-data/major_mapping.json` -> `hoa-major-data/major_mapping.json`
- github token -> env::（非必须，实际上似乎也未使用）

---

## 运行时输入文件 schema

### `repos_list.txt`

每行一个仓库名，用于过滤可展示的 GitHub 仓库列表。参见 [lib/github.ts](lib/github.ts)。

**使用场景：**

- `getRecentRepos(count)` → [app/(home)/page.tsx](<app/(home)/page.tsx>)：首页"最近仓库"列表，取每个仓库最新非 ci commit 展示
- `getLatestCommit(repoName)` → [app/docs/[year]/[...slug]/page.tsx](app/docs/[year]/[[...slug]]/page.tsx)：课程文档页顶部"最新 commit"信息

### `major_mapping.json`

ID → 名称翻译表，按年份组织，用于文档导航中专业/大类 slug 的名称解析。

```json
{
  "<年份>": {
    "<专业大类ID>": {
      "name": "专业大类名称",
      "plan_ID": "培养方案ID（代码中未使用）",
      "school_name": "所属学院",
      "majors": [
        {
          "name": "具体专业名称",
          "major_ID": "子专业ID",
          "plan_ID": "培养方案ID（代码中未使用）"
        }
      ]
    }
  }
}
```

**字段作用：**

- `name`：大类展示名称，fallback 兜底名称（[docs-utils.ts:36-37](lib/docs-utils.ts#L36-L37)）
- `school_name` / `plan_ID`：代码中未使用，仅作数据属性
- `majors`：`major_ID` → 具体专业名称 的快速查找表（[docs-utils.ts:30-33](lib/docs-utils.ts#L30-L33)）

**lookup 逻辑（[docs-utils.ts:24-44](lib/docs-utils.ts#L24-L44)）：**

1. 先建立 `大类ID → 大类名称` 的映射（如 `"0801" → "数学类"`）
2. 再用 `majors` 中的 `major_ID → 具体专业名称` 覆盖（如 `"080101" → "数据科学与大数据技术"`）
3. 最终找不到的 ID 会 fallback 为原始 ID 字符串
