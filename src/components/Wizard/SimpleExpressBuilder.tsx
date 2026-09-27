import React, { useState } from 'react';
import { WizardData, StoreProduct } from '../../types';
import { 
  Sparkles, 
  ShoppingBag, 
  Palette, 
  MessageCircle, 
  Upload, 
  Link2, 
  Plus, 
  Trash2, 
  ArrowRight, 
  Check, 
  RefreshCw,
  Image as ImageIcon
} from 'lucide-react';

interface SimpleExpressBuilderProps {
  data: WizardData;
  updateData: (fields: Partial<WizardData>) => void;
  onStartGenerate: () => void;
  onSwitchToDetailMode: () => void;
  isGenerating: boolean;
}

const QUICK_TYPES = [
  { id: 'Toko Online', label: 'Toko Online', desc: 'Jual produk dengan order via WhatsApp', icon: '🛍️' },
  { id: 'Bisnis / Perusahaan', label: 'Bisnis / Jasa', desc: 'Profil profesional & formulir kontak', icon: '🏢' },
  { id: 'Kuliner & Kafe', label: 'Resto / Kuliner', desc: 'Menu makanan, order chat & lokasi', icon: '☕' },
  { id: 'Portfolio Kreatif', label: 'Portfolio', desc: 'Galeri karya & penawaran jasa', icon: '🎨' },
];

const QUICK_PALETTES = [
  { name: 'Indigo Modern', primary: '#4F46E5', bg: '#0F172A', btn: '#4F46E5' },
  { name: 'Emerald Toko', primary: '#10B981', bg: '#064E3B', btn: '#059669' },
  { name: 'Ocean Blue', primary: '#0284C7', bg: '#0C4A6E', btn: '#0284C7' },
  { name: 'Rose Luxury', primary: '#E11D48', bg: '#1C1917', btn: '#E11D48' },
  { name: 'Amber Warm', primary: '#D97706', bg: '#1E1B18', btn: '#D97706' },
  { name: 'Dark Obsidian', primary: '#6366F1', bg: '#090D16', btn: '#4F46E5' },
];

