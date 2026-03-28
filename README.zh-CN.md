# kōdo (コード)

**AI 编程 Agent 的通用持久记忆层。**

[![Claude Code](https://img.shields.io/badge/Claude_Code-兼容-orange)](https://docs.anthropic.com/en/docs/claude-code)
[![Cursor](https://img.shields.io/badge/Cursor-兼容-blue)](https://cursor.sh)
[![Kiro](https://img.shields.io/badge/Kiro-兼容-green)](https://kiro.dev)
[![Codex CLI](https://img.shields.io/badge/Codex_CLI-兼容-purple)](https://github.com/openai/codex)
[![MCP](https://img.shields.io/badge/MCP-server-red)](https://modelcontextprotocol.io)
[![MIT License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**[🇺🇸 English](README.md)** | **🇨🇳 中文**

> 你的 AI 编程 Agent 每次开新会话都失忆。你告诉它"用 ESM import"——下次它又写 `require()`。你修了一个空指针 bug——下次同样的 bug 又来了。**kōdo 解决这个问题。**

一个 Agent 无关的记忆层，存储结构化记忆——规范、错误、决策、偏好、模式——在本地 SQLite 数据库中，并让你使用的**每一个** Agent 都能访问。一份记忆，所有 Agent，零云端。

```
kodo add -t convention -c "始终使用 ESM imports，禁止 require()"
kodo add -t mistake    -c "库代码中禁止 process.exit()，应该 throw"
kodo learn             # 从 git 历史自动学习
kodo export            # 同步到 .claude/ .cursor/ .kiro/ .codex/
```

## 问题：AI 的失忆症

| 发生了什么 | 感受 |
|-----------|------|
| 你纠正了 Agent 的代码风格 | 下次会话就忘了 |
| 你解释了架构决策 | 每次都要重新解释 |
| Agent 犯了你见过的错误 | 土拨鼠之日 |
| 你从 Cursor 切换到 Claude Code | 从零开始 |
| 新同事用 Agent 上手项目 | 零团队知识 |

## 安装

```bash
npm install -g kodo-memory
```

## 快速开始

```bash
cd your-project
kodo init                                                    # 初始化
kodo add -t convention -c "使用 Conventional Commits"          # 添加记忆
kodo add -t mistake -c "访问 .data 前必须检查 null"             # 记住错误
kodo learn                                                    # 从 git 自动学习
kodo search "style"                                           # 搜索记忆
kodo export                                                   # 导出到所有 Agent
```

## 记忆类型

| 类型 | 用途 | 示例 |
|------|------|------|
| `convention` | 团队/项目规范 | "使用 Conventional Commits" |
| `mistake` | 不要重犯的 bug | "finally 块中必须关闭 DB 连接" |
| `decision` | 架构决策 | "选择 SQLite 而非 Postgres" |
| `preference` | 编码风格 | "优先 early return，避免嵌套 if/else" |
| `pattern` | 可复用方案 | "API handler: 校验 → 执行 → 响应" |
| `note` | 通用上下文 | "支付模块 Q2 正在重写" |

## MCP 服务器

kōdo 内置 MCP 服务器，AI Agent 可以在会话中**实时**读写记忆。

| 工具 | 描述 |
|------|------|
| `kodo_remember` | 存储新记忆 |
| `kodo_recall` | 按关键词/类型搜索记忆 |
| `kodo_forget` | 按 ID 删除记忆 |
| `kodo_stats` | 查看记忆统计 |

## Agent 导出

`kodo export` 生成每个 Agent 的**原生配置文件**：

| Agent | 输出路径 |
|-------|---------|
| Claude Code | `.claude/settings/memory.md` |
| Cursor | `.cursor/rules/kodo-memory.md` |
| Kiro | `.kiro/steering/kodo-memory.md` |
| Codex | `.codex/memory.md` |

## 搭配使用

| 工具 | 搭配方式 |
|------|---------|
| [PUA Skill](https://github.com/tanweai/pua) | PUA 逼 Agent 不放弃；kōdo 让它记住学到的东西 |
| [claude-mem](https://github.com/thedotmack/claude-mem) | claude-mem 捕获会话；kōdo 结构化并导出知识 |

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=Xuan-1998/kodo&type=Date)](https://star-history.com/#Xuan-1998/kodo&Date)

## License

MIT
