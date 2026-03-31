import { useEffect, useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import DataTable from '../components/common/DataTable';
import Modal from '../components/common/Modal';
import { useSalesStore, SalesOrder } from '../stores/salesStore';
import { useCustomerStore } from '../stores/customerStore';
import { useProductStore } from '../stores/productStore';

interface LineItem {
  product_id: number;
  product_name?: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  [key: string]: unknown;
}

export default function SalesPage() {
  const { orders, loading, fetch, create, updateStatus, remove } = useSalesStore();
  const { items: customers } = useCustomerStore();
  const { items: products, fetch: fetchProducts } = useProductStore();

  const [modalOpen, setModalOpen] = useState(false);
  const [customerId, setCustomerId] = useState<number | ''>('');
  const [lines, setLines] = useState<LineItem[]>([{ product_id: 0, quantity: 1, unit_price: 0, subtotal: 0 }]);
  const [saving, setSaving] = useState(false);
  const [detailId, setDetailId] = useState<number | null>(null);

  useEffect(() => { fetch(); }, [fetch]);
  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const openCreate = () => {
    setCustomerId('');
    setLines([{ product_id: 0, quantity: 1, unit_price: 0, subtotal: 0 }]);
    setModalOpen(true);
  };

  const addLine = () => setLines([...lines, { product_id: 0, quantity: 1, unit_price: 0, subtotal: 0 }]);
  const removeLine = (i: number) => setLines(lines.filter((_, idx) => idx !== i));

  const updateLine = (i: number, field: keyof LineItem, value: number | string) => {
    const updated = [...lines];
    (updated[i] as Record<string, unknown>)[field] = value;
    if (field === 'product_id') {
      const p = products.find((pr) => pr.id === Number(value));
      if (p) {
        updated[i].unit_price = p.sale_price;
        updated[i].product_name = p.name;
      }
    }
    updated[i].subtotal = Number(updated[i].quantity) * Number(updated[i].unit_price);
    setLines(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId || lines.some((l) => !l.product_id)) return;
    setSaving(true);
    try {
      await create({
        customer_id: Number(customerId),
        items: lines.map((l) => ({ product_id: Number(l.product_id), quantity: Number(l.quantity), unit_price: Number(l.unit_price) })),
      });
      setModalOpen(false);
    } catch {}
    setSaving(false);
  };

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      pending: 'bg-amber-100 text-amber-700',
      completed: 'bg-green-100 text-green-700',
      cancelled: 'bg-slate-100 text-slate-500',
    };
    const labels: Record<string, string> = { pending: '待处理', completed: '已完成', cancelled: '已取消' };
    return <span className={`px-2 py-0.5 rounded text-xs font-medium ${map[s] || ''}`}>{labels[s] || s}</span>;
  };

  const columns: ColumnDef<SalesOrder, unknown>[] = [
    { accessorKey: 'order_no', header: '单号' },
    { accessorKey: 'customer_name', header: '客户' },
    {
      accessorKey: 'total_amount', header: '总金额',
      cell: (v) => `¥${Number(v.getValue()).toFixed(2)}`,
    },
    { accessorKey: 'status', header: '状态', cell: (v) => statusBadge(String(v.getValue())) },
    {
      accessorKey: 'created_at', header: '创建时间',
      cell: (v) => String(v.getValue()).slice(0, 16).replace('T', ' '),
    },
  ];

  const renderActions = (o: SalesOrder) => (
    <div className="flex gap-1">
      <button className="btn btn-ghost text-xs" onClick={() => setDetailId(o.id)}>查看</button>
      {o.status === 'pending' && (
        <>
          <button className="btn btn-secondary text-xs" onClick={() => updateStatus(o.id, 'completed')}>完成</button>
          <button className="btn btn-danger text-xs" onClick={() => remove(o.id)}>删除</button>
        </>
      )}
      {o.status === 'completed' && (
        <button className="btn btn-secondary text-xs" onClick={() => updateStatus(o.id, 'cancelled')}>取消</button>
      )}
    </div>
  );

  const selectedOrder = orders.find((o) => o.id === detailId);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-slate-800">销售管理</h1>
        <button className="btn btn-primary" onClick={openCreate}>+ 新建销售单</button>
      </div>

      <DataTable columns={columns} data={orders} loading={loading} searchPlaceholder="搜索单号..." renderRowActions={renderActions} />

      {/* Create Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="新建销售单" size="lg">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="label">客户 *</label>
            <select className="input" value={customerId} onChange={e => setCustomerId(Number(e.target.value))} required>
              <option value="">选择客户</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">商品明细</label>
              <button type="button" className="btn btn-secondary text-xs" onClick={addLine}>+ 添加商品</button>
            </div>
            <table className="w-full text-sm border border-slate-200 rounded">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">商品</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 w-24">数量</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 w-28">单价</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 w-28">小计</th>
                  <th className="px-3 py-2 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line, i) => (
                  <tr key={i} className="border-t border-slate-100">
                    <td className="px-3 py-2">
                      <select className="input text-xs" value={line.product_id} onChange={e => updateLine(i, 'product_id', Number(e.target.value))} required>
                        <option value={0}>选择商品</option>
                        {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.code}) 库存:{p.stock}</option>)}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <input type="number" min="1" className="input text-xs" value={line.quantity} onChange={e => updateLine(i, 'quantity', Number(e.target.value))} />
                    </td>
                    <td className="px-3 py-2">
                      <input type="number" step="0.01" min="0" className="input text-xs" value={line.unit_price} onChange={e => updateLine(i, 'unit_price', Number(e.target.value))} />
                    </td>
                    <td className="px-3 py-2 text-right text-slate-700">¥{line.subtotal.toFixed(2)}</td>
                    <td className="px-3 py-2">
                      <button type="button" className="text-red-400 hover:text-red-600 text-sm" onClick={() => removeLine(i)}>&times;</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-sm text-slate-600 text-right mt-2">
              合计：<span className="font-semibold">¥{lines.reduce((a, l) => a + l.subtotal, 0).toFixed(2)}</span>
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>取消</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? '保存中...' : '确认销售'}</button>
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      <Modal open={detailId !== null} onClose={() => setDetailId(null)} title="销售单明细" size="lg">
        {selectedOrder && (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-slate-500">单号：</span>{selectedOrder.order_no}</div>
              <div><span className="text-slate-500">客户：</span>{selectedOrder.customer_name}</div>
              <div><span className="text-slate-500">总金额：</span>¥{selectedOrder.total_amount.toFixed(2)}</div>
              <div><span className="text-slate-500">状态：</span>{statusBadge(selectedOrder.status)}</div>
            </div>
            <table className="w-full text-sm border border-slate-200 rounded">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">商品</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">编码</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-slate-600">数量</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-slate-600">单价</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-slate-600">小计</th>
                </tr>
              </thead>
              <tbody>
                {selectedOrder.items.map((item) => (
                  <tr key={item.id} className="border-t border-slate-100">
                    <td className="px-3 py-2">{item.product_name}</td>
                    <td className="px-3 py-2">{item.product_code}</td>
                    <td className="px-3 py-2 text-right">{item.quantity} {item.unit}</td>
                    <td className="px-3 py-2 text-right">¥{item.unit_price.toFixed(2)}</td>
                    <td className="px-3 py-2 text-right">¥{item.subtotal.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Modal>
    </div>
  );
}
