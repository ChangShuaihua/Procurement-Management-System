# 采购系统 Monorepo 结构

| 项 | 内容 |
| --- | --- |
| 版本 | 0.1 |
| 日期 | 2026-10-21 |
| 工具 | pnpm workspace |
| 范围 | 目录、包职责、依赖方向。本文不创建代码 |

产品行为以 `docs/采购管理系统产品说明.md` 为准。合同模板按类型单独存放，使用 HTML，支持变量替换、数组迭代和条件表达式。物料通过品类编号多对一属于品类。

## 1. 结构原则

仓库分成两类目录：

- `packages`：可复用模块。不知道页面和路由，不读取另一端的私有实现。
- `apps`：采购员用的前端，以及给前端提供接口的后端。业务用例放在这里组装。

依赖只允许从外向内：

1. 应用可以依赖包。包不能依赖应用。
2. 包与包之间只能沿本文第 3 节的边依赖。禁止反向和环形依赖。
3. 浏览器端不连接 Supabase，不生成 PDF，不保存服务端密钥。
4. 同一条业务规则只写在 `domain`。金额舍入、一供应商一物料一条协议价、物料必须指向品类，都在这里。
5. 换数据库或换假数据时，应用依赖的接口不变。Supabase 实现放在 `db`，内存假数据放在 `mock`，两边都实现 `domain` 里的仓储接口。

包名使用范围 `@purchase`。工作区依赖写 `workspace:*`。

## 2. 目录

```text
.
├── package.json                 根私有包，只放工作区脚本
├── pnpm-workspace.yaml
├── pnpm-lock.yaml
├── .npmrc
├── tsconfig.base.json           各包继承的编译选项
├── docs/
│   └── 采购管理系统产品说明.md
├── .trae/
│   └── documents/
│       └── monorepo结构.md
├── supabase/                    Supabase CLI 目录，本地实例用
│   ├── config.toml
│   └── migrations/              表结构只放这里
├── packages/
│   ├── log/
│   ├── env-config/
│   ├── domain/
│   ├── db/
│   ├── mock/
│   ├── request/
│   ├── components/
│   ├── template/
│   └── pdf/
└── apps/
    ├── web/
    └── server/
```

`pnpm-workspace.yaml` 只包含这两行匹配：

```yaml
packages:
  - "packages/*"
  - "apps/*"
```

`domain` 和 `template` 是为了切断依赖而单列的包。没有 `domain`，`mock` 会去依赖 `db`，假数据就会带上 Supabase。没有 `template`，渲染 HTML 会带上 PDF 的无头浏览器依赖。

## 3. 依赖关系

```text
apps/web
  → components
  → request
  → domain
  → env-config
  → log

apps/server
  → domain
  → db
  → mock          仅开发与测试
  → template
  → pdf
  → env-config
  → log

request     → domain, env-config, log
db          → domain, env-config, log
mock        → domain, log
pdf         → template, env-config, log
template    → domain
env-config  → log
components  → （无工作区依赖）
domain      → （无工作区依赖）
log         → （无工作区依赖）
```

不允许这些依赖：

| 禁止 | 原因 |
| --- | --- |
| `web` → `db`、`pdf`、`mock` | 浏览器不持有数据库密钥，也不跑 PDF |
| `components` → `request`、`domain` | 组件只接收属性，不发请求、不认识业务表 |
| `db` ↔ `mock` | 两者是同一组接口的两种实现 |
| `template` → `pdf` | 模板渲染先产出 HTML，PDF 再消费 HTML |
| `domain` → 任何其他包 | 业务类型保持无输入输出 |
| `log` → `env-config` | 日志不自己读环境；环境名称由调用方传入 |
| 任何 `packages` → `apps` | 包可以被另一个应用复用 |

`server` 在开发环境二选一注入 `db` 或 `mock`，不让这两个包互相引用。

## 4. 包职责

### 4.1 `packages/log`

统一日志接口，注入到 Node 和浏览器。

职责：

- 定义 `debug`、`info`、`warn`、`error` 四级记录。
- 每条日志带时间、级别、模块名和可选的上下文字段。
- 提供控制台实现，浏览器和 Node 都能用。
- 调用方传入自己的实现。包不创建进程级单例作为唯一入口。

不做：写文件、发邮件、读取环境变量、打印 Supabase 密钥和密码。

```text
packages/log/
├── package.json
├── tsconfig.json
└── src/
    ├── logger.ts            接口
    ├── console-logger.ts    默认实现
    └── index.ts             createLogger(bindings)
```

