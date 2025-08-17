### 贡献指南

感谢对 hikarinagi 私有后端(此仓库)的关注与贡献，请在提交 PR 前阅读本指南，以便更高效地协作与评审。

### 目标与范围

- **目标**: 保持代码质量一致、确保功能稳定、降低回归风险。
- **范围**: 文档、重构、功能开发、性能优化、修复缺陷、安全修复等。

### 本地开发准备

- **Node 版本**: 推荐 Node.js 20+（LTS）。
- **包管理器**: 本项目使用 `pnpm`。
- **安装依赖**:

```bash
pnpm install
```

- **运行与调试**:

```bash
# 运行开发服务器
pnpm dev

# 生产构建和运行
pnpm build && pnpm start:prod
```

- **测试**:

```bash
# 单元测试
pnpm test

# e2e 测试
pnpm test:e2e

# 覆盖率
pnpm test:cov
```

### 必需与常用环境变量

本项目在启动时会通过 `EnvironmentValidator` 校验环境变量。至少需要：

- **必需**: `MONGO_URI`、`REDIS_HOST`、`REDIS_PORT`
- **常用**: `JWT_SECRET`、`JWT_REFRESH_SECRET`、`HIKARI_ACCESS_TOKEN_EXPIRES_IN`、`HIKARI_REFRESH_TOKEN_EXPIRES_IN`、`ALLOW_REGISTER`、邮件与对象存储相关配置等

请在本地创建 `.env`，切勿提交真实密钥；如引入新的环境变量，请：

- 在 `src/common/config/validators/env.validator.ts` 中补充校验项与默认值（若合适）
- 在 PR 说明中列出新增/变更的变量及用途

### 分支与工作流

- **主分支**: `main`（受保护，请通过 PR 合并）
- **特性分支**: `feature/<简述>`（示例：`feature/lightnovel-search`）
- **修复分支**: `fix/<问题简述>`（示例：`fix/jwt-refresh-expiry`）
- **从最新的 `main` 创建分支`**，保持变更聚焦、PR 体量适中（建议 < 300 行有效变更）。

### 提交信息（建议使用 Conventional Commits）

推荐但不强制使用 Conventional Commits，便于生成变更日志与回溯：

- `feat: 支持轻小说卷的批量更新`
- `fix(auth): 修复刷新令牌过期时间配置`
- `refactor(entities): 简化 producer service 依赖注入`
- `docs: 完善 README 的运行指引`
- `test(comment): 为 comment.service 添加边界用例`

若存在破坏性变更，请在提交体或 PR 说明中标注 `BREAKING CHANGE:` 并解释迁移方式。

### 代码风格与质量

- **格式化**: 使用 Prettier（单引号、无分号、100 列、尾随逗号等）。
- **Lint**: 使用 ESLint（TypeScript 规则为主）。

```bash
# 仅检查
pnpm format:check && pnpm lint:check

# 自动修复
pnpm format && pnpm lint
```

- **类型与可读性**:
  - 为导出的函数/类写明类型
  - 使用有意义的命名，避免缩写
  - 早返回、避免深层嵌套，妥善处理异常与边界

### 模块与目录规范（NestJS）

- `nest-cli.json` 已将默认生成目录指向 `src/modules`。
- 新功能应以模块化为单位落地（controller/service/dto/schema 等与现有风格一致）。
- 引入外部依赖时，请说明必要性与影响面，并尽量保持最小化。

### PR 提交流程

在创建 PR 前，请完成以下检查：

- **构建通过**: `pnpm build` 无错误。
- **格式/Lint 通过**: `pnpm format:check && pnpm lint:check` 通过。
- **测试通过**: 单元与 e2e 测试通过，新增/变更逻辑应附带相应测试。
- **环境变量**: 新增变量已在校验器中声明，并在 PR 描述中说明用途与默认值。
- **API 变更**: 若影响对外接口，请更新 Swagger 装饰器与相关文档/示例。
- **安全检查**: 不提交任何密钥/敏感数据；对鉴权、限流、签名等逻辑变更需特别说明。
- **数据模型**: 修改 `schemas` 时说明兼容性与迁移影响（若有），避免破坏历史数据。

### PR 内容建议

- **标题**: 简洁准确，包含模块域（如 `feat(novel): ...`）。
- **描述**: 背景、动机、解决方案、影响范围、风控点、验证方法、截图/日志（若适用）。
- **关联**: 关联 Issue/讨论并附上链接。

### 代码评审与合并

- 评审以可读性、正确性、安全性、性能与一致性为准。
- 变更较大时建议拆分为多组小 PR，降低评审成本。
- PR 获得至少一名维护者批准后合并（Squash 或 Merge 方式由维护者根据历史选择）。

### 性能与安全注意事项

- 对高频路径（认证、列表查询、计数、WebSocket）需关注复杂度与 I/O 次数。
- 涉及外部存储（Redis、R2、MongoDB）需考虑重试、超时与降级策略。
- 涉及鉴权、签名、速率限制等逻辑变更请在 PR 中明确说明风险点与验证方法。

### 问题反馈与安全报告

- 功能或体验问题请开 Issue 并附最小复现。
- 如发现潜在安全漏洞，请勿公开披露，可以通过站内私信告知管理员(userId: 2)。

—— 再次感谢你的贡献！
