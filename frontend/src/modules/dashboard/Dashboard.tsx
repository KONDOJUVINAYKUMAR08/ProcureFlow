import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../../services/endpoints';
import { formatCurrency, formatRelativeTime, getStatusBadgeClass } from '../../lib/utils';
import { useTheme } from '../../context/ThemeContext';
import {
  Building2, ShoppingCart, FileText, FileCheck, Receipt,
  AlertTriangle, Clock, TrendingUp, ArrowUpRight, ArrowDownRight,
  Activity,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area,
} from 'recharts';

const CHART_COLORS = ['#f97316', '#fbbf24', '#22d3ee', '#10b981', '#ef4444'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: 'var(--surface)', border: '1px solid var(--glass-border)' }} className="rounded-lg p-3 shadow-xl">
        <p className="text-xs text-neutral-500 mb-1">{label}</p>
        <p className="text-sm font-semibold" style={{ color: 'var(--fg)' }}>{formatCurrency(payload[0].value)}</p>
      </div>
    );
  }
  return null;
};

const Dashboard: React.FC = () => {
  const { theme } = useTheme();
  const gridStroke = theme === 'light' ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)';
  const axisStroke = theme === 'light' ? '#94a3b8' : '#64748b';

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => dashboardApi.getStats(),
  });

  const stats = data;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="loading-skeleton h-32 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="loading-skeleton h-80 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const metrics = [
    { label: 'Total Vendors', value: stats?.overview.totalVendors || 0, icon: <Building2 size={20} />, sub: `${stats?.overview.activeVendors || 0} active`, trend: '+12%' },
    { label: 'Purchase Requests', value: stats?.overview.purchaseRequests || 0, icon: <FileText size={20} />, sub: `${stats?.overview.pendingApprovals || 0} pending`, trend: '+8%' },
    { label: 'Purchase Orders', value: stats?.overview.purchaseOrders || 0, icon: <ShoppingCart size={20} />, sub: `${stats?.overview.pendingPurchaseOrders || 0} active`, trend: '+5%' },
    { label: 'Active Contracts', value: stats?.overview.activeContracts || 0, icon: <FileCheck size={20} />, sub: `${stats?.overview.expiringContracts || 0} expiring`, trend: '-2%' },
    { label: 'Total Invoices', value: stats?.overview.totalInvoices || 0, icon: <Receipt size={20} />, sub: `${stats?.overview.pendingInvoices || 0} pending`, trend: '+15%' },
    { label: 'Pending Approvals', value: stats?.overview.pendingApprovals || 0, icon: <Clock size={20} />, sub: 'Requires action', trend: '+3' },
    { label: 'Expiring Contracts', value: stats?.overview.expiringContracts || 0, icon: <AlertTriangle size={20} />, sub: 'Within 30 days', trend: '' },
    { label: 'Monthly Spend', value: formatCurrency(stats?.monthlySpend?.reduce((a: number, b: any) => a + b.total, 0) || 0), icon: <TrendingUp size={20} />, sub: 'This quarter', trend: '+18%' },
  ];

  const monthlySpendData = (stats?.monthlySpend || []).map((item: any) => ({
    name: new Date(2024, item._id.month - 1).toLocaleString('default', { month: 'short' }),
    amount: item.total,
  }));

  const vendorStatusData = (stats?.vendorByStatus || []).map((item: any) => ({
    name: item._id,
    value: item.count,
  }));

  const deptData = (stats?.procurementByDepartment || []).map((item: any) => ({
    name: item._id,
    count: item.count,
    cost: item.totalCost,
  }));

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="page-title">Dashboard</h1>
        <p className="page-description">Overview of your procurement operations</p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, i) => (
          <div key={i} className="metric-card group">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 rounded-lg bg-white/[0.04] text-neutral-400 group-hover:text-white transition-colors">
                {metric.icon}
              </div>
              {metric.trend && (
                <span className={`text-xs font-medium flex items-center gap-0.5 ${
                  metric.trend.startsWith('+') ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  {metric.trend.startsWith('+') ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                  {metric.trend}
                </span>
              )}
            </div>
            <p className="metric-value">{metric.value}</p>
            <div className="flex items-center justify-between mt-1">
              <p className="metric-label">{metric.label}</p>
              <p className="text-xs text-neutral-600">{metric.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Monthly Spend Chart */}
        <div className="lg:col-span-2 glass-card p-6">
          <h3 className="section-title flex items-center gap-2">
            <Activity size={18} className="text-neutral-400" />
            Monthly Procurement Spend
          </h3>
          <div className="h-72 mt-4">
            {monthlySpendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlySpendData}>
                  <defs>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#fbbf24" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                  <XAxis dataKey="name" stroke={axisStroke} fontSize={12} />
                  <YAxis stroke={axisStroke} fontSize={12} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="amount" stroke="#f97316" strokeWidth={2} fill="url(#colorAmount)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state h-full">
                <p>No spending data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Vendor Status Pie */}
        <div className="glass-card p-6">
          <h3 className="section-title">Vendors by Status</h3>
          <div className="h-72 flex items-center justify-center">
            {vendorStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={vendorStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {vendorStatusData.map((_entry: any, index: number) => (
                      <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload?.[0]) {
                        return (
                          <div className="bg-card border border-white/10 rounded-lg p-3 shadow-xl">
                            <p className="text-sm text-white">{payload[0].name}: {payload[0].value}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state">
                <p>No vendor data</p>
              </div>
            )}
          </div>
          <div className="flex flex-wrap justify-center gap-4 mt-2">
            {vendorStatusData.map((item: any, i: number) => (
              <div key={i} className="flex items-center gap-2 text-xs text-neutral-400">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: CHART_COLORS[i] }} />
                {item.name} ({item.value})
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Department Procurement */}
        <div className="glass-card p-6">
          <h3 className="section-title">Procurement by Department</h3>
          <div className="h-64 mt-4">
            {deptData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                  <XAxis dataKey="name" stroke={axisStroke} fontSize={12} />
                  <YAxis stroke={axisStroke} fontSize={12} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="cost" fill="#f97316" radius={[4, 4, 0, 0]} opacity={0.85} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state h-full"><p>No data available</p></div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="glass-card p-6">
          <h3 className="section-title">Recent Activity</h3>
          <div className="space-y-3 mt-4 max-h-64 overflow-y-auto">
            {(stats?.recentActivity || []).map((activity: any, i: number) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg hover:bg-white/[0.02] transition-colors">
                <div className="w-8 h-8 rounded-full bg-white/[0.04] flex items-center justify-center text-neutral-300 shrink-0 mt-0.5">
                  <Activity size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white">
                    <span className="font-medium capitalize">{activity.action}</span>
                    {' '}
                    <span className="text-neutral-400 capitalize">{(activity.entity || '').replace(/_/g, ' ')}</span>
                  </p>
                  <p className="text-xs text-neutral-500 mt-0.5">{formatRelativeTime(activity.createdAt)}</p>
                </div>
              </div>
            ))}
            {(!stats?.recentActivity || stats.recentActivity.length === 0) && (
              <div className="empty-state py-8"><p>No recent activity</p></div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
