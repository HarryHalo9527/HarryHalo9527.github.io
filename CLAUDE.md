# 杨转福个人主页 — 项目上下文

## 项目简介
这是杨转福的个人网站，基于"AI时代的个人网站"理念构建（"不是展示自己，而是部署自己"）。
部署地址：https://HarryHalo9527.github.io

## 目录结构
- `index.html` + `styles/` + `scripts/` + `data/` — GitHub Pages 主站（v2.0 内容的副本）
- `个人主页v2.0/` — v2.0 源文件夹（与根目录内容保持同步）
- `个人主页_v1.0/` — 旧版网站归档
- `cloudflare-worker/` — Gemini API 代理 Worker 代码

## 部署方式
- 前端：GitHub Pages，push 到 `main` 分支自动生效（1-2分钟）
- AI 代理：Cloudflare Worker，地址 `https://yangzhuanfu-ai-proxy.jiangqi143.workers.dev/`
- Cloudflare 账号：https://dash.cloudflare.com/be19b9ec50f1b4614235de7c399931ea/home

## 重要规则：同步修改
**每次修改前端文件，必须同时改两个地方：**
1. 根目录（`/index.html`, `/scripts/`, `/styles/`, `/data/`）— 这是 GitHub Pages 实际读取的
2. `个人主页v2.0/` 下对应的文件 — 这是源文件夹

改完后 commit + push 到 `main` 分支。

## 核心人物信息
- 姓名：杨转福（Zhuanfu Yang）
- 定位：企业与个人转型推动者，AI大模型解决方案架构师
- 使命：赋能企业和个人转型升级
- 价值观：终身学习、拥抱变化、成人达己、永远好奇
- 公众号：转见未来
- 电话：13368464272

## 核心方法论
- **FIRE 模型**：企业 AI 场景评估（Frequency × Intelligence × Readiness × Effect），满分20分
- **TURN 模型**：个人 AI 转型就绪度评估（Think × Use × Ready × Next），满分20分，杨转福原创
- **路径论**：先治理 → 再中台 → 后智能
- **价值三角**：行业方法 × 数据资产 × AI 能力

## 技术栈
- 纯前端：HTML + CSS + Vanilla JS，无框架无构建工具
- AI 接入：Cloudflare Worker 代理 → Gemini API（gemini-2.0-flash）
- LLM API 封装：`scripts/llm-api.js`，Worker URL 已配置，无需用户手动配置
- 图表：原生 SVG 雷达图（`scripts/radar-chart.js`）

## 踩过的坑
- 根目录和 `个人主页v2.0/` 是两份文件，改一处必须改另一处，否则本地和线上不同步
- `个人主页v2.0/` 原来叫 `v2.0/`，已重命名
- 两个分支（`main` 和 `codex/publish-pages`）历史不相关，merge 时需要 `--allow-unrelated-histories`
- Gemini API 格式与 OpenAI 不同，Worker 负责转换（systemInstruction 字段处理）

## Git 分支
- `main` — 生产分支，对应 GitHub Pages
- `codex/publish-pages` — 开发分支（历史遗留，可在 main 上直接开发）
