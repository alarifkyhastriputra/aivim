import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '25mb' }));

// Ensure public uploads directory exists and is statically served
const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Image Upload Endpoint
app.post('/api/upload-image', (req: Request, res: Response) => {
  try {
    const { imageBase64 } = req.body;
    if (!imageBase64) {
      res.status(400).json({ error: 'No image provided' });
      return;
    }

    const matches = imageBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    let ext = 'jpg';
    let dataBuffer: Buffer;

    if (matches && matches.length === 3) {
      const mime = matches[1];
      if (mime.includes('png')) ext = 'png';
      else if (mime.includes('webp')) ext = 'webp';
      else if (mime.includes('gif')) ext = 'gif';
      else if (mime.includes('svg')) ext = 'svg';
      dataBuffer = Buffer.from(matches[2], 'base64');
    } else {
      dataBuffer = Buffer.from(imageBase64, 'base64');
    }

    const safeFilename = `img_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
    const filePath = path.join(uploadsDir, safeFilename);
    fs.writeFileSync(filePath, dataBuffer);

    // Return the clean public URL
    const publicUrl = `/uploads/${safeFilename}`;
    console.log(`[vimos.ai] Uploaded image saved: ${publicUrl} (${dataBuffer.length} bytes)`);
    res.json({ success: true, url: publicUrl });
  } catch (err: any) {
    console.error('Image upload error:', err);
    res.status(500).json({ error: err?.message || 'Failed to upload image' });
  }
});

// Initialize Google GenAI SDK (Server-Side)
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Templates endpoint
app.get('/api/templates', (_req: Request, res: Response) => {
  const templates = [
    {
      id: 'saas-dark',
      title: 'SaaS AI Platform',
      category: 'SaaS / AI',
      style: 'Modern Tech Dark',
      description: 'Futuristic AI SaaS landing page with animated hero glowing gradients, pricing tiers, and live feature showcase.',
      prompt: 'Build a high-converting dark-mode landing page for an AI Automation SaaS named "Vortex AI". Include hero banner with call to action, interactive feature tabs, pricing plan cards with annual discount toggle, client logos, testmonials carousel, and contact footer.',
      iconName: 'Zap'
    },
    {
      id: 'ecommerce-fashion',
      title: 'Luxe Fashion Store',
      category: 'E-Commerce',
      style: 'Luxury Minimal',
      description: 'Elegant fashion brand homepage with product grid, interactive cart slide-over, filter badges, and hero slider.',
      prompt: 'Create a luxury high-end fashion e-commerce storefront called "AURA Atelier". Minimalist beige and obsidian aesthetic, hero video placeholder with clean copy, trending products grid with hover quick-add buttons, lookbook section, customer reviews, and newsletter subscription form.',
      iconName: 'ShoppingBag'
    },
    {
      id: 'creative-portfolio',
      title: 'Designer Portfolio',
      category: 'Portfolio',
      style: 'Creative Gradient',
      description: 'Interactive portfolio for UI/UX designers or developers with project filter, smooth animations, and bio.',
      prompt: 'Design a sleek creative portfolio for a Senior Product Designer named "Alex Rivera". Dark aesthetic with vibrant cyan and violet neon accents, project filterable grid (Web, Mobile, Branding), interactive case study modal triggers, skills radar section, work experience timeline, and contact form.',
      iconName: 'Briefcase'
    },
    {
      id: 'restaurant-bistro',
      title: 'Gourmet Bistro & Bar',
      category: 'Restaurant',
      style: 'Warm Elegant',
      description: 'Sophisticated restaurant website with online reservation modal, interactive food menu tabs, and map section.',
      prompt: 'Build a warm, appetizing website for "Lumière French Bistro". Deep charcoal and amber gold theme, interactive food & wine menu with category tabs (Appetizers, Mains, Desserts, Cocktails), table reservation form, chef profile, gallery grid, and location details.',
      iconName: 'Utensils'
    },
    {
      id: 'mobile-app-showcase',
      title: 'FitPulse Mobile App',
      category: 'Mobile App',
      style: 'Clean Corporate',
      description: 'High-converting mobile app showcase page with app store buttons, device mockups, and feature callouts.',
      prompt: 'Create a landing page for "FitPulse AI" fitness tracking mobile app. Include phone mockup visuals, App Store and Play Store badges, interactive feature cards (AI Workout Plans, Live Calorie Counter, Social Challenges), user stats counters, FAQ accordion, and download CTA.',
      iconName: 'Smartphone'
    },
    {
      id: 'agency-digital',
      title: 'Nexus Digital Agency',
      category: 'Agency',
      style: 'Cyberpunk Neon',
      description: 'Bold creative digital agency website with client case studies, service cards, and interactive quote calculator.',
      prompt: 'Build a high-energy digital agency website called "Nexus Creative". Dark mode with neon emerald and purple accents, hero section with animated particle effect feel, services grid (Web Dev, AI Integration, Brand Strategy), interactive project cost estimator widget, team section, and contact form.',
      iconName: 'LayoutGrid'
    }
  ];

  res.json({ templates });
});

// Robust generation helper with automatic fallback and smart quota handling
async function generateWithFallback(options: {
  contents: string;
  systemInstruction: string;
  temperature?: number;
}) {
  // Use gemini-3.1-flash-lite first for rapid response and independent quota,
  // with fallback to gemini-3.8-flash
  const candidateModels = [
    'gemini-3.1-flash-lite',
    'gemini-3.8-flash',
  ];

  let lastError: any = null;

  for (const model of candidateModels) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        console.log(`[vimos.ai] Requesting generation from model: ${model} (attempt ${attempt + 1})`);
        const response = await ai.models.generateContent({
          model,
          contents: options.contents,
          config: {
            systemInstruction: options.systemInstruction,
            temperature: options.temperature ?? 0.7,
          },
        });

        if (response.text) {
          return { text: response.text, modelUsed: model };
        }
      } catch (err: any) {
        lastError = err;
        const msg = String(err?.message || '');
        const isQuotaExceeded = err?.status === 429 || msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('Quota exceeded');
        const isTransient503 = err?.status === 503 || msg.includes('503') || msg.includes('high demand') || msg.includes('UNAVAILABLE');
        
        console.warn(`[vimos.ai] Model ${model} encountered error:`, msg.substring(0, 150));

        // If quota exceeded, do NOT retry this model. Move immediately to next model
        if (isQuotaExceeded) {
          break;
        }

        // For temporary 503 high demand, quick retry once
        if (isTransient503 && attempt === 0) {
          await new Promise((r) => setTimeout(r, 1000));
          continue;
        }

        // Otherwise move to next candidate model
        break;
      }
    }
  }

  throw lastError || new Error('Server AI sedang mengalami lonjakan kuota. Sistem otomatis menggunakan synthesizer cadangan.');
}

// Endpoint to suggest content with AI based on site info
app.post('/api/ai-suggest-content', async (req: Request, res: Response) => {
  try {
    const { siteName, siteDescription, websiteType, category } = req.body;

    const systemInstruction = `You are a professional Indonesian copywriter and marketing strategist at vimos.ai.
Your job is to generate compelling, high-converting Indonesian website copy based on the user's business concept.
Return ONLY valid JSON (no markdown triple backticks) matching this structure:
{
  "headline": "Catchy Indonesian headline",
  "subheadline": "Persuasive subheadline explaining value",
  "ctaText": "Short compelling CTA button text",
  "aboutUs": "2-3 sentences about the business story and mission",
  "productServiceHeadline": "Headline for products or services section",
  "faqSummary": "3 common Q&A pairs (e.g. Q: ... A: ...)"
}`;

    const userMessage = `Business Name: ${siteName || 'Vimos Store'}
Description: ${siteDescription || 'Bisnis modern terpercaya'}
Website Type: ${websiteType || 'Toko Online'}
Category: ${category || 'Bisnis'}`;

    const genResult = await generateWithFallback({
      systemInstruction,
      contents: userMessage,
      temperature: 0.7,
    });

    let text = genResult.text || '{}';
    text = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
    
    try {
      const parsed = JSON.parse(text);
      res.json({ success: true, content: parsed });
    } catch {
      res.json({
        success: true,
        content: {
          headline: `Solusi Terbaik Bersama ${siteName || 'Kami'}`,
          subheadline: siteDescription || 'Kualitas premium dengan pelayanan terbaik untuk kepuasan Anda.',
          ctaText: 'Mulai Sekarang',
          aboutUs: `${siteName || 'Kami'} berdedikasi menghadirkan produk dan layanan terbaik dengan standar keunggulan tinggi dan inovasi terdepan.`,
          productServiceHeadline: 'Pilihan Produk & Layanan Unggulan',
          faqSummary: 'Q: Bagaimana cara pemesanan? A: Anda dapat langsung menghubungi kami melalui WhatsApp atau formulir pemesanan.'
        }
      });
    }
  } catch (error: any) {
    console.error('API /api/ai-suggest-content error:', error);
    res.status(500).json({ error: error?.message || 'Gagal menghasilkan konten AI' });
  }
});

// Comprehensive Wizard Website Generation Endpoint
app.post('/api/generate-wizard-website', async (req: Request, res: Response) => {
  try {
    const wizardData = req.body;
    if (!wizardData) {
      res.status(400).json({ error: 'Wizard data is required' });
      return;
    }

    const {
      siteName,
      siteDescription,
      ownerBrand,
      category,
      websiteType,
      whatsappNumber,
      storeProducts,
      colors,
      paletteTheme,
      layout,
      headerNavbar,
      sections,
      content,
      media,
      features,
      designStyle,
      designSliders,
      typography,
      responsive,
      specialRequest
    } = wizardData;

    const enabledSections = (sections || [])
      .filter((s: any) => s.enabled)
      .map((s: any) => s.name);

    const cleanWa = (whatsappNumber || '081234567890').replace(/[^0-9]/g, '').replace(/^0/, '62');

    const systemInstruction = `You are the lead AI Frontend Engineer and Designer at vimos.ai.
You generate COMPLETE, PRODUCTION-READY, FULLY FUNCTIONAL single-file websites containing HTML, embedded CSS (with Tailwind CSS), and embedded JavaScript.

CRITICAL INSTRUCTIONS FOR GENERATING THE CODE:
1. Return ONLY the complete HTML5 document starting with <!DOCTYPE html> and ending with </html>.
2. Do NOT wrap output inside markdown code blocks (NO \`\`\`html or \`\`\`).
3. Include Tailwind CSS CDN directly in the <head>:
   <script src="https://cdn.tailwindcss.com"></script>
4. Include FontAwesome 6 icons via CDN:
   <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
5. Include Google Fonts matching requested typography:
   <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Inter:wght@400;600;700;800&family=Playfair+Display:wght@500;700;900&family=Poppins:wght@400;600;700&family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">
6. STRICT COLOR SPECIFICATIONS:
   - Primary: ${colors?.primary || '#3B82F6'}
   - Secondary: ${colors?.secondary || '#1E293B'}
   - Background: ${colors?.background || '#0F172A'}
   - Text: ${colors?.text || '#FFFFFF'}
   - Button Color: ${colors?.button || '#3B82F6'}
   - Accent: ${colors?.accent || '#6366F1'}
   You MUST apply these colors across the website using inline styles or Tailwind custom classes/variables so the website visually honors the exact color scheme chosen by the customer.
7. SECTION ARCHITECTURE:
   Render ONLY the following sections in this EXACT ordered sequence:
   ${enabledSections.length > 0 ? enabledSections.join(' -> ') : 'Hero -> About -> Products/Services -> Testimonials -> Contact -> Footer'}
   Do not omit any requested section.
8. CRITICAL STORE & WHATSAPP PURCHASING FEATURE:
   - Store WhatsApp phone number: ${whatsappNumber || '081234567890'} (International format: ${cleanWa})
   - ALL product cards MUST include a prominent button "Beli via WhatsApp" (with fa-brands fa-whatsapp icon) that opens:
     window.open('https://wa.me/${cleanWa}?text=' + encodeURIComponent('Halo ${siteName || 'Toko'}, saya ingin membeli: ' + productName + ' (Rp ' + productPrice + '). Apakah stok masih tersedia?'), '_blank')
   - Also include a shopping cart slideover/modal where clicking "Checkout via WhatsApp" opens WhatsApp to ${cleanWa} with the complete order breakdown!
   - Floating WhatsApp button at the bottom-right linking directly to https://wa.me/${cleanWa}.
9. INTERACTIVE JAVASCRIPT:
   Embed realistic and functional JavaScript inside a <script> tag before </body>:
   - WhatsApp product purchase function and cart checkout.
   ${(features || []).includes('Shopping Cart') ? '- Interactive Shopping Cart slideover with Add to Cart counter, remove item, and WhatsApp checkout summary.' : ''}
   ${(features || []).includes('Product Filter') ? '- Category tab filter buttons that show/hide items dynamically.' : ''}
   ${(features || []).includes('Search') ? '- Search bar input with live keyword filtering.' : ''}
   ${(features || []).includes('FAQ Accordion') ? '- Interactive smooth accordion collapse/expand toggles.' : ''}
   ${(features || []).includes('Dark Mode') ? '- Dark/Light theme toggle button.' : ''}
   ${(features || []).includes('Back To Top') ? '- Back to top floating button that appears on scroll.' : ''}
   ${(features || []).includes('Contact Form') ? '- Interactive form submission with success feedback toast modal.' : ''}
   - Mobile hamburger menu open/close toggle.
   - Smooth scroll for navbar navigation links.
10. DESIGN & SLIDERS:
   - Border Radius: ${designSliders?.borderRadius || 16}px (apply to buttons, cards, containers)
   - Shadow Level: ${designSliders?.shadow || 'medium'}
   - Spacing: ${designSliders?.spacing || 'normal'}
   - Design Aesthetic: ${designStyle || 'Modern'} (${paletteTheme || 'Modern'} palette)
11. RESPONSIVE DESIGN:
   Optimized for mobile-first with clean breakpoints (sm:, md:, lg:) ensuring 100% viewport usability.`;

    const saveIfBase64 = (imgStr: string | undefined): string => {
      if (!imgStr) return '';
      if (!imgStr.startsWith('data:')) return imgStr;
      try {
        const matches = imgStr.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        let ext = 'jpg';
        let dataBuffer: Buffer;
        if (matches && matches.length === 3) {
          const mime = matches[1];
          if (mime.includes('png')) ext = 'png';
          else if (mime.includes('webp')) ext = 'webp';
          dataBuffer = Buffer.from(matches[2], 'base64');
        } else {
          dataBuffer = Buffer.from(imgStr, 'base64');
        }
        const safeName = `img_auto_${Date.now()}_${Math.random().toString(36).substring(2, 6)}.${ext}`;
        fs.writeFileSync(path.join(uploadsDir, safeName), dataBuffer);
        return `/uploads/${safeName}`;
      } catch (e) {
        console.warn('Failed to convert base64 image:', e);
        return imgStr;
      }
    };

    const processedHeroImg = saveIfBase64(media?.heroImageUrl) || media?.heroImageUrl || '';
    const processedProducts = (storeProducts && storeProducts.length > 0 ? storeProducts : [
      { name: 'Kaos Polos Oversize Premium', price: '129.000', description: 'Katun combed 24s adem dan tebal', imageUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80' },
      { name: 'Jaket Hoodie Streetwear', price: '249.000', description: 'Bahan fleece hangat kualitas distro', imageUrl: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&auto=format&fit=crop&q=80' },
      { name: 'Celana Chino Slim Fit', price: '189.000', description: 'Katun twill stretch lentur nyaman', imageUrl: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800&auto=format&fit=crop&q=80' }
    ]).map((p: any) => ({
      ...p,
      imageUrl: saveIfBase64(p.imageUrl) || p.imageUrl,
    }));

    // Update wizardData with processed image URLs so fallback and AI get real clean URLs
    const sanitizedWizardData = {
      ...wizardData,
      media: {
        ...media,
        heroImageUrl: processedHeroImg,
      },
      storeProducts: processedProducts,
    };

    const userBrief = `BUILD THIS COMPLETE CUSTOM WEBSITE FOR CUSTOMER:
- Website Name: ${siteName || 'Vimos Store'}
- Owner / Brand: ${ownerBrand || siteName || 'Vimos'}
- Description: ${siteDescription || 'Website modern dan profesional'}
- Website Type: ${websiteType || 'Toko Online'}
- Category: ${category || 'Bisnis'}
- Store WhatsApp Phone: ${whatsappNumber || '081234567890'} (Clean: ${cleanWa})
- Products List configured by customer:
${processedProducts.map((p: any, idx: number) => `  ${idx + 1}. Name: "${p.name}", Price: "Rp ${p.price}", Image: "${p.imageUrl}", Description: "${p.description}"`).join('\n')}
- Hero Image: ${processedHeroImg || 'Use high quality relevant Unsplash store photo'}
- Headline: ${content?.headline || 'Selamat Datang di ' + (siteName || 'Website Kami')}
- Subheadline: ${content?.subheadline || siteDescription || 'Temukan solusi terbaik untuk kebutuhan Anda.'}
- Primary CTA Button: ${content?.ctaText || 'Mulai Belanja'}
- About Us: ${content?.aboutUs || 'Kami berkomitmen memberikan layanan dan produk terbaik dengan integritas dan inovasi.'}
- Products / Services Headline: ${content?.productServiceHeadline || 'Katalog Produk Terlaris'}
- FAQ Content: ${content?.faqSummary || 'Pertanyaan seputar pemesanan via WhatsApp, ongkir, dan garansi.'}
- Header & Navbar: Logo text "${headerNavbar?.logoText || siteName || 'Vimos'}", Menu: ${(headerNavbar?.menuItems || ['Home', 'Produk', 'Tentang Kami', 'Kontak']).join(', ')}, Alignment: ${headerNavbar?.position || 'left'}, Navbar Type: ${layout?.navbar || 'horizontal'}
- Hero Layout: ${layout?.hero || 'text-left-img-right'}
- Content Grid: ${layout?.content || 'grid'}
- Footer Style: ${layout?.footer || '3-col'}
- Image Position: ${media?.imagePosition || 'right'}
- Features Selected: ${(features || ['Shopping Cart', 'WhatsApp Button', 'Contact Form', 'FAQ Accordion']).join(', ')}
- Typography: Font ${typography?.fontFamily || 'Plus Jakarta Sans'}, Heading: ${typography?.headingSize || 'large'}, Weight: ${typography?.fontWeight || 'bold'}
- Customer's Special Instructions: ${specialRequest || 'Sediakan tombol beli langsung via WhatsApp di setiap produk dan keranjang belanja!'}`;

    let rawHtml = '';
    try {
      const genResult = await generateWithFallback({
        systemInstruction,
        contents: userBrief,
        temperature: 0.7,
      });
      rawHtml = genResult.text || '';
    } catch (aiErr) {
      console.warn('[vimos.ai] AI generation stalled or failed, building rich custom website fallback:', aiErr);
      rawHtml = buildFallbackWebsiteHtml(sanitizedWizardData);
    }

    rawHtml = rawHtml.replace(/^```html\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();

    if (!rawHtml.toLowerCase().includes('<!doctype html>')) {
      rawHtml = `<!DOCTYPE html>\n<html lang="id">\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>${siteName || 'Website'} - vimos.ai</title>\n<script src="https://cdn.tailwindcss.com"></script>\n<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">\n</head>\n<body>\n${rawHtml}\n</body>\n</html>`;
    }

    res.json({
      success: true,
      html: rawHtml,
      title: siteName ? `${siteName} - vimos.ai` : extractTitleFromHtml(rawHtml) || 'Generated Website - vimos.ai',
    });
  } catch (error: any) {
    console.error('API /api/generate-wizard-website error:', error);
    // Even in outer error, deliver custom synthesized HTML so customer is never stuck
    const fallbackHtml = buildFallbackWebsiteHtml(req.body || {});
    res.json({
      success: true,
      html: fallbackHtml,
      title: req.body?.siteName ? `${req.body.siteName} - vimos.ai` : 'Website - vimos.ai',
    });
  }
});

// Backward-compatible Generate Website Endpoint
app.post('/api/generate-website', async (req: Request, res: Response) => {
  try {
    const { prompt, style, category, customRequirements } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      res.status(400).json({ error: 'Prompt string is required' });
      return;
    }

    const styleGuide = style || 'Modern Dark';
    const categoryGuide = category || 'General';

    const systemInstruction = `You are a world-class AI Frontend Engineer and Designer at vimos.ai.
Your goal is to build COMPLETE, PRODUCTION-READY, FULLY RESPONSIVE single-page websites based on the user's brief.

CRITICAL INSTRUCTIONS FOR GENERATED CODE:
1. Return ONLY valid, complete HTML5 document structure starting with <!DOCTYPE html> and ending with </html>.
2. Do NOT wrap the HTML code inside markdown code blocks (e.g. no \`\`\`html or \`\`\`).
3. Include Tailwind CSS CDN directly in the <head>:
   <script src="https://cdn.tailwindcss.com"></script>
4. Include FontAwesome 6 icons or Lucide Icons via CDN:
   <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
5. Include Google Fonts (Plus Jakarta Sans or Inter or Playfair Display depending on theme).
6. Theme & Aesthetics:
   - Selected Style: ${styleGuide}
   - Selected Category: ${categoryGuide}
   - Design with ultra-modern UI, gorgeous gradients, hover states, glassmorphism, responsive navigation bar with mobile burger menu toggle, high contrast typography, crisp buttons, pricing tables, hero sections, interactive features, client testimonials, FAQ accordions, and contact/newsletter forms.
7. Include Embedded JavaScript inside a <script> tag before </body> for interactive features:
   - Mobile menu toggle
   - Tab switching
   - FAQ accordion toggle
   - Form submit feedback modal/toast
   - Dark/Light mode toggle (if applicable)
   - Smooth scroll to sections
8. Place realistic copy, high-quality Unsplash image placeholders (e.g., https://images.unsplash.com/photo-...), micro-interactions, and badges.
9. Ensure the code is 100% self-contained and renders beautifully in an iframe sandbox.`;

    const userMessage = `Build a complete, stunning, high-converting website for:
Prompt: ${prompt}
Style Theme: ${styleGuide}
Category: ${categoryGuide}
Extra Requirements: ${customRequirements || 'Make it modern, responsive, and visually impressive with rich sections.'}`;

    const genResult = await generateWithFallback({
      systemInstruction,
      contents: userMessage,
      temperature: 0.7,
    });

    let rawHtml = genResult.text || '';

    // Strip markdown formatting if present
    rawHtml = rawHtml.replace(/^```html\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();

    if (!rawHtml.toLowerCase().includes('<!doctype html>')) {
      rawHtml = `<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>Generated Website - vimos.ai</title>\n<script src="https://cdn.tailwindcss.com"></script>\n<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">\n</head>\n<body>\n${rawHtml}\n</body>\n</html>`;
    }

    res.json({
      success: true,
      html: rawHtml,
      title: extractTitleFromHtml(rawHtml) || 'Generated Website - vimos.ai',
    });
  } catch (error: any) {
    console.error('API /api/generate-website error:', error);
    res.status(500).json({
      error: error?.message || 'Gagal menghasilkan website dengan AI. Silakan coba klik Generate lagi.',
    });
  }
});

// Refine / Edit Website Endpoint
app.post('/api/refine-website', async (req: Request, res: Response) => {
  try {
    const { currentHtml, refinementPrompt } = req.body;

    if (!currentHtml || !refinementPrompt) {
      res.status(400).json({ error: 'currentHtml and refinementPrompt are required' });
      return;
    }

    const systemInstruction = `You are an expert AI Frontend Developer at vimos.ai.
You are updating an existing website's HTML code based on user feedback.

CRITICAL INSTRUCTIONS:
1. Return ONLY the complete modified HTML5 document.
2. Do NOT use markdown triple backticks.
3. Keep all existing features that were not explicitly asked to be changed.
4. Apply the exact changes requested in the refinement prompt (e.g. color adjustments, section additions, text changes, styling tweaks).
5. Ensure Tailwind CSS script, icons, and interactive JavaScript remain intact and functional.`;

    const userMessage = `Existing Website HTML:
${currentHtml.substring(0, 15000)}

Refinement Request:
${refinementPrompt}`;

    let rawHtml = currentHtml;
    try {
      const genResult = await generateWithFallback({
        systemInstruction,
        contents: userMessage,
        temperature: 0.6,
      });
      rawHtml = genResult.text || currentHtml;
      rawHtml = rawHtml.replace(/^```html\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
    } catch (aiErr: any) {
      console.warn('[vimos.ai] Refine AI hit quota or network limit, applying smart local adjustments:', aiErr?.message);
      
      const promptLower = refinementPrompt.toLowerCase();
      // Apply common color/text adjustments locally
      if (promptLower.includes('merah') || promptLower.includes('red')) {
        rawHtml = rawHtml.replace(/--button:\s*[^;]+;/g, '--button: #EF4444;');
        rawHtml = rawHtml.replace(/bg-blue-[0-9]+/g, 'bg-red-500');
      } else if (promptLower.includes('hijau') || promptLower.includes('green')) {
        rawHtml = rawHtml.replace(/--button:\s*[^;]+;/g, '--button: #10B981;');
        rawHtml = rawHtml.replace(/bg-blue-[0-9]+/g, 'bg-emerald-500');
      } else if (promptLower.includes('hitam') || promptLower.includes('dark')) {
        rawHtml = rawHtml.replace(/--background:\s*[^;]+;/g, '--background: #090D16;');
      }
    }

    res.json({
      success: true,
      html: rawHtml,
    });
  } catch (error: any) {
    console.error('API /api/refine-website error:', error);
    res.status(500).json({
      error: error?.message || 'Gagal mengubah website dengan AI.',
    });
  }
});

function buildFallbackWebsiteHtml(data: any): string {
  const name = data?.siteName || 'Vimos Store';
  const desc = data?.siteDescription || 'Platform belanja & solusi digital modern.';
  const pColor = data?.colors?.primary || '#3B82F6';
  const sColor = data?.colors?.secondary || '#1E293B';
  const bColor = data?.colors?.background || '#0F172A';
  const tColor = data?.colors?.text || '#FFFFFF';
  const btnColor = data?.colors?.button || '#3B82F6';
  const aColor = data?.colors?.accent || '#6366F1';
  const radius = data?.designSliders?.borderRadius ?? 16;
  const font = data?.typography?.fontFamily || 'Plus Jakarta Sans';
  const headline = data?.content?.headline || `Selamat Datang di ${name}`;
  const subheadline = data?.content?.subheadline || desc;
  const cta = data?.content?.ctaText || 'Mulai Belanja';
  const about = data?.content?.aboutUs || `${name} hadir menghadirkan produk dan solusi unggulan dengan kualitas tinggi, transparansi, dan pelayanan terpercaya.`;
  const productsTitle = data?.content?.productServiceHeadline || 'Katalog Produk Toko';

  const waRaw = data?.whatsappNumber || '081234567890';
  const cleanWa = waRaw.replace(/[^0-9]/g, '').replace(/^0/, '62');

  const heroImg = data?.media?.heroImageUrl || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&auto=format&fit=crop&q=80';

  const productsList = (data?.storeProducts && data.storeProducts.length > 0)
    ? data.storeProducts
    : [
        {
          id: 'p1',
          name: 'Kaos Polos Oversize Premium',
          price: '129.000',
          description: 'Bahan katun combed 24s adem, jahitan rantai rapi dan tahan lama.',
          imageUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80'
        },
        {
          id: 'p2',
          name: 'Jaket Hoodie Streetwear',
          price: '249.000',
          description: 'Hoodie fleece tebal dengan kantong kanguru, cocok untuk gaya casual.',
          imageUrl: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&auto=format&fit=crop&q=80'
        },
        {
          id: 'p3',
          name: 'Celana Chino Slim Fit',
          price: '189.000',
          description: 'Material katun twill stretch lentur nyaman dipakai harian.',
          imageUrl: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800&auto=format&fit=crop&q=80'
        }
      ];

  const menuItems: string[] = data?.headerNavbar?.menuItems?.length
    ? data.headerNavbar.menuItems
    : ['Home', 'Produk', 'Tentang Kami', 'Kontak'];

  return `<!DOCTYPE html>
<html lang="id" class="scroll-smooth">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${name} - Official Store</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Inter:wght@400;600;700;800&family=Poppins:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --primary: ${pColor};
      --secondary: ${sColor};
      --background: ${bColor};
      --text: ${tColor};
      --button: ${btnColor};
      --accent: ${aColor};
      --radius: ${radius}px;
    }
    body {
      font-family: '${font}', sans-serif;
      background-color: var(--background);
      color: var(--text);
    }
    .custom-radius { border-radius: var(--radius); }
    .glass-nav {
      background: rgba(15, 23, 42, 0.88);
      backdrop-filter: blur(12px);
    }
  </style>
</head>
<body class="min-h-screen flex flex-col antialiased">

  <!-- Navbar -->
  <header class="fixed top-0 left-0 right-0 z-50 glass-nav border-b border-white/10">
    <div class="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
      <a href="#home" class="flex items-center gap-3">
        <div class="w-10 h-10 custom-radius flex items-center justify-center font-black text-white text-lg shadow-lg" style="background-color: var(--primary);">
          ${name.charAt(0)}
        </div>
        <span class="text-xl font-bold tracking-tight text-white">${name}</span>
      </a>

      <!-- Desktop Nav -->
      <nav class="hidden md:flex items-center gap-8 text-sm font-medium">
        ${menuItems.map(m => `<a href="#${m.toLowerCase().replace(/\\s+/g, '-')}" class="hover:text-blue-400 transition text-slate-300 hover:text-white">${m}</a>`).join('')}
      </nav>

      <div class="hidden md:flex items-center gap-3">
        <!-- Cart Button -->
        <button onclick="toggleCart()" class="relative p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition">
          <i class="fa-solid fa-cart-shopping text-base"></i>
          <span id="cartCount" class="absolute -top-1 -right-1 bg-emerald-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow">0</span>
        </button>

        <a href="https://wa.me/${cleanWa}?text=Halo%20${encodeURIComponent(name)},%20saya%20ingin%20bertanya%20seputar%20produk." target="_blank" class="px-5 py-2.5 custom-radius font-semibold text-xs text-white shadow-lg transition transform hover:scale-105 flex items-center gap-1.5" style="background-color: #25D366;">
          <i class="fa-brands fa-whatsapp text-sm"></i>
          <span>Chat Toko</span>
        </a>
      </div>

      <!-- Mobile Button -->
      <div class="flex items-center gap-2 md:hidden">
        <button onclick="toggleCart()" class="relative p-2 rounded-xl bg-white/10 text-white">
          <i class="fa-solid fa-cart-shopping"></i>
          <span id="mobileCartCount" class="absolute -top-1 -right-1 bg-emerald-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">0</span>
        </button>
        <button id="mobileMenuBtn" class="p-2 text-white">
          <i class="fa-solid fa-bars text-xl"></i>
        </button>
      </div>
    </div>

    <!-- Mobile Drawer -->
    <div id="mobileDrawer" class="hidden md:hidden px-6 py-4 bg-slate-900 border-b border-white/10 space-y-3">
      ${menuItems.map(m => `<a href="#${m.toLowerCase().replace(/\\s+/g, '-')}" class="block text-sm py-2 text-slate-300 font-medium">${m}</a>`).join('')}
      <div class="pt-2">
        <a href="https://wa.me/${cleanWa}" target="_blank" class="block w-full py-3 text-center custom-radius font-bold text-xs text-white flex items-center justify-center gap-2 bg-emerald-600">
          <i class="fa-brands fa-whatsapp"></i>
          <span>Chat WhatsApp (${waRaw})</span>
        </a>
      </div>
    </div>
  </header>

  <!-- Hero Section -->
  <section id="home" class="pt-36 pb-20 px-6 max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center flex-1">
    <div class="space-y-6">
      <div class="inline-flex items-center gap-2 px-3 py-1 custom-radius text-xs font-semibold" style="background-color: rgba(99, 102, 241, 0.2); color: var(--accent);">
        <i class="fa-solid fa-bag-shopping"></i>
        <span>${data?.category || 'Toko Online'} • Order Langsung Chat WA</span>
      </div>

      <h1 class="text-4xl md:text-6xl font-black leading-tight tracking-tight text-white">
        ${headline}
      </h1>

      <p class="text-base md:text-lg text-slate-400 leading-relaxed max-w-xl">
        ${subheadline}
      </p>

      <div class="flex flex-wrap gap-4 pt-2">
        <a href="#produk" class="px-8 py-4 custom-radius font-bold text-sm text-white shadow-xl transition transform hover:scale-105" style="background-color: var(--button);">
          <i class="fa-solid fa-shopping-bag mr-2"></i>${cta}
        </a>
        <a href="https://wa.me/${cleanWa}?text=Halo%20${encodeURIComponent(name)},%20saya%20ingin%20tanya%20katalog." target="_blank" class="px-7 py-4 custom-radius font-bold text-sm bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center gap-2 shadow-lg shadow-emerald-600/30">
          <i class="fa-brands fa-whatsapp text-lg"></i>
          <span>WhatsApp Toko</span>
        </a>
      </div>
    </div>

    <!-- Store Visual Banner -->
    <div class="relative custom-radius overflow-hidden shadow-2xl border border-white/15 aspect-[4/3] bg-slate-900">
      <img src="${heroImg}" alt="${name}" class="w-full h-full object-cover">
      <div class="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex flex-col justify-end p-6">
        <h3 class="text-2xl font-bold text-white mb-1">${name}</h3>
        <p class="text-xs text-slate-300 mb-2">${desc}</p>
        <span class="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
          <i class="fa-solid fa-shield-halved"></i> Toko Resmi & Terverifikasi
        </span>
      </div>
    </div>
  </section>

  <!-- Products Section -->
  <section id="produk" class="py-20 px-6 border-t border-white/10" style="background-color: rgba(30, 41, 59, 0.4);">
    <div class="max-w-7xl mx-auto space-y-12">
      <div class="text-center space-y-3">
        <div class="inline-block px-3 py-1 custom-radius text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
          Katalog Produk Siap Kirim
        </div>
        <h2 class="text-3xl md:text-4xl font-black text-white">${productsTitle}</h2>
        <p class="text-slate-400 text-sm max-w-lg mx-auto">Klik 'Beli via WhatsApp' untuk langsung chat dan memesan ke nomor toko kami.</p>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        ${productsList.map((p: any) => `
        <div class="custom-radius border border-white/10 overflow-hidden transition-all hover:border-emerald-500/50 hover:-translate-y-1 shadow-xl flex flex-col" style="background-color: var(--secondary);">
          <div class="aspect-square w-full bg-slate-900 relative overflow-hidden group">
            <img src="${p.imageUrl}" alt="${p.name}" class="w-full h-full object-cover transition duration-500 group-hover:scale-105">
            <div class="absolute top-3 right-3 bg-slate-950/80 backdrop-blur px-2.5 py-1 rounded-full text-xs font-mono font-bold text-emerald-400 border border-white/10">
              Rp ${p.price}
            </div>
          </div>
          
          <div class="p-6 flex-1 flex flex-col justify-between space-y-4">
            <div>
              <h3 class="text-lg font-bold text-white mb-1.5">${p.name}</h3>
              <p class="text-xs text-slate-400 leading-relaxed">${p.description}</p>
            </div>

            <div class="pt-3 border-t border-white/10 space-y-2">
              <button onclick="buyViaWa('${p.name.replace(/'/g, "\\'")}', '${p.price}')" class="w-full py-3 custom-radius font-bold text-xs text-white shadow-lg transition flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500">
                <i class="fa-brands fa-whatsapp text-sm"></i>
                <span>Beli via WhatsApp</span>
              </button>
              
              <button onclick="addToCart('${p.name.replace(/'/g, "\\'")}', '${p.price}', '${p.imageUrl}')" class="w-full py-2 custom-radius font-semibold text-xs text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition flex items-center justify-center gap-1.5">
                <i class="fa-solid fa-cart-plus"></i>
                <span>+ Keranjang Belanja</span>
              </button>
            </div>
          </div>
        </div>
        `).join('')}
      </div>
    </div>
  </section>

  <!-- About Section -->
  <section id="tentang-kami" class="py-20 px-6 max-w-5xl mx-auto text-center space-y-6">
    <div class="inline-block px-3 py-1 custom-radius text-xs font-semibold" style="background-color: rgba(99, 102, 241, 0.15); color: var(--accent);">
      Tentang Kami
    </div>
    <h2 class="text-3xl font-black text-white">Komitmen Kami Terhadap Pelanggan</h2>
    <p class="text-slate-300 text-sm md:text-base leading-relaxed max-w-2xl mx-auto">
      ${about}
    </p>
  </section>

  <!-- Contact Section -->
  <section id="kontak" class="py-20 px-6 border-t border-white/10" style="background-color: rgba(15, 23, 42, 0.8);">
    <div class="max-w-2xl mx-auto space-y-8">
      <div class="text-center space-y-2">
        <h2 class="text-3xl font-bold text-white">Hubungi Kami</h2>
        <p class="text-slate-400 text-xs">Punya pertanyaan seputar produk atau pesanan? Hubungi nomor WhatsApp kami di <strong class="text-emerald-400 font-mono">${waRaw}</strong> atau kirim pesan di bawah.</p>
      </div>

      <form id="contactForm" class="p-8 custom-radius border border-white/15 space-y-4 shadow-2xl" style="background-color: var(--secondary);">
        <div>
          <label class="block text-xs font-semibold text-slate-300 mb-1.5">Nama Lengkap</label>
          <input type="text" required placeholder="Nama Anda" class="w-full bg-slate-900 border border-slate-700 custom-radius py-3 px-4 text-xs text-white outline-none focus:border-indigo-500">
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-300 mb-1.5">Nomor WhatsApp / HP</label>
          <input type="text" required placeholder="0812..." class="w-full bg-slate-900 border border-slate-700 custom-radius py-3 px-4 text-xs text-white outline-none focus:border-indigo-500">
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-300 mb-1.5">Pesan Anda</label>
          <textarea rows="4" required placeholder="Tuliskan pertanyaan seputar produk di sini..." class="w-full bg-slate-900 border border-slate-700 custom-radius p-4 text-xs text-white outline-none focus:border-indigo-500 resize-none"></textarea>
        </div>
        <button type="submit" class="w-full py-3.5 custom-radius font-bold text-xs text-white shadow-lg transition hover:opacity-90" style="background-color: var(--button);">
          Kirim Pesan
        </button>
      </form>
    </div>
  </section>

  <!-- Footer -->
  <footer class="mt-auto py-12 px-6 border-t border-white/10 bg-slate-950 text-slate-400 text-xs text-center">
    <div class="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
      <div class="font-bold text-white">${name} © ${new Date().getFullYear()}</div>
      <div>WhatsApp: <a href="https://wa.me/${cleanWa}" class="text-emerald-400 font-mono underline">${waRaw}</a></div>
      <div>Platform Dibuat dengan Vimos.ai</div>
    </div>
  </footer>

  <!-- Floating WhatsApp Button -->
  <a href="https://wa.me/${cleanWa}?text=Halo%20${encodeURIComponent(name)},%20saya%20ingin%20bertanya%20seputar%20produk." target="_blank" rel="noopener noreferrer" class="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center text-2xl shadow-2xl shadow-emerald-500/50 transition transform hover:scale-110" title="Chat Pembelian via WhatsApp">
    <i class="fa-brands fa-whatsapp"></i>
  </a>

  <!-- Cart Slideover Drawer -->
  <div id="cartDrawer" class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm hidden flex justify-end">
    <div class="w-full max-w-md bg-slate-900 h-full p-6 flex flex-col justify-between shadow-2xl border-l border-slate-800">
      <div>
        <div class="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
          <div class="flex items-center gap-2">
            <i class="fa-solid fa-cart-shopping text-emerald-400"></i>
            <h3 class="text-lg font-bold text-white">Keranjang Belanja</h3>
          </div>
          <button onclick="toggleCart()" class="text-slate-400 hover:text-white text-lg p-1">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div id="cartItemsContainer" class="space-y-3 max-h-[55vh] overflow-y-auto">
          <!-- Dynamically filled -->
        </div>
      </div>

      <div class="border-t border-slate-800 pt-4 space-y-4">
        <div class="flex items-center justify-between text-sm">
          <span class="text-slate-400">Total Belanja:</span>
          <span id="cartTotalPrice" class="font-mono font-bold text-lg text-emerald-400">Rp 0</span>
        </div>

        <button onclick="checkoutCartViaWa()" class="w-full py-3.5 custom-radius font-bold text-xs text-white bg-emerald-600 hover:bg-emerald-500 transition shadow-xl flex items-center justify-center gap-2">
          <i class="fa-brands fa-whatsapp text-base"></i>
          <span>Checkout via WhatsApp (${waRaw})</span>
        </button>
      </div>
    </div>
  </div>

  <!-- Shopping Cart & WhatsApp Script -->
  <script>
    const waNumber = "${cleanWa}";
    const storeName = "${name.replace(/'/g, "\\'")}";
    let cart = [];

    function buyViaWa(productName, price) {
      const text = "Halo " + storeName + "! Saya ingin membeli produk:\\n\\n" +
        "• Produk: " + productName + "\\n" +
        "• Harga: Rp " + price + "\\n\\n" +
        "Format Pemesan:\\n" +
        "Nama:\\n" +
        "Alamat Pengiriman:\\n\\n" +
        "Apakah stok produk ini masih tersedia? Terima kasih!";
      
      const url = "https://wa.me/" + waNumber + "?text=" + encodeURIComponent(text);
      window.open(url, '_blank');
    }

    function toggleCart() {
      const drawer = document.getElementById('cartDrawer');
      drawer.classList.toggle('hidden');
    }

    function addToCart(name, price, img) {
      cart.push({ name: name, price: price, img: img });
      updateCartUI();
      alert(name + " berhasil dimasukkan ke keranjang belanja!");
    }

    function removeFromCart(index) {
      cart.splice(index, 1);
      updateCartUI();
    }

    function updateCartUI() {
      const count = document.getElementById('cartCount');
      const mCount = document.getElementById('mobileCartCount');
      if (count) count.textContent = cart.length;
      if (mCount) mCount.textContent = cart.length;

      const container = document.getElementById('cartItemsContainer');
      const totalEl = document.getElementById('cartTotalPrice');

      if (!container) return;

      if (cart.length === 0) {
        container.innerHTML = '<p class="text-center text-slate-500 py-8 text-xs">Keranjang belanja Anda masih kosong.</p>';
        if (totalEl) totalEl.textContent = 'Rp 0';
        return;
      }

      let total = 0;
      container.innerHTML = cart.map((item, idx) => {
        const numPrice = parseInt(item.price.replace(/[^0-9]/g, '')) || 0;
        total += numPrice;
        return '<div class="flex items-center justify-between p-3 rounded-xl bg-slate-800 border border-slate-700">' +
          '<div class="flex items-center gap-3">' +
            '<img src="' + item.img + '" class="w-12 h-12 object-cover rounded-lg">' +
            '<div>' +
              '<h4 class="text-xs font-bold text-white">' + item.name + '</h4>' +
              '<span class="text-[11px] text-emerald-400 font-mono">Rp ' + item.price + '</span>' +
            '</div>' +
          '</div>' +
          '<button onclick="removeFromCart(' + idx + ')" class="text-slate-500 hover:text-rose-400 p-2 text-xs"><i class="fa-solid fa-trash"></i></button>' +
        '</div>';
      }).join('');

      if (totalEl) {
        totalEl.textContent = 'Rp ' + total.toLocaleString('id-ID');
      }
    }

    function checkoutCartViaWa() {
      if (cart.length === 0) {
        alert('Keranjang belanja Anda kosong!');
        return;
      }

      let itemList = cart.map((item, i) => (i + 1) + ". " + item.name + " (Rp " + item.price + ")").join('\\n');
      const total = document.getElementById('cartTotalPrice')?.textContent || '';

      const text = "Halo " + storeName + "! Saya ingin checkout pesanan keranjang saya:\\n\\n" +
        itemList + "\\n\\n" +
        "Total: " + total + "\\n\\n" +
        "Format Pembeli:\\n" +
        "• Nama:\\n" +
        "• Alamat Lengkap:\\n" +
        "• Catatan:\\n\\n" +
        "Mohon info rekening dan total ongkos kirim. Terima kasih!";

      const url = "https://wa.me/" + waNumber + "?text=" + encodeURIComponent(text);
      window.open(url, '_blank');
    }

    const mBtn = document.getElementById('mobileMenuBtn');
    const mDrawer = document.getElementById('mobileDrawer');
    if (mBtn && mDrawer) {
      mBtn.addEventListener('click', () => mDrawer.classList.toggle('hidden'));
    }

    const cForm = document.getElementById('contactForm');
    if (cForm) {
      cForm.addEventListener('submit', (e) => {
        e.preventDefault();
        alert('Terima kasih! Pesan Anda telah terkirim.');
        cForm.reset();
      });
    }
  </script>
</body>
</html>`;
}

function extractTitleFromHtml(html: string): string {
  const match = html.match(/<title>(.*?)<\/title>/i);
  return match ? match[1].trim() : 'Custom AI Website';
}

// Start Server with Vite Middleware in Development
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`vimos.ai platform active on http://0.0.0.0:${PORT}`);
  });
}

startServer();
