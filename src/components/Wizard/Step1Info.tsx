import React from 'react';
import { WizardData } from '../../types';
import { Building2, User, FileText, Tag, Sparkles } from 'lucide-react';

interface Step1Props {
  data: WizardData;
  updateData: (fields: Partial<WizardData>) => void;
}

const categories = [
  'Bisnis',
  'Personal',
  'Toko',
  'Sekolah',
  'Komunitas',
  'Blog',
  'Portfolio',
  'Lainnya',
];

export const Step1Info: React.FC<Step1Props> = ({ data, updateData }) => {
  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="text-center space-y-1.5 mb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          Langkah 1: Identitas & Informasi
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Informasi Dasar Website</h2>
        <p className="text-xs text-slate-400">
          Masukkan informasi bisnis atau konsep website yang ingin Anda buat.
        </p>
      </div>

      <div className="space-y-4 bg-[#111827] p-6 rounded-2xl border border-slate-800 shadow-xl">
        {/* Nama Website */}
        <div>
          <label className="block text-xs font-semibold text-slate-200 mb-1.5 flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-indigo-400" />
            <span>Nama Website / Toko *</span>
          </label>
          <input
            type="text"
            required
            value={data.siteName}
            onChange={(e) => updateData({ siteName: e.target.value })}
            placeholder="Contoh: Vimos Store"
            className="w-full bg-[#1e293b] border border-slate-700 focus:border-indigo-500 text-white rounded-xl py-3 px-4 text-sm outline-none transition"
          />
          <p className="text-[11px] text-slate-500 mt-1">Nama ini akan menjadi judul utama di website Anda.</p>
        </div>

        {/* Deskripsi Singkat */}
        <div>
          <label className="block text-xs font-semibold text-slate-200 mb-1.5 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-indigo-400" />
            <span>Deskripsi Singkat *</span>
          </label>
          <textarea
            required
            rows={3}
            value={data.siteDescription}
            onChange={(e) => updateData({ siteDescription: e.target.value })}
            placeholder="Contoh: Toko online yang menjual pakaian modern, tren terbaru dengan bahan premium dan harga terjangkau."
            className="w-full bg-[#1e293b] border border-slate-700 focus:border-indigo-500 text-white rounded-xl p-3 text-sm outline-none transition resize-none leading-relaxed"
          />
          <p className="text-[11px] text-slate-500 mt-1">Jelaskan secara ringkas tentang produk, jasa, atau tujuan website Anda.</p>
        </div>

        {/* Nama Pemilik / Brand */}
        <div>
          <label className="block text-xs font-semibold text-slate-200 mb-1.5 flex items-center gap-1.5">
            <User className="w-4 h-4 text-indigo-400" />
            <span>Nama Pemilik / Brand</span>
          </label>
          <input
            type="text"
            value={data.ownerBrand}
            onChange={(e) => updateData({ ownerBrand: e.target.value })}
            placeholder="Contoh: Vimos / PT Vimos Digital"
            className="w-full bg-[#1e293b] border border-slate-700 focus:border-indigo-500 text-white rounded-xl py-3 px-4 text-sm outline-none transition"
          />
        </div>

        {/* Nomor WhatsApp / HP Pemesanan Toko */}
        <div>
          <label className="block text-xs font-semibold text-slate-200 mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="text-emerald-400 font-bold">💬</span>
              <span>Nomor WhatsApp / HP Toko (Untuk Chat Pembelian) *</span>
            </span>
            <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-medium">
              Otomatis Chat WA
            </span>
          </label>
          <div className="relative">
            <input
              type="tel"
              value={data.whatsappNumber || ''}
              onChange={(e) => updateData({ whatsappNumber: e.target.value })}
              placeholder="Contoh: 081234567890 atau 6281234567890"
              className="w-full bg-[#1e293b] border border-slate-700 focus:border-emerald-500 text-white rounded-xl py-3 px-4 text-sm outline-none transition font-mono"
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Tombol <strong className="text-emerald-400">"Beli Sekarang"</strong> dan checkout keranjang akan langsung membuka chat WhatsApp ke nomor ini beserta rincian nama produk, jumlah & alamat pemesan!
          </p>
        </div>

        {/* Kategori Website */}
        <div>
          <label className="block text-xs font-semibold text-slate-200 mb-2 flex items-center gap-1.5">
            <Tag className="w-4 h-4 text-indigo-400" />
            <span>Kategori Website</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => updateData({ category: cat })}
                className={`py-2.5 px-3 rounded-xl text-xs font-semibold border transition text-center ${
                  data.category === cat
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30'
                    : 'bg-[#1e293b] text-slate-300 border-slate-700/80 hover:border-slate-600'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
