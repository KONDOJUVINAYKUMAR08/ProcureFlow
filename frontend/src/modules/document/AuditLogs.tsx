import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { auditApi } from '../../services/endpoints';
import { formatDateTime } from '../../lib/utils';
import { Shield, Search, ChevronLeft, ChevronRight } from 'lucide-react';

const AuditLogs: React.FC = () => {
  const [page, setPage] = useState(1);
  const [entity, setEntity] = useState('');
  const [action, setAction] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', page, entity, action],
    queryFn: () => auditApi.getAll({ page, limit: 20, entity, action }),
  });

  const logs = Array.isArray(data?.items) ? data.items : [];
  const pagination = data?.pagination;

  const actionColors: Record<string, string> = {
    login: 'text-blue-400', create: 'text-emerald-400', update: 'text-amber-400',
    delete: 'text-red-400', approve: 'text-emerald-400', reject: 'text-red-400',
    submit: 'text-blue-400', payment: 'text-purple-400',
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div><h1 className="page-title">Audit Logs</h1><p className="page-description">Track all system activities and changes</p></div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <select value={entity} onChange={e => { setEntity(e.target.value); setPage(1); }} className="bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white outline-none">
          <option value="" className="bg-black">All Entities</option>
          <option value="auth" className="bg-black">Auth</option>
          <option value="vendor" className="bg-black">Vendor</option>
          <option value="contract" className="bg-black">Contract</option>
          <option value="invoice" className="bg-black">Invoice</option>
          <option value="purchase_order" className="bg-black">Purchase Order</option>
          <option value="purchase_request" className="bg-black">Purchase Request</option>
        </select>
        <select value={action} onChange={e => { setAction(e.target.value); setPage(1); }} className="bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white outline-none">
          <option value="" className="bg-black">All Actions</option>
          <option value="login" className="bg-black">Login</option>
          <option value="create" className="bg-black">Create</option>
          <option value="update" className="bg-black">Update</option>
          <option value="delete" className="bg-black">Delete</option>
          <option value="approve" className="bg-black">Approve</option>
          <option value="reject" className="bg-black">Reject</option>
        </select>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left text-xs font-medium text-neutral-500 px-6 py-3">User</th>
                <th className="text-left text-xs font-medium text-neutral-500 px-6 py-3">Action</th>
                <th className="text-left text-xs font-medium text-neutral-500 px-6 py-3">Entity</th>
                <th className="text-left text-xs font-medium text-neutral-500 px-6 py-3">IP Address</th>
                <th className="text-left text-xs font-medium text-neutral-500 px-6 py-3">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? [...Array(10)].map((_, i) => <tr key={i} className="table-row"><td colSpan={5} className="px-6 py-3"><div className="loading-skeleton h-4 w-full" /></td></tr>)
              : logs.length === 0 ? <tr><td colSpan={5} className="text-center py-12 text-neutral-500"><Shield size={32} className="mx-auto mb-2 opacity-50" />No audit logs found</td></tr>
              : logs.map((log: any) => (
                <tr key={log._id} className="table-row">
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-white/[0.06] flex items-center justify-center text-[10px] font-medium text-white">
                        {typeof log.userId === 'object' ? `${log.userId?.firstName?.[0]}${log.userId?.lastName?.[0]}` : '??'}
                      </div>
                      <span className="text-sm text-white">{typeof log.userId === 'object' ? `${log.userId?.firstName} ${log.userId?.lastName}` : 'Unknown'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3"><span className={`text-sm font-medium capitalize ${actionColors[log.action] || 'text-neutral-400'}`}>{log.action}</span></td>
                  <td className="px-6 py-3 text-sm text-neutral-400 capitalize">{log.entity?.replace('_', ' ')}</td>
                  <td className="px-6 py-3 text-xs font-mono text-neutral-500">{log.ipAddress}</td>
                  <td className="px-6 py-3 text-sm text-neutral-500">{formatDateTime(log.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {pagination && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-white/[0.06]">
            <p className="text-xs text-neutral-500">{pagination.total} results</p>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page<=1} className="p-1 rounded hover:bg-white/5 disabled:opacity-30 text-neutral-400"><ChevronLeft size={16} /></button>
              <button onClick={() => setPage(p => p+1)} disabled={page>=pagination.totalPages} className="p-1 rounded hover:bg-white/5 disabled:opacity-30 text-neutral-400"><ChevronRight size={16} /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLogs;
