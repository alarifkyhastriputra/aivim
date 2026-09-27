import React, { useState } from 'react';
import { UserProfile, WizardData, GeneratedWebsite } from '../../types';
import { WizardProgressBar } from './WizardProgressBar';
import { Step1Info } from './Step1Info';
import { Step2Type } from './Step2Type';
import { Step3Colors } from './Step3Colors';
import { Step4Palette } from './Step4Palette';
import { Step5Layout } from './Step5Layout';
import { Step6HeaderNavbar } from './Step6HeaderNavbar';
import { Step7Sections } from './Step7Sections';
import { Step8Content } from './Step8Content';
import { Step9Media } from './Step9Media';
import { Step10Features } from './Step10Features';
import { Step11Style } from './Step11Style';
import { Step12Typography } from './Step12Typography';
import { Step13Responsive } from './Step13Responsive';
import { Step14AIAssistant } from './Step14AIAssistant';
import { Step15Summary } from './Step15Summary';
import { GenerationLoader } from './GenerationLoader';
import { WebsiteStudio } from './WebsiteStudio';
import { SimpleExpressBuilder } from './SimpleExpressBuilder';
import { saveGeneratedWebsite } from '../../lib/firebase';
import { 
  ArrowLeft, 
  ArrowRight, 
  Sparkles, 
  History, 
  ShieldCheck, 
  LogOut, 
  Coins,
  Sliders,
  Zap,
  Plus
} from 'lucide-react';

interface WizardMasterProps {
  user: UserProfile;
  onOpenAdmin: () => void;
  onOpenProjects: () => void;
  onLogout: () => void;
  loadedWebsite?: GeneratedWebsite | null;
  websites?: GeneratedWebsite[];
  onRefreshWebsites?: () => void;
}

const STEP_TITLES = [
  'Informasi',
  'Tipe Website',
  'Warna',
  'Palet Warna',
  'Layout',
  'Header & Navbar',
  'Bagian (Sections)',
  'Isi Konten',
  'Gambar & Media',
  'Fitur Website',
  'Gaya Desain',
  'Tipografi',
  'Responsive',
  'Asisten AI',
  'Ringkasan',
];

const defaultWizardData: WizardData = {
  siteName: 'Vimos Store',
  siteDescription: 'Toko online yang menjual pakaian modern dengan bahan berkualitas tinggi dan harga terjangkau.',
  ownerBrand: 'Vimos',
  category: 'Toko',
  websiteType: 'Toko Online',
  whatsappNumber: '081234567890',
  storeProducts: [
    {
      id: 'p1',
      name: 'Kaos Polos Oversize Premium',
      price: '129.000',
      description: 'Bahan katun combed 24s adem, jahitan rapi kualitas distro siap pakai.',
      imageUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80',
    },
    {
      id: 'p2',
      name: 'Jaket Hoodie Streetwear',
      price: '249.000',
      description: 'Bahan fleece tebal hangat dengan sablon presisi dan kantong kanguru.',
      imageUrl: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&auto=format&fit=crop&q=80',
    },
    {
      id: 'p3',
      name: 'Celana Chino Slim Fit',
      price: '189.000',
      description: 'Katun twill stretch lentur nyaman dipakai harian kerja atau nongkrong.',
      imageUrl: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800&auto=format&fit=crop&q=80',
    },
  ],
  colors: {
    primary: '#4F46E5',
    secondary: '#1E293B',
    background: '#0F172A',
    text: '#F8FAFC',
    button: '#4F46E5',
    accent: '#06B6D4',
  },
  paletteTheme: 'Modern',
  layout: {
    header: 'logo-left',
    navbar: 'horizontal',
    hero: 'text-left-img-right',
    content: 'grid',
    footer: '3-col',
  },
  headerNavbar: {
    logoType: 'text',
    logoText: 'VIMOS STORE',
    menuItems: ['Home', 'Produk', 'Tentang Kami', 'Kontak'],
    position: 'left',
  },
  sections: [
    { id: 'hero', name: 'Hero Banner', enabled: true, iconName: 'Sparkles' },
    { id: 'products', name: 'Katalog Produk / Layanan', enabled: true, iconName: 'ShoppingBag' },
    { id: 'about', name: 'Tentang Kami', enabled: true, iconName: 'Info' },
    { id: 'testimonials', name: 'Testimoni Pelanggan', enabled: true, iconName: 'Star' },
    { id: 'faq', name: 'Tanya Jawab (FAQ)', enabled: true, iconName: 'HelpCircle' },
    { id: 'contact', name: 'Formulir Kontak', enabled: true, iconName: 'Mail' },
    { id: 'footer', name: 'Footer & Informasi Kontak', enabled: true, iconName: 'Layout' },
  ],
  content: {
    headline: 'Selamat Datang di Vimos Store',
    subheadline: 'Temukan koleksi pakaian dan tren modern terbaik dengan diskon istimewa minggu ini.',
    ctaText: 'Belanja Sekarang',
    aboutUs: 'Vimos Store didirikan untuk menghadirkan produk berkualitas premium dengan pelayanan ramah dan cepat.',
    productServiceHeadline: 'Koleksi Produk Terlaris',
    faqSummary: 'Q: Bagaimana cara pemesanan? A: Langsung klik tombol WhatsApp atau lakukan checkout.',
  },
  media: {
    logoUrl: '',
    heroImageUrl: '',
    bannerUrl: '',
    productImages: [],
    imagePosition: 'right',
  },
  features: [
    'Shopping Cart',
    'Product Filter',
    'WhatsApp Button',
    'Contact Form',
    'FAQ Accordion',
    'Dark Mode',
    'Back To Top',
  ],
  designStyle: 'Modern',
  designSliders: {
    borderRadius: 16,
    shadow: 'medium',
    spacing: 'normal',
    animation: 'smooth',
  },
  typography: {
    fontFamily: 'Plus Jakarta Sans',
    headingSize: 'large',
    bodySize: 'normal',
    fontWeight: 'bold',
    lineHeight: 'normal',
  },
  responsive: {
    mobile: true,
    tablet: true,
    desktop: true,
  },
  specialRequest: '',
};

