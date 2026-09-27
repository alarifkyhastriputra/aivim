import React from 'react';
import { WizardData } from '../../types';
import { 
  Sparkles, 
  Edit3, 
  Building2, 
  Palette, 
  Layout, 
  Layers, 
  Wand2, 
  Cpu, 
  Smartphone, 
  CheckCircle2,
  ArrowRight
} from 'lucide-react';

interface Step15Props {
  data: WizardData;
  onGoToStep: (stepNumber: number) => void;
  onStartGenerate: () => void;
  isGenerating: boolean;
}

export const Step15Summary: React.FC<Step15Props> = ({
  data,
  onGoToStep,
  onStartGenerate,
  isGenerating,
}) => {
  const enabledSections = data.sections.filter((s) => s.enabled).map((s) => s.name);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="text-center space-y-1.5 mb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Langkah 15: Ringkasan & Konfirmasi
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Ringkasan Konfigurasi Website</h2>
        <p className="text-xs text-slate-400">
          Periksa seluruh pengaturan yang telah Anda pilih. Klik tombol Edit jika ingin mengubah langkah tertentu.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. Informasi & Jenis */}
        <div className="bg-[#111827] p-5 rounded-2xl border border-slate-800 space-y-3 relative group">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-indigo-400" />
              <span>Identitas & Tipe Website</span>
            </h3>
            <button
              type="button"
              onClick={() => onGoToStep(1)}
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>
          </div>

          <div className="space-y-1.5 text-xs text-slate-300">
            <div><span className="text-slate-500">Nama:</span> <strong className="text-white">{data.siteName || 'Vimos Store'}</strong></div>
            <div><span className="text-slate-500">Tipe:</span> <span className="px-2 py-0.5 rounded bg-indigo-600/30 text-indigo-300 font-semibold">{data.websiteType}</span></div>
            <div><span className="text-slate-500">Kategori:</span> {data.category}</div>
            <div><span className="text-slate-500">Brand / Pemilik:</span> {data.ownerBrand || '-'}</div>
          </div>
        </div>

        {/* 2. Warna & Palet */}
        <div className="bg-[#111827] p-5 rounded-2xl border border-slate-800 space-y-3 relative group">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Palette className="w-4 h-4 text-indigo-400" />
              <span>Warna & Palet ({data.paletteTheme})</span>
            </h3>
            <button
              type="button"
              onClick={() => onGoToStep(3)}
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <div className="flex items-center gap-1.5 bg-[#1e293b] px-2 py-1 rounded-lg">
              <div className="w-4 h-4 rounded-md border" style={{ backgroundColor: data.colors.primary }} />
              <span className="text-[10px] font-mono text-slate-300">{data.colors.primary}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-[#1e293b] px-2 py-1 rounded-lg">
              <div className="w-4 h-4 rounded-md border" style={{ backgroundColor: data.colors.button }} />
              <span className="text-[10px] font-mono text-slate-300">{data.colors.button}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-[#1e293b] px-2 py-1 rounded-lg">
              <div className="w-4 h-4 rounded-md border" style={{ backgroundColor: data.colors.background }} />
              <span className="text-[10px] font-mono text-slate-300">{data.colors.background}</span>
            </div>
          </div>
        </div>

        {/* 3. Struktur Layout */}
        <div className="bg-[#111827] p-5 rounded-2xl border border-slate-800 space-y-3 relative group">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Layout className="w-4 h-4 text-indigo-400" />
              <span>Struktur Layout</span>
            </h3>
            <button
              type="button"
              onClick={() => onGoToStep(5)}
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>
          </div>

          <div className="space-y-1 text-xs text-slate-300">
            <div><span className="text-slate-500">Header:</span> {data.layout.header}</div>
            <div><span className="text-slate-500">Navbar:</span> {data.layout.navbar}</div>
            <div><span className="text-slate-500">Hero Layout:</span> {data.layout.hero}</div>
            <div><span className="text-slate-500">Konten Grid:</span> {data.layout.content}</div>
          </div>
        </div>

        {/* 4. Bagian (Sections) */}
        <div className="bg-[#111827] p-5 rounded-2xl border border-slate-800 space-y-3 relative group">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-indigo-400" />
              <span>Urutan Bagian ({enabledSections.length} Bagian Aktif)</span>
            </h3>
            <button
              type="button"
              onClick={() => onGoToStep(7)}
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {enabledSections.map((sec, i) => (
              <span key={i} className="px-2 py-0.5 rounded-md bg-[#1e293b] border border-slate-700 text-[11px] text-slate-300">
                {i + 1}. {sec}
              </span>
            ))}
          </div>
        </div>

        {/* 5. Fitur Interaktif */}
        <div className="bg-[#111827] p-5 rounded-2xl border border-slate-800 space-y-3 relative group">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-indigo-400" />
              <span>Fitur yang Diaktifkan ({data.features.length})</span>
            </h3>
            <button
              type="button"
              onClick={() => onGoToStep(10)}
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {data.features.map((feat, i) => (
              <span key={i} className="px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[11px] text-indigo-300 font-medium">
                ✓ {feat}
              </span>
            ))}
          </div>
        </div>

        {/* 6. Gaya & Tipografi */}
        <div className="bg-[#111827] p-5 rounded-2xl border border-slate-800 space-y-3 relative group">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-indigo-400" />
              <span>Gaya, Font & Responsive</span>
            </h3>
            <button
              type="button"
              onClick={() => onGoToStep(11)}
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>
          </div>

          <div className="space-y-1 text-xs text-slate-300">
            <div><span className="text-slate-500">Gaya Desain:</span> {data.designStyle} (R: {data.designSliders.borderRadius}px)</div>
            <div><span className="text-slate-500">Font:</span> {data.typography.fontFamily}</div>
            <div><span className="text-slate-500">Optimasi:</span> Mobile, Tablet, Desktop (100% Aktif)</div>
          </div>
        </div>

        {/* 7. WhatsApp & Katalog Produk Toko */}
        <div className="bg-[#111827] p-5 rounded-2xl border border-emerald-500/30 md:col-span-2 space-y-3 relative group bg-gradient-to-r from-emerald-950/20 to-slate-900">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
              <span className="text-base">💬</span>
              <span>Pemesanan Toko via WhatsApp & Katalog Produk</span>
            </h3>
            <button
              type="button"
              onClick={() => onGoToStep(9)}
              className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-semibold"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Kelola Produk</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-300">
            <div className="bg-[#1e293b]/70 p-3 rounded-xl border border-slate-700">
              <span className="text-slate-400 text-[11px] block">Nomor WhatsApp Toko:</span>
              <strong className="text-white font-mono text-sm">{data.whatsappNumber || '081234567890'}</strong>
            </div>
            <div className="bg-[#1e293b]/70 p-3 rounded-xl border border-slate-700">
              <span className="text-slate-400 text-[11px] block">Jumlah Produk Toko:</span>
              <strong className="text-white text-sm">{data.storeProducts?.length || 3} Produk Siap Jual</strong>
            </div>
            <div className="bg-[#1e293b]/70 p-3 rounded-xl border border-slate-700">
              <span className="text-slate-400 text-[11px] block">Format Pemesanan:</span>
              <span className="text-emerald-300 text-xs font-semibold">Otomatis Chat WA + Detail Pesanan</span>
            </div>
          </div>
        </div>
      </div>

      {/* Big Action Button to Generate */}
      <div className="pt-4">
        <button
          type="button"
          onClick={onStartGenerate}
          disabled={isGenerating}
          className="w-full py-4 px-8 bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 hover:from-indigo-600 hover:to-cyan-500 text-white font-extrabold text-base rounded-2xl shadow-2xl shadow-indigo-500/30 flex items-center justify-center gap-3 transition transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
        >
          <Sparkles className="w-5 h-5 animate-pulse" />
          <span>✨ GENERATE WEBSITE DENGAN VIMOS AI</span>
          <ArrowRight className="w-5 h-5" />
        </button>
        <p className="text-center text-[11px] text-slate-400 mt-2">
          Vimos AI akan mengompilasi seluruh konfigurasi menjadi satu file HTML siap pakai.
        </p>
      </div>
    </div>
  );
};
