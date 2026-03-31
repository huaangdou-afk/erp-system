import { useEffect, useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import DataTable from '../components/common/DataTable';
import Modal from '../components/common/Modal';
import { useSupplierStore, Supplier } from '../stores/supplierStore';

const emptyForm: Partial<Supplier> = { code: '', name: '', contact: '', phone: '', address: '' };

export default function SuppliersPage() {
  const { items, loading, fetch, create, update, remove } = useSupplierStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<Supplier | null>(null);
  const [form, setForm] = useState<Partial<Supplier>>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  useEffect(() => { fetch(); }, [fetch]);

  const openAdd = () => { setEditItem(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (s: Supplier) => { setEditItem(s); setForm({ ...s }); setModalOpen(true); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editItem) await update(editItem.id, form);
      else await create(form);
      setModalOpen(false);
    } catch {}
    setSaving(false);
  };

  const columns: ColumnDef<Supplier, unknown>[] = [
    { accessorKey: 'code', header: '编码' },
    { accessorKey: 'name', header: '名称' },
    { accessorKey: 'contact', header: '联系人' },
    { accessorKey: 'phone', header: '电话' },
    { accessorKey: 'address', header: '地址' },
    {
      accessorKey: 'created_at', header: '创建时间',
      cell: (v) => String(v.getValue()).slice(0, 10),
    },
  ];

  const renderActions = (s: Supplier) => (
    <div className="flex gap-2">
      <button className="btn btn-ghost text-xs" onClick={() => openEdit(s)}>编辑</button>
      <button className="btn btn-danger text-xs" onClick={() => setDeleteId(s.id)}>删除</button>
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-slate-800">供应商管理</h1>
        <button className="btn btn-primary" onClick={openAdd}>+ 新增供应商</button>
      </div>

      <DataTable columns={columns} data={items} loading={loading} searchPlaceholder="搜索供应商..." renderRowActions={renderActions} />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? '编辑供应商' : '新增供应商'}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="label">编码 *</label>
            <input className="input" value={form.code || ''} onChange={e => setForm({ ...form, code: e.target.value })} required />
          </div>
          <div>
            <label className="label">名称 *</label>
            <input className="input" value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div>
            <label className="label">联系人</label>
            <input className="input" value={form.contact || ''} onChange={e => setForm({ ...form, contact: e.target.value })} />
          </div>
          <div>
            <label className="label">电话</label>
            <input className="input" value={form.phone || ''} onChange={e => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div>
            <label className="label">地址</label>
            <input className="input" value={form.address || ''} onChange={e => setForm({ ...form, address: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>取消</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? '保存中...' : '保存'}</button>
          </div>
        </form>
      </Modal>

      <Modal open={deleteId !== null} onClose={() => setDeleteId(null)} title="确认删除" size="sm">
        <p className="text-sm text-slate-600 mb-4">确定要删除该供应商吗？</p>
        <div className="flex justify-end gap-2">
          <button className="btn btn-secondary" onClick={() => setDeleteId(null)}>取消</button>
          <button className="btn btn-danger" onClick={async () => { await remove(deleteId!); setDeleteId(null); }}>确认删除</button>
        </div>
      </Modal>
    </div>
  );
}