对外能力：`Logger` 类型和 `createLogger({ name, sink })`。`db`、`pdf`、`server`、`web` 在自己的构造函数里接收 `Logger`。

### 4.2 `packages/env-config`

按运行环境给出配置。开发使用本机 Supabase，发布才使用线上 Supabase。

职责：

- 声明环境名：`local`、`production`。由 `APP_ENV` 决定。
- `local`：Supabase 地址指向本机 CLI（默认 `http://127.0.0.1:54321`），密钥来自本地 `supabase status`，不写入仓库。
- `production`：地址和密钥只来自发布环境注入的变量。
- Node 入口读取 `process.env`。浏览器入口只暴露前端需要的公开项：后端 API 根地址。
- 校验缺项并失败退出。不在缺密钥时静默连到错误环境。

不做：创建 Supabase 客户端、切换业务功能开关以外的逻辑、把服务端密钥打进前端包。

```text
packages/env-config/
├── package.json
├── tsconfig.json
└── src/
    ├── schema.ts
    ├── profiles.ts
    ├── load-node.ts
    ├── load-browser.ts
    └── index.ts
```

浏览器构建只能导入 `load-browser`。`load-node` 含服务端密钥，禁止被 `apps/web` 引用。这条约束在 `web` 的编译配置里挡住。

公开配置与密钥：

| 项 | local | production | 谁能读 |
| --- | --- | --- | --- |
| API 根地址 | 本机 server | 发布后的 server | 浏览器、server |
| Supabase URL | 本机 | 线上项目 | 仅 server |
| Supabase 服务端密钥 | 本机 | 线上 | 仅 server |
| PDF 字体文件路径 | 本机路径 | 发布镜像内路径 | 仅 server |

### 4.3 `packages/domain`

业务类型、不变量和仓储接口。没有网络、数据库和界面。

职责：

- 描述组织、人员、品类、物料、供应商、协议价、合同、合同模板。
- 写明关联：人员指向一个组织；品类用上级编号形成树；物料用品类编号指向一个品类，且必填；协议价同时指向一个供应商和一个物料；采购明细属于一张采购合同。
- 提供金额计算：行金额先四舍五入到分，合同总价是各行金额之和。
- 定义仓储接口。`db` 和 `mock` 实现这些接口，应用只依赖接口。

不做：SQL、HTTP、React 组件、读取环境、生成 PDF。

```text
packages/domain/
├── package.json
├── tsconfig.json
└── src/
    ├── org.ts
    ├── staff.ts
    ├── category.ts
    ├── material.ts          含 categoryId，必填
    ├── supplier.ts
    ├── price.ts             supplierId + materialId
    ├── contract.ts          主档、正文、明细快照
    ├── contract-template.ts 类型、HTML、生效时的模板快照
    ├── money.ts
    ├── repositories.ts
    └── index.ts
```

合同主档与扩展内容都在 `contract.ts` 描述。保密协议的扩展是正文。采购合同的扩展是正文加明细。模板正文不放进合同类型定义里，模板是独立对象，按合同类型一条。

### 4.4 `packages/db`

Supabase 上的读写封装，以查询为主，同时提供保存所需要的写操作。

职责：

- 用 `env-config` 的服务端配置创建客户端。
- 实现 `domain` 的仓储接口。
- 查询按业务组织：按品类筛物料、按供应商和物料取协议价、按合同类型取模板、按主档条件筛合同。
- 写入时维持唯一约束：协议价的供应商加物料、模板的合同类型、物料编码、供应商编码。
- 物料插入和更新都必须带已存在的 `category_id`。

不做：HTTP 路由、权限判断、HTML 渲染、把查询结果直接变成 PDF。调用方先取出领域对象，再交给模板和 PDF。

```text
packages/db/
├── package.json
├── tsconfig.json
└── src/
    ├── client.ts
    ├── repositories/
    │   ├── org.ts
    │   ├── staff.ts
    │   ├── category.ts
    │   ├── material.ts      查询条件包含 categoryId
    │   ├── supplier.ts
    │   ├── price.ts
    │   ├── contract.ts
    │   └── contract-template.ts
    └── index.ts             createRepositories({ env, logger })
```

表结构不放在这个包里。Supabase CLI 使用仓库根的 `supabase/migrations`。迁移顺序与依赖一致：

