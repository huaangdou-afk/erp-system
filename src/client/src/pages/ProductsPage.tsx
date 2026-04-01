import { useEffect, useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import DataTable from '../components/common/DataTable';
import Modal from '../components/common/Modal';
import { useProductStore, Product } from '../stores/productStore';

const emptyForm: Partial<Product> = {
  code: '', name: '', spec: '', unit: '个', category: '',
  purchase_price: 0, sale_price: 0, stock: 0, min_stock: 0,
};

export default function ProductsPage() {
  const { items, loading, fetch, create, update, remove } = useProductStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<Product | null>(null);
  const [form, setForm] = useState<Partial<Product>>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  useEffect(() => { fetch(); }, [fetch]);

  const openAdd = () => { setEditItem(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (p: Product) => { setEditItem(p); setForm({ ...p }); setModalOpen(true); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editItem) await update(editItem.id, form);
      else await create(form);
      setModalOpen(false);
    } catch (err) {
      console.error('保存商品失败:', err);
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (deleteId == null) return;
    await remove(deleteId);
    setDeleteId(null);
  };

  const columns: ColumnDef<Product, unknown>[] = [
    { accessorKey: 'code', header: '编码', size: 100 },
    { accessorKey: 'name', header: '名称' },
    { accessorKey: 'spec', header: '规格' },
    { accessorKey: 'unit', header: '单位', size: 60 },
    { accessorKey: 'category', header: '分类' },
    {
      accessorKey: 'purchase_price', header: '采购价',
      cell: (v) => `¥${Number(v.getValue()).toFixed(2)}`,
    },
    {
      accessorKey: 'sale_price', header: '销售价',
      cell: (v) => `¥${Number(v.getValue()).toFixed(2)}`,
    },
    {
      accessorKey: 'stock', header: '库存',
      cell: (v) => {
        const stock = Number(v.getValue());
        const min = Number((v.row.original as Product).min_stock);
        return stock < min && min > 0
          ? <span className="text-red-500 font-medium">{stock}</span>
          : stock;
      },
    },
    { accessorKey: 'min_stock', header: '最低库存' },
  ];

  const renderActions = (p: Product) => (
    <div className="flex gap-2">
      <button className="btn btn-ghost text-xs" onClick={() => openEdit(p)}>编辑</button>
      <button className="btn btn-danger text-xs" onClick={() => setDeleteId(p.id)}>删除</button>
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">商品管理</h1>
          <p className="page-subtitle">管理商品信息、采购价、销售价及库存预警</p>
        </div>
        <button className="btn btn-primary gap-2" onClick={openAdd}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          新增商品
        </button>
      </div>

      <DataTable
        columns={columns}
        data={items}
        loading={loading}
        searchPlaceholder="搜索商品..."
        renderRowActions={renderActions}
      />

      {/* Add/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? '编辑商品' : '新增商品'} size="lg">
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">编码 *</label>
            <input className="input" value={form.code || ''} onChange={e => setForm({ ...form, code: e.target.value })} required />
          </div>
          <div>
            <label className="label">名称 *</label>
            <input className="input" value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div>
            <label className="label">规格</label>
            <input className="input" value={form.spec || ''} onChange={e => setForm({ ...form, spec: e.target.value })} />
          </div>
          <div>
            <label className="label">单位</label>
            <input className="input" value={form.unit || ''} onChange={e => setForm({ ...form, unit: e.target.value })} />
          </div>
          <div>
            <label className="label">分类</label>
            <input className="input" value={form.category || ''} onChange={e => setForm({ ...form, category: e.target.value })} />
          </div>
          <div>
            <label className="label">采购价</label>
            <input type="number" step="0.01" className="input" value={form.purchase_price || ''} onChange={e => setForm({ ...form, purchase_price: Number(e.target.value) })} />
          </div>
          <div>
            <label className="label">销售价</label>
            <input type="number" step="0.01" className="input" value={form.sale_price || ''} onChange={e => setForm({ ...form, sale_price: Number(e.target.value) })} />
          </div>
          <div>
            <label className="label">初始库存</label>
            <input type="number" className="input" value={form.stock || ''} onChange={e => setForm({ ...form, stock: Number(e.target.value) })} />
          </div>
          <div>
            <label className="label">最低库存预警</label>
            <input type="number" className="input" value={form.min_stock || ''} onChange={e => setForm({ ...form, min_stock: Number(e.target.value) })} />
          </div>
          <div className="col-span-2 flex justify-end gap-2 mt-2">
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>取消</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? '保存中...' : '保存'}</button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm */}
      <Modal open={deleteId !== null} onClose={() => setDeleteId(null)} title="确认删除" size="sm">
        <div className="flex items-start gap-4 py-2">
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800 mb-1">确定要删除该商品吗？</p>
            <p className="text-xs text-slate-500">此操作不可恢复，商品相关数据将永久删除。</p>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button className="btn btn-secondary" onClick={() => setDeleteId(null)}>取消</button>
          <button className="btn btn-danger" onClick={handleDelete}>确认删除</button>
        </div>
      </Modal>
    </div>
  );
}
