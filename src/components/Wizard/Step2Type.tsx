import React from 'react';
import { WizardData } from '../../types';
import { 
  ShoppingBag, 
  FileEdit, 
  UserCheck, 
  Building, 
  GraduationCap, 
  UtensilsCrossed, 
  Hotel, 
  Gamepad2, 
  Smartphone, 
  Users, 
  Newspaper, 
  Palette, 
  Briefcase, 
  Globe, 
  Sparkles,
  Check
} from 'lucide-react';

interface Step2Props {
  data: WizardData;
  updateData: (fields: Partial<WizardData>) => void;
}

const websiteTypes = [
  { id: 'Toko Online', label: 'Toko Online', icon: ShoppingBag, desc: 'Katalog produk, keranjang belanja & checkout' },
  { id: 'Blog', label: 'Blog', icon: FileEdit, desc: 'Artikel, kategori, berita & ruang komentar' },
  { id: 'Portfolio', label: 'Portfolio', icon: UserCheck, desc: 'Showcase karya, keahlian & riwayat proyek' },
  { id: 'Company Profile', label: 'Company Profile', icon: Building, desc: 'Profil perusahaan, visi misi & layanan resmi' },
  { id: 'Sekolah', label: 'Sekolah / Edukasi', icon: GraduationCap, desc: 'Informasi akademik, pendaftaran & kegiatan' },
  { id: 'Restaurant', label: 'Restaurant / Kafe', icon: UtensilsCrossed, desc: 'Menu makanan, reservasi meja & promo kuliner' },
  { id: 'Hotel', label: 'Hotel & Penginapan', icon: Hotel, desc: 'Fasilitas kamar, booking & lokasi wisata' },
  { id: 'Gaming', label: 'Gaming & Esports', icon: Gamepad2, desc: 'Komunitas game, turnamen, streaming & tim' },
  { id: 'Landing Page', label: 'Landing Page', icon: Smartphone, desc: 'Fokus konversi tinggi untuk produk atau kampanye' },
  { id: 'Komunitas', label: 'Komunitas', icon: Users, desc: 'Forum perkumpulan, keanggotaan & event kumpul' },
  { id: 'Berita', label: 'Portal Berita', icon: Newspaper, desc: 'Informasi terkini, topik hangat & artikel opini' },
  { id: 'Agency', label: 'Creative Agency', icon: Palette, desc: 'Studi kasus kreatif, branding & layanan digital' },
  { id: 'Jasa', label: 'Penyedia Jasa', icon: Briefcase, desc: 'Layanan profesional, booking konsultasi & klien' },
  { id: 'Custom Website', label: 'Custom Website', icon: Globe, desc: 'Desain bebas disesuaikan dengan permintaan khusus' },
];

export const Step2Type: React.FC<Step2Props> = ({ data, updateData }) => {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="text-center space-y-1.5 mb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          Langkah 2: Model & Jenis Website
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Pilih Jenis Website</h2>
        <p className="text-xs text-slate-400">
          Pilih tipe website yang paling sesuai dengan kebutuhan Anda.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {websiteTypes.map((type) => {
          const Icon = type.icon;
          const isSelected = data.websiteType === type.id;

          return (
            <div
              key={type.id}
              onClick={() => updateData({ websiteType: type.id })}
              className={`p-4 rounded-2xl border cursor-pointer transition-all duration-200 relative group flex items-start gap-3.5 ${
                isSelected
                  ? 'bg-gradient-to-br from-indigo-900/40 via-indigo-950/60 to-purple-950/40 border-indigo-500 shadow-xl shadow-indigo-600/20'
                  : 'bg-[#111827] border-slate-800 hover:border-slate-700 hover:bg-[#1e293b]/60'
              }`}
            >
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                    : 'bg-[#1e293b] text-slate-400 group-hover:text-indigo-400'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className={`text-sm font-bold truncate ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                    {type.label}
                  </h3>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {type.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
