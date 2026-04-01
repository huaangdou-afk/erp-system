import { useEffect, useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import DataTable from '../components/common/DataTable';
import Modal from '../components/common/Modal';
import { useCustomerStore, Customer } from '../stores/customerStore';

const emptyForm: Partial<Customer> = { code: '', name: '', contact: '', phone: '', address: '' };

export default function CustomersPage() {
  const { items, loading, fetch, create, update, remove } = useCustomerStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<Customer | null>(null);
  const [form, setForm] = useState<Partial<Customer>>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  useEffect(() => { fetch(); }, [fetch]);

  const openAdd = () => { setEditItem(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (c: Customer) => { setEditItem(c); setForm({ ...c }); setModalOpen(true); };

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

  const columns: ColumnDef<Customer, unknown>[] = [
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

  const renderActions = (c: Customer) => (
    <div className="flex gap-2">
      <button className="btn btn-ghost text-xs" onClick={() => openEdit(c)}>编辑</button>
      <button className="btn btn-danger text-xs" onClick={() => setDeleteId(c.id)}>删除</button>
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">客户管理</h1>
          <p className="page-subtitle">管理客户信息与联系方式</p>
        </div>
        <button className="btn btn-primary gap-2" onClick={openAdd}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          新增客户
        </button>
      </div>

      <DataTable columns={columns} data={items} loading={loading} searchPlaceholder="搜索客户..." renderRowActions={renderActions} />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? '编辑客户' : '新增客户'}>
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
        <div className="flex items-start gap-4 py-2">
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800 mb-1">确定要删除该客户吗？</p>
            <p className="text-xs text-slate-500">此操作不可恢复，相关信息将永久删除。</p>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button className="btn btn-secondary" onClick={() => setDeleteId(null)}>取消</button>
          <button className="btn btn-danger" onClick={async () => { await remove(deleteId!); setDeleteId(null); }}>确认删除</button>
        </div>
      </Modal>
    </div>
  );
}
