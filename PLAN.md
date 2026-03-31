# SimpleERP 项目规划

## 现状

### 后端 ✅ 基本完成
```
src/server/
├── index.js           # Express 入口，端口 3001，CORS 已配置
├── db/database.js     # SQLite + 7张表，better-sqlite3
└── routes/
    ├── products.js    # 商品 CRUD
    ├── suppliers.js   # 供应商 CRUD
    ├── customers.js   # 客户 CRUD
    ├── purchases.js   # 采购单（含自动入库）
    ├── sales.js       # 销售单（含库存校验，自动出库/退回）
    └── inventory.js   # 库存列表 + 低库存预警
```

### 前端 ✅ 基本完成
```
src/client/
├── src/
│   ├── App.tsx          # 路由 + 布局（侧边栏 + 主内容）
│   ├── main.tsx        # React 入口
│   ├── index.css        # TailwindCSS 入口
│   ├── lib/api.ts       # Axios 封装
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── ProductsPage.tsx
│   │   ├── SuppliersPage.tsx
│   │   ├── CustomersPage.tsx
│   │   ├── PurchasesPage.tsx
│   │   ├── SalesPage.tsx
│   │   └── InventoryPage.tsx
│   ├── stores/          # Zustand stores × 6
│   └── components/common/
│       ├── Sidebar.tsx
│       ├── DataTable.tsx
│       └── Modal.tsx
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
└── package.json
```

### 待完成/需优化

- [ ] **前端构建报错** — `npm run build` TypeScript 类型问题
- [ ] **GitHub Pages 部署** — 404，需确认 workflow 是否完整
- [ ] **后端部署** — 本地跑 `node src/server/index.js`，未上云
- [ ] **前后端联调** — 前端部署后 API 地址需要切换
- [ ] **前端 UI 美化** — 当前是 Claude Code 自动生成的样式，需要统一设计规范

---

## 计划

### Phase 1：修 Bug（优先级最高）

1. **修前端 build** — 检查 TypeScript 错误，确保 `npm run build` 通过
2. **验证 Pages 部署** — 确认 workflow 正确，Pages 能访问

### Phase 2：后端云端部署

3. **选型**：Railway / Render / Fly.io（都是免费额度，支持 Node.js）
4. **部署后端** — SQLite 文件需要持久化，或切到 PostgreSQL
5. **配置环境变量** — `VITE_API_URL` 指向前端可访问的后端地址

### Phase 3：前端优化

6. **UI 规范** — 统一颜色、间距、字体、组件风格
7. **响应式** — 移动端适配
8. **Dashboard 图表** — 用 recharts 或纯 CSS 图表

### Phase 4：功能完善

9. **权限管理** — 登录/注册（可选，简单 JWT）
10. **财务模块** — 应收/应付（基于采购/销售单自动生成）
11. **报表导出** — Excel / PDF
12. **数据导入** — Excel 批量导入商品/库存

---

## 技术决策

| 项目 | 当前 | 建议 |
|------|------|------|
| 数据库 | SQLite 文件 | PostgreSQL（云端部署） |
| 前端样式 | TailwindCSS 基础 | shadcn/ui 组件 |
| 状态管理 | Zustand | 保持 |
| 图表 | 无 | recharts |
| 部署平台 | 探索中 | Railway（最简单） |

---

## 快速启动

**本地跑后端：**
```bash
cd erp-system
node src/server/index.js
# API: http://localhost:3001/api
```

**本地跑前端（开发）：**
```bash
cd erp-system/src/client
npm run dev
# 前端: http://localhost:5173
```

**构建前端：**
```bash
cd erp-system/src/client
npm run build
```
