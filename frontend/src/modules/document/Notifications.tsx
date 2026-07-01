import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationApi } from '../../services/endpoints';
import { formatRelativeTime } from '../../lib/utils';
import { Bell, FileCheck, Receipt, Building2, ShoppingCart, CheckCheck, Clock } from 'lucide-react';

const typeIcons: Record<string, React.ReactNode> = {
  contract_expiry: <Clock size={16} className="text-amber-400" />,
  invoice_due: <Receipt size={16} className="text-blue-400" />,
  vendor_approval: <Building2 size={16} className="text-emerald-400" />,
  purchase_approval: <ShoppingCart size={16} className="text-purple-400" />,
  system: <Bell size={16} className="text-neutral-400" />,
};

const Notifications: React.FC = () => {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationApi.getAll({ limit: 50 }),
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationApi.markAsRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllMutation = useMutation({
    mutationFn: () => notificationApi.markAllAsRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const notifications = data?.items || [];

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div><h1 className="page-title">Notifications</h1><p className="page-description">Stay updated on procurement activities</p></div>
        {notifications.some((n: any) => !n.isRead) && (
          <button onClick={() => markAllMutation.mutate()} className="btn-secondary flex items-center gap-2"><CheckCheck size={14} /> Mark all as read</button>
        )}
      </div>

      <div className="glass-card overflow-hidden divide-y divide-white/[0.04]">
        {isLoading ? (
          <div className="p-6 space-y-4">{[...Array(5)].map((_, i) => <div key={i} className="loading-skeleton h-16 rounded-lg" />)}</div>
        ) : notifications.length === 0 ? (
          <div className="empty-state py-20"><Bell size={32} className="mx-auto mb-2 opacity-50" /><p>No notifications</p></div>
        ) : (
          notifications.map((n: any) => (
            <div
              key={n._id}
              onClick={() => !n.isRead && markReadMutation.mutate(n._id)}
              className={`flex items-start gap-4 px-6 py-4 hover:bg-white/[0.02] transition-colors cursor-pointer ${!n.isRead ? 'bg-white/[0.01]' : ''}`}
            >
              <div className="w-8 h-8 rounded-full bg-white/[0.04] flex items-center justify-center shrink-0 mt-0.5">
                {typeIcons[n.type] || <Bell size={16} className="text-neutral-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={`text-sm ${!n.isRead ? 'font-medium text-white' : 'text-neutral-300'}`}>{n.title}</p>
                  {!n.isRead && <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />}
                </div>
                <p className="text-sm text-neutral-500 mt-0.5">{n.message}</p>
                <p className="text-xs text-neutral-600 mt-1">{formatRelativeTime(n.createdAt)}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Notifications;
