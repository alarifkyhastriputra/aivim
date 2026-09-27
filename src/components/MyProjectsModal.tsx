import React, { useState } from 'react';
import { GeneratedWebsite } from '../types';
import { deleteWebsite } from '../lib/firebase';
import { 
  History, 
  Trash2, 
  ExternalLink, 
  Download, 
  Code, 
  X, 
  Calendar, 
  Eye, 
  Search, 
  Sparkles,
  ShoppingBag,
  FileCode
} from 'lucide-react';
import JSZip from 'jszip';

interface MyProjectsModalProps {
  isOpen: boolean;
  onClose: () => void;
  websites: GeneratedWebsite[];
  onSelectProject: (site: GeneratedWebsite) => void;
  onRefresh: () => void;
}

export const MyProjectsModal: React.FC<MyProjectsModalProps> = ({
  isOpen,
  onClose,
  websites,
  onSelectProject,
  onRefresh
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const filteredWebsites = websites.filter((site) => 
    site.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (site.category && site.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleDelete = async (e: React.MouseEvent, id: string, title: string) => {
    e.stopPropagation();
    if (confirm(`Apakah Anda yakin ingin menghapus "${title}" dari riwayat?`)) {
      await deleteWebsite(id);
      onRefresh();
    }
  };

  const handleDownloadHtml = (e: React.MouseEvent, site: GeneratedWebsite) => {
    e.stopPropagation();
    const blob = new Blob([site.html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${site.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadZip = async (e: React.MouseEvent, site: GeneratedWebsite) => {
    e.stopPropagation();
    const zip = new JSZip();
    zip.file('index.html', site.html);
    zip.file('README.txt', `Dibuat dengan vimos.ai\nJudul: ${site.title}\nTanggal: ${site.createdAt}\nKategori: ${site.category}`);
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${site.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_vimos.zip`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleOpenNewTab = (e: React.MouseEvent, site: GeneratedWebsite) => {
    e.stopPropagation();
    const blob = new Blob([site.html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fadeIn">
      <div className="relative w-full max-w-4xl h-[88vh] bg-[#111827] border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-[#0B0F19]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white tracking-tight">Riwayat Pembuatan Website</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-bold">
                  {websites.length} Website
                </span>
              </div>
              <p className="text-xs text-slate-400">Daftar semua website yang telah Anda buat dengan vimos.ai</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-xl transition"
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Actions Bar */}
        <div className="px-6 py-3.5 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between gap-4">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari berdasarkan nama website / toko..."
              className="w-full bg-[#1e293b] border border-slate-700 rounded-xl py-2 pl-9 pr-4 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500"
            />
          </div>

          <button
            onClick={onRefresh}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition"
          >
            Segarkan
          </button>
        </div>

        {/* Content List */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredWebsites.length === 0 ? (
            <div className="text-center py-20 space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700 mx-auto flex items-center justify-center text-slate-500">
                <History className="w-8 h-8" />
              </div>
              <h3 className="text-base font-semibold text-slate-200">
                {searchTerm ? 'Tidak ada hasil yang cocok' : 'Belum ada riwayat website'}
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {searchTerm 
                  ? 'Coba gunakan kata kunci pencarian yang lain.'
                  : 'Gunakan tombol Buat Website untuk menghasilkan website pertama Anda!'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredWebsites.map((site) => {
                const dateObj = new Date(site.createdAt);
                const formattedDate = dateObj.toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <div
                    key={site.id}
                    onClick={() => {
                      onSelectProject(site);
                      onClose();
                    }}
                    className="group relative bg-[#1e293b]/70 hover:bg-[#1e293b] border border-slate-700 hover:border-indigo-500/60 rounded-2xl p-5 cursor-pointer transition shadow-xl flex flex-col justify-between space-y-4"
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <h3 className="font-bold text-white text-base group-hover:text-indigo-400 transition">
                            {site.title}
                          </h3>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-1">
                            <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                            <span>{formattedDate} WIB</span>
                          </div>
                        </div>

                        <span className="px-2.5 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-[10px] font-semibold shrink-0">
                          {site.category || 'Toko Online'}
                        </span>
                      </div>

                      <p className="text-xs text-slate-400 line-clamp-2 bg-[#0F172A]/70 p-2.5 rounded-xl border border-slate-800 text-[11px]">
                        {site.prompt || 'Website modern yang siap digunakan.'}
                      </p>
                    </div>

                    {/* Bottom Action Buttons */}
                    <div className="pt-3 border-t border-slate-700/80 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          onSelectProject(site);
                          onClose();
                        }}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Buka di Studio</span>
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => handleOpenNewTab(e, site)}
                          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition"
                          title="Buka Preview Penuh (Tab Baru)"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={(e) => handleDownloadHtml(e, site)}
                          className="p-2 bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white rounded-lg transition"
                          title="Download File HTML"
                        >
                          <FileCode className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={(e) => handleDownloadZip(e, site)}
                          className="p-2 bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white rounded-lg transition"
                          title="Download ZIP"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={(e) => handleDelete(e, site.id, site.title)}
                          className="p-2 bg-slate-800 hover:bg-rose-600 text-slate-400 hover:text-white rounded-lg transition"
                          title="Hapus dari Riwayat"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
