import React, { useState } from 'react';
import { WizardData, StoreProduct } from '../../types';
import { 
  Image as ImageIcon, 
  Sparkles, 
  Check, 
  Link2, 
  Upload, 
  Plus, 
  Trash2, 
  ShoppingBag, 
  MessageCircle, 
  DollarSign, 
  Eye, 
  RefreshCw 
} from 'lucide-react';

interface Step9Props {
  data: WizardData;
  updateData: (fields: Partial<WizardData>) => void;
}

const positionOptions = [
  { id: 'right', label: 'Di Kanan (Samping Teks)', desc: 'Teks hero di kiri, foto toko menawan di kanan' },
  { id: 'left', label: 'Di Kiri (Samping Teks)', desc: 'Foto di kiri, teks hero di kanan' },
  { id: 'center', label: 'Di Tengah Simetris', desc: 'Foto simetris di tengah halaman' },
  { id: 'background', label: 'Background Hero', desc: 'Foto menjadi latar belakang dengan overlay' },
  { id: 'card', label: 'Di Dalam Kartu Modern', desc: 'Terbingkai elegan dalam kartu modern' },
];

const PRESET_STORE_IMAGES = [
  { label: 'Fashion & Pakaian', url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&auto=format&fit=crop&q=80' },
  { label: 'Elektronik & Gadget', url: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=800&auto=format&fit=crop&q=80' },
  { label: 'Makanan & Kuliner', url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80' },
  { label: 'Kosmetik & Skincare', url: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&auto=format&fit=crop&q=80' },
  { label: 'Modern Lifestyle', url: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=800&auto=format&fit=crop&q=80' },
];

export const Step9Media: React.FC<Step9Props> = ({ data, updateData }) => {
  const { media, storeProducts = [] } = data;
  const [storeImageMode, setStoreImageMode] = useState<'link' | 'upload'>('link');
  const [uploadingHero, setUploadingHero] = useState(false);
  const [uploadingProdId, setUploadingProdId] = useState<string | null>(null);

  const updateMedia = <K extends keyof typeof media>(key: K, value: typeof media[K]) => {
    updateData({
      media: {
        ...media,
        [key]: value,
      },
    });
  };

  // Upload handler for Hero/Store Banner
  const handleHeroFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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
            updateMedia('heroImageUrl', resData.url);
          } else {
            updateMedia('heroImageUrl', base64);
          }
        } catch {
          updateMedia('heroImageUrl', base64);
        } finally {
          setUploadingHero(false);
        }
      } else {
        setUploadingHero(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Store Products Management
  const handleAddProduct = () => {
    const newProd: StoreProduct = {
      id: 'prod_' + Date.now(),
      name: `Produk Baru ${storeProducts.length + 1}`,
      price: '150.000',
      description: 'Deskripsi produk kualitas terbaik siap kirim.',
      imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80',
    };
    updateData({ storeProducts: [...storeProducts, newProd] });
  };

  const handleUpdateProduct = (id: string, fields: Partial<StoreProduct>) => {
    const updated = storeProducts.map((p) => (p.id === id ? { ...p, ...fields } : p));
    updateData({ storeProducts: updated });
  };

  const handleDeleteProduct = (id: string) => {
    if (storeProducts.length <= 1) {
      alert('Minimal toko memiliki 1 produk.');
      return;
    }
    const updated = storeProducts.filter((p) => p.id !== id);
    updateData({ storeProducts: updated });
  };

  // Upload handler for individual product
  const handleProductFileUpload = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
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
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-1.5 mb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
          <ImageIcon className="w-3.5 h-3.5" />
          Langkah 9: Gambar Toko & Kelola Produk
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Foto Toko & Katalog Produk</h2>
        <p className="text-xs text-slate-400">
          Upload foto atau masukkan link gambar toko, kelola produk yang dijual, serta hubungkan ke WhatsApp untuk pemesanan langsung.
        </p>
      </div>

      {/* Bagian 1: Pengaturan Foto Utama / Banner Toko */}
      <div className="bg-[#111827] p-6 rounded-2xl border border-slate-800 shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <ImageIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Foto Utama / Banner Toko</h3>
              <p className="text-[11px] text-slate-400">Bisa upload foto toko Anda sendiri atau masukkan link URL</p>
            </div>
          </div>

          {/* Toggle Tab: Link vs Upload */}
          <div className="flex items-center gap-1 bg-[#1e293b] p-1 rounded-xl border border-slate-700 text-xs">
            <button
              type="button"
              onClick={() => setStoreImageMode('link')}
              className={`px-3 py-1 rounded-lg font-semibold flex items-center gap-1.5 transition ${
                storeImageMode === 'link' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Link2 className="w-3.5 h-3.5" />
              <span>Pakai Link URL</span>
            </button>
            <button
              type="button"
              onClick={() => setStoreImageMode('upload')}
              className={`px-3 py-1 rounded-lg font-semibold flex items-center gap-1.5 transition ${
                storeImageMode === 'upload' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Gambar</span>
            </button>
          </div>
        </div>

        {/* Input / Upload area */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-center">
          {/* Preview Box */}
          <div className="relative aspect-video md:aspect-square rounded-xl bg-slate-900 border border-slate-700/80 overflow-hidden flex items-center justify-center group">
            {media.heroImageUrl ? (
              <>
                <img
                  src={media.heroImageUrl}
                  alt="Preview Toko"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => updateMedia('heroImageUrl', '')}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-rose-600/90 text-white opacity-0 group-hover:opacity-100 transition shadow-lg text-xs"
                  title="Hapus foto"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </>
            ) : uploadingHero ? (
              <div className="text-center p-4 text-indigo-400">
                <RefreshCw className="w-7 h-7 mx-auto mb-2 animate-spin" />
                <span className="text-[11px] block font-semibold">Mengunggah foto...</span>
              </div>
            ) : (
              <div className="text-center p-4 text-slate-500">
                <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <span className="text-[11px] block">Belum ada foto</span>
                <span className="text-[10px] text-slate-600">AI akan otomatis memilihkan foto terbaik jika kosong</span>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="md:col-span-2 space-y-4">
            {storeImageMode === 'link' ? (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Link URL Gambar Toko
                </label>
                <input
                  type="url"
                  value={media.heroImageUrl}
                  onChange={(e) => updateMedia('heroImageUrl', e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-[#1e293b] border border-slate-700 focus:border-indigo-500 text-white rounded-xl py-2.5 px-3.5 text-xs outline-none"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Masukkan link foto langsung berformat JPG/PNG/WebP.
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Upload Foto dari Perangkat (HP / Laptop)
                </label>
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-xl p-4 cursor-pointer bg-[#1e293b]/50 hover:bg-[#1e293b] transition">
                  <Upload className="w-6 h-6 text-indigo-400 mb-1" />
                  <span className="text-xs text-slate-300 font-semibold">Klik untuk Pilih File Foto</span>
                  <span className="text-[10px] text-slate-500 mt-0.5">Mendukung format JPG, PNG, WEBP (maks. 5MB)</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleHeroFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            )}

            {/* Rekomendasi Foto Cepat */}
            <div>
              <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">
                Atau pilih foto rekomendasi cepat:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_STORE_IMAGES.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => updateMedia('heroImageUrl', preset.url)}
                    className="px-2.5 py-1 rounded-lg bg-[#1e293b] hover:bg-slate-700 border border-slate-700/80 text-[10px] text-slate-300 hover:text-white transition"
                  >
                    + {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Posisi Gambar Utama */}
        <div className="pt-2 border-t border-slate-800">
          <label className="block text-xs font-semibold text-slate-200 mb-2">
            Posisi Gambar Toko di Halaman Utama
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {positionOptions.map((opt) => {
              const isSelected = media.imagePosition === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => updateMedia('imagePosition', opt.id as any)}
                  className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/20'
                      : 'bg-[#1e293b] border-slate-700/80 hover:border-slate-600 text-slate-300'
                  }`}
                >
                  <span className="text-xs font-bold block">{opt.label}</span>
                  <span className="text-[9px] opacity-75 line-clamp-1">{opt.desc}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bagian 2: Katalog Produk Toko (Bisa Tambah Produk & Edit Gambar Link/Upload) */}
      <div className="bg-[#111827] p-6 rounded-2xl border border-slate-800 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">Katalog Produk Toko ({storeProducts.length} Produk)</h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold flex items-center gap-1">
                  <MessageCircle className="w-3 h-3" />
                  Chat Pembelian ke WhatsApp
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Tambah produk, upload/link foto produk, dan tentukan harga. Pembeli akan langsung chat ke nomor HP Anda!
              </p>
            </div>
          </div>

          {/* Tombol Tambah Produk */}
          <button
            type="button"
            onClick={handleAddProduct}
            className="px-3.5 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 shrink-0 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Produk Baru</span>
          </button>
        </div>

        {/* Informasi WhatsApp Checkout */}
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between gap-3 text-xs text-emerald-300">
          <div className="flex items-center gap-2">
            <span className="text-base">💬</span>
            <span>
              Nomor WhatsApp Penerima Pesanan: <strong className="font-mono text-white">{data.whatsappNumber || '081234567890'}</strong>
            </span>
          </div>
          <span className="text-[10px] text-slate-400 hidden sm:inline">
            (Bisa diubah di Langkah 1: Info)
          </span>
        </div>

        {/* Grid List Produk */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {storeProducts.map((prod, index) => (
            <div
              key={prod.id}
              className="p-4 rounded-xl bg-[#1e293b] border border-slate-700/80 hover:border-slate-600 transition flex flex-col justify-between space-y-3 relative group"
            >
              <div className="flex gap-3">
                {/* Product Image Thumbnail & Upload */}
                <div className="w-24 h-24 rounded-lg bg-slate-900 border border-slate-700 overflow-hidden shrink-0 relative flex items-center justify-center">
                  {uploadingProdId === prod.id ? (
                    <div className="flex flex-col items-center justify-center text-indigo-400 p-2 text-center">
                      <RefreshCw className="w-5 h-5 animate-spin mb-1" />
                      <span className="text-[9px]">Uploading...</span>
                    </div>
                  ) : prod.imageUrl ? (
                    <img
                      src={prod.imageUrl}
                      alt={prod.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ShoppingBag className="w-6 h-6 text-slate-600" />
                  )}

                  {/* Upload overlay */}
                  <label
                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center text-white cursor-pointer text-[9px] font-semibold"
                    title="Upload gambar baru"
                  >
                    <Upload className="w-4 h-4 mb-0.5" />
                    <span>Upload Foto</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleProductFileUpload(prod.id, e)}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Name & Price Inputs */}
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase text-indigo-400">
                      Produk #{index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteProduct(prod.id)}
                      className="text-slate-500 hover:text-rose-400 transition p-1"
                      title="Hapus Produk"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div>
                    <input
                      type="text"
                      value={prod.name}
                      onChange={(e) => handleUpdateProduct(prod.id, { name: e.target.value })}
                      placeholder="Nama Produk..."
                      className="w-full bg-[#0F172A] border border-slate-700 focus:border-indigo-500 text-white rounded-lg py-1.5 px-2.5 text-xs font-semibold outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-emerald-400 font-bold">Rp</span>
                    <input
                      type="text"
                      value={prod.price}
                      onChange={(e) => handleUpdateProduct(prod.id, { price: e.target.value })}
                      placeholder="150.000"
                      className="w-full bg-[#0F172A] border border-slate-700 focus:border-emerald-500 text-white rounded-lg py-1 px-2 text-xs font-mono outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Deskripsi Produk */}
              <div>
                <input
                  type="text"
                  value={prod.description}
                  onChange={(e) => handleUpdateProduct(prod.id, { description: e.target.value })}
                  placeholder="Deskripsi singkat produk..."
                  className="w-full bg-[#0F172A] border border-slate-700 text-slate-300 rounded-lg py-1.5 px-2.5 text-[11px] outline-none"
                />
              </div>

              {/* Image URL Link input option */}
              <div className="flex items-center gap-2 pt-1 border-t border-slate-700/60">
                <Link2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <input
                  type="url"
                  value={prod.imageUrl.startsWith('data:') ? '' : prod.imageUrl}
                  onChange={(e) => handleUpdateProduct(prod.id, { imageUrl: e.target.value })}
                  placeholder={prod.imageUrl.startsWith('data:') ? 'Foto dari Upload (Base64)' : 'Atau tempel link URL foto produk...'}
                  className="flex-1 bg-transparent text-[10px] text-slate-400 placeholder-slate-600 outline-none truncate"
                />
                <label className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer shrink-0 flex items-center gap-1">
                  <Upload className="w-3 h-3" />
                  <span>Upload</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleProductFileUpload(prod.id, e)}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