1. `org_unit`。`parent_id` 指向自身，可空。
2. `staff`。`org_id` 指向 `org_unit`。
3. `category`。`parent_id` 指向自身，可空。
4. `material`。`category_id` 指向 `category`，非空。
5. `supplier`。
6. `agreed_price`。`supplier_id` 与 `material_id` 联合唯一。
7. `contract_template`。合同类型唯一。
8. `contract`。甲方指向 `org_unit`，乙方指向 `supplier`，并保存生效时复制的模板 HTML。
9. `contract_line`。指向 `contract`，保存名称、规格、单位、单价、数量、金额。采购合同使用；保密协议没有行。

最近一次导出的 PDF 文件放在 Supabase Storage，由 `server` 调用 `db` 的存储方法写入。`pdf` 包只产出字节。

### 4.5 `packages/mock`

业务数据的假实现，实现同一套仓储接口。

职责：

- 在内存中保存一套与迁移后表结构对应的数据。
- 遵守与 `db` 相同的约束：物料必须有品类，协议价组合唯一，停用对象不能进入新合同。
- 提供一小套固定种子：一个可作为甲方的公司、一名采购员、一个品类、一条物料、一名供应商、一条协议价、两份合同模板。
- 测试可以清空内存后塞入自己的数据。

不做：连接 Supabase、启动 HTTP 服务、在浏览器里拦截 `fetch`。前端始终请求 `server`。要使用假数据时，由 `server` 在 `local` 且显式打开 `DATA_SOURCE=mock` 时注入本包。

```text
packages/mock/
├── package.json
├── tsconfig.json
└── src/
    ├── memory.ts
    ├── seed.ts
    ├── repositories/
    └── index.ts             createMockRepositories({ logger, seed })
```

### 4.6 `packages/request`

浏览器里的 HTTP 客户端，供 `apps/web` 的页面调用。

职责：

- 使用 `env-config` 的 API 根地址。
- 附带登录会话。
- 统一超时、网络错误和后端错误体。
- 按资源划分方法：组织、人员、品类、物料、供应商、协议价、合同、模板、PDF 下载。
- 方法的入参和返回使用 `domain` 类型。

不做：操作 DOM、缓存业务决策、在请求层重算合同金额、直接访问 Supabase。

```text
packages/request/
├── package.json
├── tsconfig.json
└── src/
    ├── client.ts            createClient({ env, logger, getSession })
    ├── errors.ts
    ├── resources/
    │   ├── org.ts
    │   ├── staff.ts
    │   ├── category.ts
    │   ├── material.ts
    │   ├── supplier.ts
    │   ├── price.ts
    │   ├── contract.ts
    │   └── template.ts
    └── index.ts
```

基础组件不导入本包。页面和功能模块导入本包。

### 4.7 `packages/components`

跨页面复用的界面组件。

职责：

- 提供按钮、表单控件、表格、树、对话框、页面骨架。
- 树组件能表达组织和品类的层级。表格能表达采购明细。
- 组件通过属性和事件工作。数据由页面传入。

不做：调用 `request`、读取登录态、书写业务规则、包含某个具体页面的布局。

```text
packages/components/
├── package.json
├── tsconfig.json
└── src/
    ├── button/
    ├── field/
    ├── table/
    ├── tree/
    ├── dialog/
    ├── page/
    └── index.ts
```

与 `apps/web` 使用同一种 UI 运行时。具体框架在建立 `web` 时选定，组件库跟随该选择，不在本包里再包一层适配。

### 4.8 `packages/template`

把 HTML 模板和合同数据渲染成 HTML 字符串。

职责：

- 变量替换，例如甲方名称、合同编号、正文。
- 数组迭代，用于采购明细。
- 条件表达式，用于规格是否输出、草稿水印是否出现。
- 只读取调用方传入的数据对象，不查询数据库，不执行任意脚本。
- 模板语法错误返回明确位置，不生成半份合同。

不做：生成 PDF、读取合同表、管理模板的保存。模板的增删改由 `server` 通过仓储完成。

```text
packages/template/
├── package.json
├── tsconfig.json
└── src/
    ├── render.ts
    ├── data.ts              渲染所需的数据结构，来自 domain 的合同快照
    └── index.ts
```

保密协议模板不使用数组迭代。采购合同模板使用明细迭代。两种模板是数据，不是这个包里的硬编码文件；种子数据放在 `mock` 和迁移里。

### 4.9 `packages/pdf`

把 HTML 转成 PDF 字节。

职责：