export const WizardMaster: React.FC<WizardMasterProps> = ({
  user,
  onOpenAdmin,
  onOpenProjects,
  onLogout,
  loadedWebsite,
  websites = [],
  onRefreshWebsites,
}) => {
  const [builderMode, setBuilderMode] = useState<'simple' | 'detail'>('simple');
  const [currentStep, setCurrentStep] = useState(1);
  const [wizardData, setWizardData] = useState<WizardData>(defaultWizardData);

  // Studio / Generated State
  const [generatedHtml, setGeneratedHtml] = useState<string | null>(loadedWebsite ? loadedWebsite.html : null);
  const [generatedTitle, setGeneratedTitle] = useState(loadedWebsite ? loadedWebsite.title : 'My Vimos Website');
  const [isGenerating, setIsGenerating] = useState(false);
  const [genStage, setGenStage] = useState('');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  const updateData = (fields: Partial<WizardData>) => {
    setWizardData((prev) => ({ ...prev, ...fields }));
  };

  const handleNext = () => {
    if (currentStep < 15) {
      setCurrentStep((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleResetToNew = () => {
    if (confirm('Mulai membuat website baru? Pengaturan saat ini akan dikembalikan ke awal.')) {
      setWizardData(defaultWizardData);
      setGeneratedHtml(null);
      setCurrentStep(1);
    }
  };

  const handleStartGenerate = async () => {
    setIsGenerating(true);
    setGenError(null);
    setElapsedSeconds(0);
    setGenStage('Menganalisis konsep & preferensi...');

    // Live elapsed timer
    const intervalTimer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    try {
      const res = await fetch('/api/generate-wizard-website', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(wizardData),
      });

      const data = await res.json();
      clearInterval(intervalTimer);

      if (data.success && data.html) {
        setGenStage('Website selesai!');
        const finalTitle = data.title || wizardData.siteName || 'Vimos Website';

        // Auto-save to History so user never loses created websites
        try {
          await saveGeneratedWebsite({
            title: finalTitle,
            prompt: `${wizardData.siteName} (${wizardData.websiteType}) - ${wizardData.siteDescription}`,
            category: wizardData.category || 'Toko Online',
            style: wizardData.designStyle || 'Modern',
            html: data.html,
            authorId: user.uid,
            authorEmail: user.email,
          });
          if (onRefreshWebsites) {
            onRefreshWebsites();
          }
        } catch (saveErr) {
          console.warn('Auto-save error:', saveErr);
        }

        // Brief transition to let the user see the success checkmark
        setTimeout(() => {
          setGeneratedHtml(data.html);
          setGeneratedTitle(finalTitle);
          setIsGenerating(false);
        }, 700);
      } else {
        setGenError(data.error || 'Server AI sedang sibuk. Silakan coba kembali.');
      }
    } catch (err: any) {
      clearInterval(intervalTimer);
      console.error('Generation error:', err);
      setGenError(err?.message || 'Terjadi masalah koneksi ke server AI.');
    }
  };

  const handleSaveToProjects = async () => {
    if (!generatedHtml) return;
    setIsSaving(true);
    try {
      await saveGeneratedWebsite({
        title: generatedTitle,
        prompt: `${wizardData.siteName} (${wizardData.websiteType}) - ${wizardData.siteDescription}`,
        category: wizardData.category,
        style: wizardData.designStyle,
        html: generatedHtml,
        authorId: user.uid,
        authorEmail: user.email,
      });
      if (onRefreshWebsites) onRefreshWebsites();
      alert('Website berhasil disimpan ke menu Riwayat Web!');
    } catch (err: any) {
      alert('Gagal menyimpan website: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Main Navigation Header */}
      <header className="sticky top-0 z-40 bg-[#0B0F19]/95 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 py-2.5 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-cyan-400 p-0.5 shadow-lg shadow-indigo-500/20 shrink-0">
            <div className="w-full h-full bg-[#0B0F19] rounded-[10px] flex items-center justify-center text-indigo-400 font-black text-lg tracking-tighter">
              v
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg sm:text-xl tracking-tight text-white">
                vimos<span className="text-indigo-400">.ai</span>
              </span>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-semibold">
                Store & Web Builder
              </span>
            </div>
            <span className="text-[10px] text-slate-400 hidden sm:block -mt-0.5">
              Simpel & Praktis • Otomatis Order via WhatsApp
            </span>
          </div>
        </div>

        {/* Center: Mode Switcher (Simple vs Detail) - only when not in studio */}
        {!generatedHtml && (
          <div className="flex items-center bg-[#1e293b]/80 p-1 rounded-xl border border-slate-700/80 text-xs">
            <button
              type="button"
              onClick={() => setBuilderMode('simple')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition ${
                builderMode === 'simple'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              <span>Mode Simple</span>
            </button>
            <button
              type="button"
              onClick={() => setBuilderMode('detail')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition ${
                builderMode === 'detail'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Mode Detail (15 Step)</span>
              <span className="sm:hidden">Detail</span>
            </button>
          </div>
        )}

        {/* Right Nav */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* New Website Button */}
          {!generatedHtml && (
            <button
              type="button"
              onClick={handleResetToNew}
              className="hidden lg:flex px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold items-center gap-1 border border-slate-700 transition"
              title="Mulai Baru"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Buat Baru</span>
            </button>
          )}

          {/* Riwayat Pembuatan Web (History) */}
          <button
            onClick={onOpenProjects}
            className="px-3 py-1.5 bg-gradient-to-r from-indigo-900/40 to-slate-800 hover:bg-indigo-900/60 text-slate-200 hover:text-white rounded-xl border border-indigo-500/30 text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
            title="Buka Riwayat Pembuatan Website"
          >
            <History className="w-4 h-4 text-indigo-400" />
            <span>Riwayat Web</span>
            {websites.length > 0 && (
              <span className="px-1.5 py-0.2 bg-indigo-500 text-white rounded-full text-[10px] font-bold">
                {websites.length}
              </span>
            )}
          </button>

          {/* Admin GUI for Super Admin */}
          {user.role === 'admin' && (
            <button
              onClick={onOpenAdmin}
              className="px-2.5 py-1.5 bg-gradient-to-r from-amber-500/20 to-indigo-500/20 hover:from-amber-500/30 hover:to-indigo-500/30 text-amber-300 rounded-xl border border-amber-500/40 text-xs font-bold flex items-center gap-1.5 shadow-md shadow-amber-500/10 transition"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Admin GUI</span>
            </button>
          )}

          {/* User info & Signout */}
          <div className="flex items-center gap-2 border-l border-slate-800 pl-2">
            <button
              onClick={onLogout}
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition"
              title="Keluar"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Render Website Studio if generated, else render Builder */}
      {generatedHtml ? (
        <WebsiteStudio
          htmlCode={generatedHtml}
          onUpdateHtml={(newHtml) => setGeneratedHtml(newHtml)}
          title={generatedTitle}
          onBackToWizard={() => setGeneratedHtml(null)}
          onSaveToProjects={handleSaveToProjects}
          isSaving={isSaving}
        />
      ) : builderMode === 'simple' ? (
        <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6">
          {genError && (
            <div className="max-w-2xl mx-auto mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs leading-relaxed">
              {genError}
            </div>
          )}

          <SimpleExpressBuilder
            data={wizardData}
            updateData={updateData}
            onStartGenerate={handleStartGenerate}
            onSwitchToDetailMode={() => setBuilderMode('detail')}
            isGenerating={isGenerating}
          />
        </main>
      ) : (
        <div className="flex-1 flex flex-col">
          {/* Top Progress Bar */}
          <WizardProgressBar
            currentStep={currentStep}
            totalSteps={15}
            stepTitles={STEP_TITLES}
            onStepClick={(stepIdx) => setCurrentStep(stepIdx)}
          />

          {/* Main Step Content Area */}
          <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
            {genError && (
              <div className="max-w-2xl mx-auto mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs leading-relaxed">
                {genError}
              </div>
            )}

            {currentStep === 1 && <Step1Info data={wizardData} updateData={updateData} />}
            {currentStep === 2 && <Step2Type data={wizardData} updateData={updateData} />}
            {currentStep === 3 && <Step3Colors data={wizardData} updateData={updateData} />}
            {currentStep === 4 && <Step4Palette data={wizardData} updateData={updateData} />}
            {currentStep === 5 && <Step5Layout data={wizardData} updateData={updateData} />}
            {currentStep === 6 && <Step6HeaderNavbar data={wizardData} updateData={updateData} />}
            {currentStep === 7 && <Step7Sections data={wizardData} updateData={updateData} />}
            {currentStep === 8 && <Step8Content data={wizardData} updateData={updateData} />}
            {currentStep === 9 && <Step9Media data={wizardData} updateData={updateData} />}
            {currentStep === 10 && <Step10Features data={wizardData} updateData={updateData} />}
            {currentStep === 11 && <Step11Style data={wizardData} updateData={updateData} />}
            {currentStep === 12 && <Step12Typography data={wizardData} updateData={updateData} />}
            {currentStep === 13 && <Step13Responsive data={wizardData} updateData={updateData} />}
            {currentStep === 14 && <Step14AIAssistant data={wizardData} updateData={updateData} />}
            {currentStep === 15 && (
              <Step15Summary
                data={wizardData}
                onGoToStep={(stepNum) => setCurrentStep(stepNum)}
                onStartGenerate={handleStartGenerate}
                isGenerating={isGenerating}
              />
            )}
          </main>

          {/* Bottom Fixed Navigation Actions Footer */}
          <footer className="sticky bottom-0 bg-[#0B0F19]/95 backdrop-blur-md border-t border-slate-800 p-4 z-20">
            <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={handlePrev}
                disabled={currentStep === 1}
                className="px-5 py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-2 transition disabled:opacity-30 disabled:hover:bg-slate-800"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Sebelumnya</span>
              </button>

              <div className="text-xs text-slate-500 font-mono hidden sm:block">
                Langkah {currentStep} dari 15
              </div>

              {currentStep < 15 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-500/25 transition"
                >
                  <span>Lanjut</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleStartGenerate}
                  disabled={isGenerating}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/25 transition disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Website</span>
                </button>
              )}
            </div>
          </footer>
        </div>
      )}

      {/* Generation Loader Modal (Step 16) */}
      {isGenerating && (
        <GenerationLoader
          currentStage={genStage}
          elapsedSeconds={elapsedSeconds}
          error={genError}
          onRetry={handleStartGenerate}
          onCancel={() => {
            setIsGenerating(false);
            setGenError(null);
          }}
        />
      )}
    </div>
  );
};
