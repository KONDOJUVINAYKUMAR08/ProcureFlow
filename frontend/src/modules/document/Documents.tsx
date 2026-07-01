import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { documentApi } from '../../services/endpoints';
import { formatDate, formatRelativeTime, downloadFile } from '../../lib/utils';
import { Upload, Download, Trash2, File, FolderOpen, FileText, Image, Table } from 'lucide-react';

const Documents: React.FC = () => {
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [category, setCategory] = useState('');
  const [uploadCategory, setUploadCategory] = useState('vendor_certificate');

  const { data, isLoading } = useQuery({
    queryKey: ['documents', category],
    queryFn: () => documentApi.getAll({ category }),
  });

  const uploadMutation = useMutation({
    mutationFn: (formData: FormData) => documentApi.upload(formData),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['documents'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => documentApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['documents'] }),
  });

  const documents = Array.isArray(data?.items) ? data.items : [];

  const handleDownload = async (id: string, originalName: string) => {
    try {
      const res: any = await documentApi.getDownloadUrl(id);
      if (res?.url) downloadFile(res.url, res.document?.originalName || originalName);
    } catch (error) {
      console.error('Error downloading document:', error);
    }
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', uploadCategory);
    uploadMutation.mutate(formData);
  };

  const getFileIcon = (mime: string) => {
    if (mime.includes('pdf')) return <FileText size={20} className="text-red-400" />;
    if (mime.includes('image')) return <Image size={20} className="text-blue-400" />;
    if (mime.includes('sheet') || mime.includes('excel')) return <Table size={20} className="text-emerald-400" />;
    return <File size={20} className="text-neutral-400" />;
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div><h1 className="page-title">Documents</h1><p className="page-description">Manage procurement documents and files</p></div>
        <button onClick={() => fileRef.current?.click()} className="btn-primary flex items-center gap-2">
          <Upload size={16} /> Upload Document
        </button>
        <input ref={fileRef} type="file" className="hidden" onChange={handleUpload} />
      </div>

      <div className="flex items-center gap-3">
        <select value={uploadCategory} onChange={e => setUploadCategory(e.target.value)} className="bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white outline-none">
          <option value="contract" className="bg-black">Contract</option>
          <option value="invoice" className="bg-black">Invoice</option>
          <option value="purchase_order" className="bg-black">Purchase Order</option>
          <option value="vendor_certificate" className="bg-black">Vendor Certificate</option>
        </select>
        <select value={category} onChange={e => setCategory(e.target.value)} className="bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white outline-none">
          <option value="" className="bg-black">All Categories</option>
          <option value="contract" className="bg-black">Contracts</option>
          <option value="invoice" className="bg-black">Invoices</option>
          <option value="purchase_order" className="bg-black">Purchase Orders</option>
          <option value="vendor_certificate" className="bg-black">Vendor Certificates</option>
        </select>
      </div>

      {uploadMutation.isPending && (
        <div className="glass-card p-4 flex items-center gap-3">
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          <p className="text-sm text-neutral-400">Uploading document...</p>
        </div>
      )}

      <div className="glass-card overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="loading-skeleton h-12 rounded-lg" />)}</div>
        ) : documents.length === 0 ? (
          <div className="empty-state py-20"><FolderOpen size={32} className="mx-auto mb-2 opacity-50" /><p>No documents uploaded yet</p></div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {documents.map((doc: any) => (
              <div key={doc._id} className="flex items-center justify-between px-6 py-4 hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center gap-3">
                  {getFileIcon(doc.mimeType)}
                  <div>
                    <p className="text-sm font-medium text-white">{doc.originalName}</p>
                    <p className="text-xs text-neutral-500">{doc.category} · {(doc.size / 1024).toFixed(1)} KB · {formatRelativeTime(doc.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleDownload(doc._id, doc.originalName)} className="p-2 rounded-lg hover:bg-white/5 text-neutral-400 hover:text-white" title="Download">
                    <Download size={14} />
                  </button>
                  <button onClick={() => deleteMutation.mutate(doc._id)} className="p-2 rounded-lg hover:bg-white/5 text-neutral-400 hover:text-red-400" title="Delete">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Documents;
