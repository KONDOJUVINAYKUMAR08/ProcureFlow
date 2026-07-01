import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import api from '../services/api';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Streams a file from an authenticated backend endpoint (e.g. a generated
// invoice/payslip PDF, or an uploaded document) and saves it locally.
// `window.open(url)` doesn't work for these — a plain new-tab navigation
// carries no Authorization header, so the backend would 401. Routing the
// request through the shared `api` axios instance keeps the Bearer token.
export async function downloadFile(url: string, filename: string): Promise<void> {
  const res = await api.get(url, { responseType: 'blob' });
  const blobUrl = URL.createObjectURL(res.data);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(blobUrl);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const d = new Date(date);
  const diff = now.getTime() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDate(date);
}

export function getStatusBadgeClass(status: string): string {
  const map: Record<string, string> = {
    active: 'badge-active',
    pending: 'badge-pending',
    inactive: 'badge-inactive',
    rejected: 'badge-rejected',
    approved: 'badge-approved',
    completed: 'badge-completed',
    draft: 'badge-draft',
    paid: 'badge-paid',
    overdue: 'badge-overdue',
    disputed: 'badge-disputed',
    issued: 'badge-issued',
    shipped: 'badge-shipped',
    cancelled: 'badge-cancelled',
    acknowledged: 'badge-active',
    pending_renewal: 'badge-pending',
    expired: 'badge-rejected',
    terminated: 'badge-rejected',
    blacklisted: 'badge-rejected',
  };
  return map[status] || 'badge-draft';
}

export function getStatusDotClass(status: string): string {
  const map: Record<string, string> = {
    active: 'bg-emerald-400',
    pending: 'bg-amber-400',
    inactive: 'bg-neutral-500',
    approved: 'bg-emerald-400',
    rejected: 'bg-red-400',
    draft: 'bg-neutral-500',
  };
  return map[status] || 'bg-neutral-500';
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.substring(0, length) + '...';
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}