- 输入 HTML 字符串，输出 PDF。
- A4 纵向，嵌入中文字体。字体路径来自 `env-config`。
- 页眉页脚由打印参数提供：合同编号、标题、页码。
- 调用 `template` 的便捷方法可以放在本包：先渲染再打印。渲染函数本身仍属于 `template`。

不做：决定用哪一版模板、从 Supabase 取合同、把文件上传到存储。这些是 `server` 的用例。

```text
packages/pdf/
├── package.json
├── tsconfig.json
└── src/
    ├── print.ts
    └── index.ts             printHtml({ html, logger, env })
```

无头浏览器或其他 PDF 引擎只出现在这个包的依赖里。`server` 不直接依赖该引擎。

## 5. 应用

### 5.1 `apps/server`

后端。把仓储、模板和 PDF 组成采购员可调用的接口。

职责：

- 登录校验。只有启用中的采购员可以调用业务接口。
- 提供与 `request` 资源一一对应的接口。
- 在启动时组装依赖：读 `env-config`，创建 `Logger`，按 `DATA_SOURCE` 选择 `db` 或 `mock`，构造 `template` 与 `pdf`。
- 执行用例：保存合同时写入快照；生效时复制当时的模板 HTML；导出时用该 HTML 和快照数据生成 PDF，并把最近一次文件交给 `db` 保存。
- 草稿导出使用该类型当前模板。已生效合同导出使用生效时复制下来的模板。

不做：在路由里写 SQL、在浏览器能看到的响应里返回服务端密钥。

```text
apps/server/
├── package.json
├── tsconfig.json
└── src/
    ├── main.ts
    ├── compose.ts           唯一的组装点
    ├── http/
    │   ├── router.ts
    │   └── session.ts
    └── modules/
        ├── auth/
        ├── org/
        ├── catalog/         品类与物料，物料写入时校验品类
        ├── supplier/
        ├── price/
        ├── template/
        └── contract/        含导出 PDF
```

`compose.ts` 是依赖方向的落点。模块函数接收仓储和日志，不在模块内部调用 `createRepositories`。

### 5.2 `apps/web`

采购员使用的前端。

职责：

- 登录、菜单、以及组织、品类、物料、供应商、协议价、合同、合同模板页面。
- 页面调用 `request`，用 `components` 展示。
- 物料表单必须选择一个启用品类后再提交。
- 采购合同明细从当前乙方的协议价中选择物料，数量由采购员填写，金额展示服务端计算的结果。
- 模板页面编辑 HTML 文本。导出通过下载接口取得 PDF。

不做：连接 Supabase、在页面里生成 PDF、复制一套金额计算。

```text
apps/web/
├── package.json
├── tsconfig.json
└── src/
    ├── main.tsx
    ├── router.tsx
    ├── session/
    └── features/
        ├── org/
        ├── catalog/
        ├── supplier/
        ├── price/
        ├── template/
        └── contract/
```

每个 `features` 目录放该页面的容器和局部组件。跨页面组件上升为 `packages/components`。

## 6. 三条跨包流程

**查询物料**

`web` 页面调用 `request` 的物料查询，可带品类编号。`server` 的 catalog 模块调用仓储。`db` 按 `material.category_id` 过滤。`mock` 在内存里做同样的过滤。

**切换 Supabase**

开发时 `APP_ENV=local`，`server` 经 `env-config` 连本机 Supabase。发布时 `APP_ENV=production`，同一套 `db` 代码读取线上变量。前端的 API 根地址同时切换，前端代码不出现 Supabase 地址。

**导出合同**

`server` 读取合同快照和应当使用的模板 HTML，调用 `template` 得到 HTML，再调用 `pdf` 得到字节，然后经 `db` 保存最近一次文件并返回给 `web`。`pdf` 全程看不到数据库。

## 7. 和实现顺序的对应

包可以按这个顺序建立。后一个包的依赖已经存在：

1. `log`、`env-config`、`domain`，以及一份固定 HTML 的 `pdf` 试打。
2. `apps/server` 的组装和登录，`apps/web` 的空壳、`components`、`request`。
3. 组织与人员：`domain` 类型、迁移、`db`、`mock`、两端的 org 功能。
4. 品类，然后物料。物料的仓储和页面同时带上品类编号。供应商可与品类并行。
5. 协议价。
6. 合同主档、保密协议、`template`、模板管理、保密协议 PDF。
7. 采购合同明细和带数组迭代的采购模板。

第 1 步的 PDF 试打只依赖 `pdf` 和字体配置，不等业务表。