export const SimpleExpressBuilder: React.FC<SimpleExpressBuilderProps> = ({
  data,
  updateData,
  onStartGenerate,
  onSwitchToDetailMode,
  isGenerating,
}) => {
  const [uploadingHero, setUploadingHero] = useState(false);
  const [uploadingProdId, setUploadingProdId] = useState<string | null>(null);

  // Upload hero banner image
  const handleHeroUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingHero(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        try {
          const res = await fetch('/api/upload-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageBase64: base64 }),
          });
          const resData = await res.json();
          if (resData.success && resData.url) {
            updateData({ media: { ...data.media, heroImageUrl: resData.url } });
          } else {
            updateData({ media: { ...data.media, heroImageUrl: base64 } });
          }
        } catch {
          updateData({ media: { ...data.media, heroImageUrl: base64 } });
        } finally {
          setUploadingHero(false);
        }
      } else {
        setUploadingHero(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Add Product
  const handleAddProduct = () => {
    const prods = data.storeProducts || [];
    const newProd: StoreProduct = {
      id: 'p_' + Date.now(),
      name: `Produk Pilihan ${prods.length + 1}`,
      price: '150.000',
      description: 'Kualitas terbaik dan siap dikirim ke seluruh Indonesia.',
      imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80',
    };
    updateData({ storeProducts: [...prods, newProd] });
  };

  const handleUpdateProduct = (id: string, fields: Partial<StoreProduct>) => {
    const prods = (data.storeProducts || []).map((p) => (p.id === id ? { ...p, ...fields } : p));
    updateData({ storeProducts: prods });
  };

  const handleDeleteProduct = (id: string) => {
    const prods = (data.storeProducts || []).filter((p) => p.id !== id);
    if (prods.length === 0) {
      alert('Minimal toko memiliki 1 produk.');
      return;
    }
    updateData({ storeProducts: prods });
  };

  // Upload product image
  const handleProductUpload = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingProdId(id);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        try {
          const res = await fetch('/api/upload-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageBase64: base64 }),
          });
          const resData = await res.json();
          if (resData.success && resData.url) {
            handleUpdateProduct(id, { imageUrl: resData.url });
          } else {
            handleUpdateProduct(id, { imageUrl: base64 });
          }
        } catch {
          handleUpdateProduct(id, { imageUrl: base64 });
        } finally {
          setUploadingProdId(null);
        }
      } else {
        setUploadingProdId(null);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Intro Simple Banner */}
      <div className="bg-gradient-to-r from-indigo-900/40 via-purple-900/30 to-slate-900 border border-indigo-500/20 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="space-y-1.5 text-center md:text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            Mode Cepat & Praktis (Simple Mode)
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            Buat Website Toko Impian Anda dalam 1 Halaman
          </h2>
          <p className="text-xs text-slate-300 max-w-xl">
            Cukup isi nama toko, nomor WhatsApp pembeli, foto, dan produk. Vimos AI akan merakit website lengkap siap pakai!
          </p>
        </div>

        <button
          type="button"
          onClick={onSwitchToDetailMode}
          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition shrink-0"
        >
          Beralih ke Mode Detail (15 Langkah) →
        </button>
      </div>

      {/* Main Simple Form Card */}
      <div className="bg-[#111827] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-8">
        {/* Section 1: Info & WhatsApp */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider text-indigo-400 flex items-center gap-2">
            <span>1. Informasi Toko / Website</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Nama Website / Toko *
              </label>
              <input
                type="text"
                required
                value={data.siteName}
                onChange={(e) => updateData({ siteName: e.target.value })}
                placeholder="Contoh: Toko Keren Saya"
                className="w-full bg-[#1e293b] border border-slate-700 focus:border-indigo-500 text-white rounded-xl py-3 px-4 text-sm font-semibold outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span className="text-emerald-400 font-bold">💬</span>
                  <span>Nomor WhatsApp Toko (Untuk Chat Pembelian) *</span>
                </span>
                <span className="text-[10px] text-emerald-400 font-mono">Chat Langsung</span>
              </label>
              <input
                type="tel"
                required
                value={data.whatsappNumber || ''}
                onChange={(e) => updateData({ whatsappNumber: e.target.value })}
                placeholder="Contoh: 081234567890 atau 6281234567890"
                className="w-full bg-[#1e293b] border border-slate-700 focus:border-emerald-500 text-white rounded-xl py-3 px-4 text-sm font-mono outline-none"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Tombol beli akan langsung membuka pesan WhatsApp ke nomor ini.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Deskripsi Singkat Toko / Slogan
            </label>
            <input
              type="text"
              value={data.siteDescription}
              onChange={(e) => updateData({ siteDescription: e.target.value })}
              placeholder="Contoh: Menyediakan berbagai busana kekinian kualitas terbaik dan harga terjangkau."
              className="w-full bg-[#1e293b] border border-slate-700 focus:border-indigo-500 text-white rounded-xl py-2.5 px-4 text-xs outline-none"
            />
          </div>
        </div>

        {/* Section 2: Jenis & Warna */}
        <div className="space-y-4 pt-4 border-t border-slate-800">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider text-indigo-400 flex items-center gap-2">
            <span>2. Tipe & Warna Tampilan</span>
          </h3>

          {/* Quick Types */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {QUICK_TYPES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => updateData({ websiteType: t.id })}
                className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between ${
                  data.websiteType === t.id
                    ? 'bg-indigo-600/30 border-indigo-500 text-white shadow-md'
                    : 'bg-[#1e293b] border-slate-700/80 hover:border-slate-600 text-slate-300'
                }`}
              >
                <span className="text-xl mb-1">{t.icon}</span>
                <span className="text-xs font-bold block">{t.label}</span>
                <span className="text-[10px] text-slate-400 line-clamp-1">{t.desc}</span>
              </button>
            ))}
          </div>

          {/* Quick Color Palettes */}
          <div>
            <span className="block text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-indigo-400" />
              <span>Pilihan Palet Warna Cepat</span>
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
              {QUICK_PALETTES.map((pal) => {
                const isSelected = data.colors.primary === pal.primary;
                return (
                  <button
                    key={pal.name}
                    type="button"
                    onClick={() =>
                      updateData({
                        colors: {
                          ...data.colors,
                          primary: pal.primary,
                          button: pal.btn,
                          background: pal.bg,
                        },
                      })
                    }
                    className={`p-2 rounded-xl border text-left transition flex items-center gap-2 ${
                      isSelected
                        ? 'bg-slate-800 border-indigo-500 shadow-md ring-1 ring-indigo-500'
                        : 'bg-[#1e293b] border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <div className="w-4 h-4 rounded-full shrink-0 border border-white/20" style={{ backgroundColor: pal.primary }} />
                    <span className="text-[11px] font-semibold text-white truncate">{pal.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Section 3: Foto Toko / Banner */}
        <div className="space-y-4 pt-4 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider text-indigo-400 flex items-center gap-2">
              <span>3. Foto Utama / Banner Toko</span>
            </h3>
            <span className="text-[10px] text-slate-400">Bisa upload atau tempel link</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
            {/* Thumbnail Preview */}
            <div className="aspect-video rounded-xl bg-slate-900 border border-slate-700 overflow-hidden relative flex items-center justify-center">
              {uploadingHero ? (
                <div className="text-center p-3 text-indigo-400">
                  <RefreshCw className="w-6 h-6 mx-auto mb-1 animate-spin" />
                  <span className="text-[10px] font-semibold">Mengunggah...</span>
                </div>
              ) : data.media?.heroImageUrl ? (
                <>
                  <img src={data.media.heroImageUrl} alt="Banner Toko" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => updateData({ media: { ...data.media, heroImageUrl: '' } })}
                    className="absolute top-2 right-2 p-1 rounded-md bg-rose-600 text-white text-xs"
                    title="Hapus foto"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </>
              ) : (
                <div className="text-center p-3 text-slate-500">
                  <ImageIcon className="w-6 h-6 mx-auto mb-1 opacity-50" />
                  <span className="text-[10px]">Belum ada foto</span>
                </div>
              )}
            </div>

            {/* Inputs */}
            <div className="sm:col-span-2 space-y-3">
              <div className="flex gap-2">
                <label className="flex-1 py-2 px-3 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 rounded-xl text-indigo-300 text-xs font-semibold cursor-pointer flex items-center justify-center gap-1.5 transition">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Foto dari HP / Laptop</span>
                  <input type="file" accept="image/*" onChange={handleHeroUpload} className="hidden" />
                </label>
              </div>

              <div className="flex items-center gap-2 bg-[#1e293b] border border-slate-700 rounded-xl px-3 py-2 text-xs">
                <Link2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <input
                  type="url"
                  value={data.media?.heroImageUrl || ''}
                  onChange={(e) => updateData({ media: { ...data.media, heroImageUrl: e.target.value } })}
                  placeholder="Atau tempel link URL foto langsung (https://...)"
                  className="w-full bg-transparent text-slate-200 outline-none text-xs"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Produk Toko */}
        <div className="space-y-4 pt-4 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider text-indigo-400 flex items-center gap-2">
              <span>4. Katalog Produk Toko ({(data.storeProducts || []).length} Produk)</span>
            </h3>

            <button
              type="button"
              onClick={handleAddProduct}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Produk</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(data.storeProducts || []).map((prod, idx) => (
              <div
                key={prod.id}
                className="p-3.5 rounded-2xl bg-[#1e293b] border border-slate-700 flex gap-3 relative group"
              >
                {/* Product Image */}
                <div className="w-20 h-20 rounded-xl bg-slate-900 border border-slate-700 overflow-hidden shrink-0 relative flex items-center justify-center">
                  {uploadingProdId === prod.id ? (
                    <RefreshCw className="w-4 h-4 text-indigo-400 animate-spin" />
                  ) : prod.imageUrl ? (
                    <img src={prod.imageUrl} alt={prod.name} className="w-full h-full object-cover" />
                  ) : (
                    <ShoppingBag className="w-5 h-5 text-slate-600" />
                  )}

                  <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center text-white cursor-pointer text-[8px] font-bold">
                    <Upload className="w-3.5 h-3.5 mb-0.5" />
                    <span>Ganti Foto</span>
                    <input type="file" accept="image/*" onChange={(e) => handleProductUpload(prod.id, e)} className="hidden" />
                  </label>
                </div>

                {/* Details */}
                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-indigo-400 uppercase">Produk #{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteProduct(prod.id)}
                      className="text-slate-500 hover:text-rose-400 p-0.5"
                      title="Hapus"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>

                  <input
                    type="text"
                    value={prod.name}
                    onChange={(e) => handleUpdateProduct(prod.id, { name: e.target.value })}
                    placeholder="Nama Produk..."
                    className="w-full bg-[#0F172A] border border-slate-700 text-white rounded-lg py-1 px-2 text-xs font-semibold outline-none"
                  />

                  <div className="flex items-center gap-1">
                    <span className="text-[11px] text-emerald-400 font-bold">Rp</span>
                    <input
                      type="text"
                      value={prod.price}
                      onChange={(e) => handleUpdateProduct(prod.id, { price: e.target.value })}
                      placeholder="150.000"
                      className="w-full bg-[#0F172A] border border-slate-700 text-white rounded-lg py-0.5 px-2 text-xs font-mono outline-none"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Generate Button */}
        <div className="pt-6 border-t border-slate-800 space-y-3">
          <button
            type="button"
            onClick={onStartGenerate}
            disabled={isGenerating}
            className="w-full py-4 px-8 bg-gradient-to-r from-emerald-500 via-indigo-600 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-black text-base rounded-2xl shadow-2xl shadow-indigo-500/30 flex items-center justify-center gap-3 transition transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
          >
            <Sparkles className="w-5 h-5 animate-pulse" />
            <span>✨ BUAT WEBSITE SEKARANG (GENERATE AI)</span>
            <ArrowRight className="w-5 h-5" />
          </button>
          <p className="text-center text-[11px] text-slate-400">
            Website akan langsung jadi dalam hitungan detik lengkap dengan foto, tombol WhatsApp, dan keranjang belanja!
          </p>
        </div>
      </div>
    </div>
  );
};
