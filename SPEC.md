# ERP 系统规格说明书 (MVP)

## 1. 项目概述

**项目名称**: SimpleERP  
**类型**: 前后端分离的进销存管理系统  
**核心功能**: 商品、供应商、客户、采购、销售、库存的 CRUD 与流转

## 2. 技术栈

| 层 | 技术 |
|---|---|
| 前端框架 | React 18 + TypeScript + Vite |
| UI | TailwindCSS + Radix UI 风格组件 |
| 状态管理 | Zustand |
| 后端 | Node.js + Express |
| 数据库 | SQLite + better-sqlite3 |
| ORM | Drizzle ORM |

## 3. 数据模型

### 3.1 商品 (products)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键自增 |
| code | TEXT | SKU编码，唯一 |
| name | TEXT | 商品名称 |
| spec | TEXT | 规格 |
| unit | TEXT | 单位（个/件/箱等） |
| category | TEXT | 分类 |
| purchase_price | REAL | 采购价 |
| sale_price | REAL | 销售价 |
| stock | INTEGER | 当前库存 |
| min_stock | INTEGER | 库存预警下限 |
| created_at | TEXT | 创建时间 |

### 3.2 供应商 (suppliers)
| 字段 | 类型 |
|------|------|
| id | INTEGER |
| code | TEXT |
| name | TEXT |
| contact | TEXT |
| phone | TEXT |
| address | TEXT |
| created_at | TEXT |

### 3.3 客户 (customers)
| 字段 | 类型 |
|------|------|
| id | INTEGER |
| code | TEXT |
| name | TEXT |
| contact | TEXT |
| phone | TEXT |
| address | TEXT |
| created_at | TEXT |

### 3.4 采购单 (purchase_orders)
| 字段 | 类型 |
|------|------|
| id | INTEGER |
| order_no | TEXT | 采购单号 |
| supplier_id | INTEGER | 关联供应商 |
| total_amount | REAL | 总金额 |
| status | TEXT | pending/completed/cancelled |
| created_at | TEXT |

### 3.5 采购明细 (purchase_items)
| 字段 | 类型 |
|------|------|
| id | INTEGER |
| order_id | INTEGER |
| product_id | INTEGER |
| quantity | INTEGER |
| unit_price | REAL |
| subtotal | REAL |

### 3.6 销售单 (sales_orders)
| 字段 | 类型 |
|------|------|
| id | INTEGER |
| order_no | TEXT | 销售单号 |
| customer_id | INTEGER | 关联客户 |
| total_amount | REAL |
| status | TEXT | pending/completed/cancelled |
| created_at | TEXT |

### 3.7 销售明细 (sales_items)
| 字段 | 类型 |
|------|------|
| id | INTEGER |
| order_id | INTEGER |
| product_id | INTEGER |
| quantity | INTEGER |
| unit_price | REAL |
| subtotal | REAL |

## 4. API 设计

### 商品
- `GET /api/products` - 列表
- `GET /api/products/:id` - 详情
- `POST /api/products` - 新增
- `PUT /api/products/:id` - 更新
- `DELETE /api/products/:id` - 删除

### 供应商
- `GET /api/suppliers` - 列表
- `POST /api/suppliers` - 新增
- `PUT /api/suppliers/:id` - 更新
- `DELETE /api/suppliers/:id` - 删除

### 客户
- `GET /api/customers` - 列表
- `POST /api/customers` - 新增
- `PUT /api/customers/:id` - 更新
- `DELETE /api/customers/:id` - 删除

### 采购单
- `GET /api/purchases` - 列表（含明细）
- `POST /api/purchases` - 创建采购单（含明细，自动入库）
- `PUT /api/purchases/:id` - 更新状态
- `DELETE /api/purchases/:id` - 删除

### 销售单
- `GET /api/sales` - 列表（含明细）
- `POST /api/sales` - 创建销售单（含明细，自动出库）
- `PUT /api/sales/:id` - 更新状态
- `DELETE /api/sales/:id` - 删除

### 库存
- `GET /api/inventory` - 库存列表（商品+当前库存）
- `GET /api/inventory/low-stock` - 库存预警

## 5. 页面结构

```
/ (Dashboard)
├── /products      - 商品管理
├── /suppliers     - 供应商管理
├── /customers     - 客户管理
├── /purchases     - 采购管理
├── /sales         - 销售管理
└── /inventory     - 库存查询
```

## 6. 验收标准

- [ ] 商品完整 CRUD
- [ ] 供应商完整 CRUD
- [ ] 客户完整 CRUD
- [ ] 采购单创建 → 自动增加库存
- [ ] 销售单创建 → 自动扣减库存（库存不足不可出库）
- [ ] 库存预警展示（低于 min_stock 的商品）
- [ ] 列表分页
- [ ] 搜索过滤
- [ ] 响应式布局
