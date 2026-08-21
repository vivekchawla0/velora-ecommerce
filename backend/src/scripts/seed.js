const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const bcrypt = require('bcryptjs');

dotenv.config({ path: path.join(__dirname, '../../.env') });
dotenv.config({ path: path.join(__dirname, '../../../.env') });

const User = require('../models/User');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Interaction = require('../models/Interaction');
const Order = require('../models/Order');
const { connectDB } = require('../config/db');
const { newCategoriesData, newProductsData } = require('./catalogExpansionData');

// 1. Base Categories
const baseCategoriesData = [
  {
    name: 'Electronics & Gadgets',
    slug: 'electronics',
    description: 'High-performance laptops, mechanical keyboards, curved monitors, and cutting-edge devices.',
    icon: 'Laptop',
    image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600&auto=format&fit=crop&q=80',
  },
  {
    name: 'Audio & Acoustics',
    slug: 'audio',
    description: 'Audiophile headphones, noise-canceling earbuds, studio monitors, and portable speakers.',
    icon: 'Headphones',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80',
  },
  {
    name: 'Fashion & Apparel',
    slug: 'fashion',
    description: 'Modern premium streetwear, minimalist jackets, leather travel duffles, and sunglasses.',
    icon: 'Shirt',
    image: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=600&auto=format&fit=crop&q=80',
  },
  {
    name: 'Home & Living',
    slug: 'home-living',
    description: 'Artisanal espresso machines, ergonomic office desk lamps, air purifiers, and cast iron cookware.',
    icon: 'Home',
    image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&auto=format&fit=crop&q=80',
  },
  {
    name: 'Home & Kitchen',
    slug: 'home-kitchen',
    description: 'Artisanal espresso machines, ergonomic office desk lamps, air purifiers, and cast iron cookware.',
    icon: 'Home',
    image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&auto=format&fit=crop&q=80',
  },
  {
    name: 'Fitness & Outdoors',
    slug: 'fitness',
    description: 'Smart GPS wearables, carbon fiber racing shoes, premium yoga mats, and insulated bottles.',
    icon: 'Activity',
    image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600&auto=format&fit=crop&q=80',
  },
  {
    name: 'Sports & Fitness',
    slug: 'sports-fitness',
    description: 'Smart GPS wearables, carbon fiber racing shoes, premium yoga mats, and insulated bottles.',
    icon: 'Activity',
    image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600&auto=format&fit=crop&q=80',
  },
  {
    name: 'Beauty & Personal Care',
    slug: 'beauty',
    description: 'Organic cellular serums, ultrasonic essential oil diffusers, and high-speed ionic dryers.',
    icon: 'Sparkles',
    image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&auto=format&fit=crop&q=80',
  },
  {
    name: 'Accessories & Essentials',
    slug: 'accessories',
    description: 'RFID-blocking slim wallets, polarized titanium sunglasses, tech pouches, and full-grain leather goods.',
    icon: 'Watch',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80',
  },
  {
    name: 'Gaming & Esports',
    slug: 'gaming',
    description: 'Rapid-trigger magnetic keyboards, 8K optical mice, 7.1 surround headsets, and ergonomic gaming chairs.',
    icon: 'Gamepad2',
    image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&auto=format&fit=crop&q=80',
  },
  {
    name: 'Books & Learning',
    slug: 'books-learning',
    description: 'Comprehensive software engineering handbooks, system design, algorithm practice, and cloud guides.',
    icon: 'BookOpen',
    image: 'https://images.unsplash.com/photo-1532012164546-f432f2e3dd45?w=600&auto=format&fit=crop&q=80',
  },
  {
    name: 'Travel & Luggage',
    slug: 'travel',
    description: 'TSA-approved carry-on backpacks, compression packing cubes, GaN universal adapters, and travel comfort.',
    icon: 'Compass',
    image: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600&auto=format&fit=crop&q=80',
  },
  {
    name: 'Office & Workspace',
    slug: 'workspace',
    description: 'Ergonomic mesh chairs, dual-motor standing desk frames, monitor light bars, and modular oak organizers.',
    icon: 'Briefcase',
    image: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=600&auto=format&fit=crop&q=80',
  },
];

// Combine unique categories by slug
const allCategoriesMap = new Map();
baseCategoriesData.forEach((c) => allCategoriesMap.set(c.slug, c));
newCategoriesData.forEach((c) => allCategoriesMap.set(c.slug, c));
const categoriesData = Array.from(allCategoriesMap.values());

// 2. Base 19 Products with SKUs
const baseProductsData = [
  // Audio & Acoustics (4 products)
  {
    sku: 'VEL-AUD-001',
    name: 'AeroSound Pro Noise-Cancelling Headphones',
    description: 'Flagship wireless over-ear headphones featuring spatial audio with dynamic head tracking, 40-hour battery life, hybrid active noise cancellation, and ultra-soft memory foam earcups.',
    price: 349.99,
    originalPrice: 399.99,
    discountPercentage: 12,
    category: 'audio',
    brand: 'AeroSound',
    images: [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&auto=format&fit=crop&q=80',
    ],
    rating: 4.9,
    ratingCount: 312,
    stock: 45,
    tags: ['wireless', 'noise-cancelling', 'bluetooth', 'audio', 'spatial'],
    featured: true,
    specs: { Driver: '40mm Custom High-Excursion', Battery: '40 Hours', Connectivity: 'Bluetooth 5.3 + 3.5mm', Weight: '250g' },
  },
  {
    sku: 'VEL-AUD-002',
    name: 'PulseBuds Ultra True Wireless Earbuds',
    description: 'Compact IPX7 waterproof wireless earbuds with adaptive transparency mode, wireless charging case, touch gestures, and rich punchy bass response.',
    price: 159.99,
    originalPrice: 199.99,
    discountPercentage: 20,
    category: 'audio',
    brand: 'AeroSound',
    images: [
      'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=800&auto=format&fit=crop&q=80',
    ],
    rating: 4.7,
    ratingCount: 184,
    stock: 80,
    tags: ['earbuds', 'wireless', 'bluetooth', 'waterproof', 'compact'],
    featured: false,
    specs: { Battery: '8h + 24h case', Waterproof: 'IPX7', NoiseCancellation: 'Active ANC', Latency: '45ms' },
  },
  {
    sku: 'VEL-AUD-003',
    name: 'SoundSphere 360 Studio Portable Speaker',
    description: 'Room-filling 360-degree omnidirectional acoustic speaker crafted with aircraft-grade aluminum, dual passive radiators, and 24-hour continuous playback.',
    price: 189.50,
    originalPrice: 219.00,
    discountPercentage: 13,
    category: 'audio',
    brand: 'SoundSphere',
    images: [
      'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800&auto=format&fit=crop&q=80',
    ],
    rating: 4.6,
    ratingCount: 95,
    stock: 30,
    tags: ['speaker', 'bluetooth', 'portable', 'aluminum', '360audio'],
    featured: false,
    specs: { Output: '50W RMS', Battery: '24 Hours', Protection: 'IP67 Dust & Water', VoiceAssistant: 'Supported' },
  },
  {
    sku: 'VEL-AUD-004',
    name: 'StudioPro Reference Audiophile Monitors',
    description: 'Precision-tuned nearfield powered studio reference monitors with bi-amped Class-D amplification, Kevlar woofers, and acoustic room compensation filters.',
    price: 499.00,
    originalPrice: 549.00,
    discountPercentage: 9,
    category: 'audio',
    brand: 'SonicCraft',
    images: [
      'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800&auto=format&fit=crop&q=80',
    ],
    rating: 4.8,
    ratingCount: 56,
    stock: 18,
    tags: ['studio', 'monitors', 'speakers', 'audiophile', 'music-production'],
    featured: false,
    specs: { Woofer: '6.5-inch Woven Kevlar', Tweeter: '1-inch Silk Dome', FrequencyResponse: '38Hz - 22kHz' },
  },

  // Electronics (4 products)
  {
    sku: 'VEL-ELEC-000A',
    name: 'TitanBook Pro 16 M-Max Ultrabook',
    description: 'Ultra-thin aerospace titanium chassis housing a 16-inch 120Hz mini-LED Liquid Retina display, 16-core CPU, 64GB Unified RAM, and 2TB NVMe PCIe 4.0 storage.',
    price: 2199.00,
    originalPrice: 2399.00,
    discountPercentage: 8,
    category: 'electronics',
    brand: 'TitanTech',
    images: [
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=800&auto=format&fit=crop&q=80',
    ],
    rating: 4.9,
    ratingCount: 142,
    stock: 25,
    tags: ['laptop', 'ultrabook', 'titanium', 'creator', 'high-performance'],
    featured: true,
    specs: { Processor: '16-Core Neural AI CPU', RAM: '64GB LPDDR5X', Storage: '2TB Gen4 SSD', Display: '16-inch 3.2K 120Hz Mini-LED' },
  },
  {
    sku: 'VEL-ELEC-000B',
    name: 'Vortex Quantum Mechanical Keyboard',
    description: 'Hot-swappable wireless mechanical keyboard featuring custom pre-lubed linear switches, gasket-mounted brass plate, per-key RGB backlighting, and CNC anodized aluminum body.',
    price: 179.99,
    originalPrice: 209.99,
    discountPercentage: 14,
    category: 'electronics',
    brand: 'VortexTech',
    images: [
      'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=800&auto=format&fit=crop&q=80',
    ],
    rating: 4.8,
    ratingCount: 220,
    stock: 65,
    tags: ['keyboard', 'mechanical', 'custom', 'rgb', 'gaming', 'wireless'],
    featured: true,
    specs: { Layout: '75% Compact', SwitchType: 'Lubed Linear 45g', Connectivity: 'Tri-Mode (2.4G/BT/USB-C)', Battery: '4000mAh' },
  },
  {
    sku: 'VEL-ELEC-000C',
    name: 'Apex Precision Ergonomic Wireless Mouse',
    description: 'Ergonomic vertical wireless mouse with 26,000 DPI optical sensor, hyper-fast dual-mode magnetic scroll wheel, and textured thumb rest for all-day comfort.',
    price: 99.00,
    originalPrice: 119.00,
    discountPercentage: 16,
    category: 'electronics',
    brand: 'VortexTech',
    images: [
      'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800&auto=format&fit=crop&q=80',
    ],
    rating: 4.7,
    ratingCount: 168,
    stock: 50,
    tags: ['mouse', 'ergonomic', 'wireless', 'productivity', 'office'],
    featured: false,
    specs: { DPI: '26,000 Focus Pro', Battery: '70 Days on USB-C Charge', Weight: '98g' },
  },
  {
    sku: 'VEL-ELEC-000D',
    name: 'VisionClear 4K Ultra-Wide Curved Monitor 34"',
    description: '34-inch 3440x1440p 144Hz 1000R curved gaming & productivity monitor with HDR400, 98% DCI-P3 color gamut, and 90W USB-C power delivery.',
    price: 649.99,
    originalPrice: 749.99,
    discountPercentage: 13,
    category: 'electronics',
    brand: 'VisionTech',
    images: [
      'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&auto=format&fit=crop&q=80',
    ],
    rating: 4.7,
    ratingCount: 88,
    stock: 20,
    tags: ['monitor', 'curved', 'ultrawide', '4k', 'gaming', 'usb-c'],
    featured: false,
    specs: { Resolution: '3440 x 1440 UWQHD', RefreshRate: '144Hz 1ms', Panel: 'Fast IPS Curved 1000R' },
  },

  // Fitness (4 products)
  {
    sku: 'VEL-FIT-001',
    name: 'ChronoFit Horizon GPS Smartwatch',
    description: 'Military-grade sapphire crystal smartwatch with multi-band dual-frequency GPS, ECG monitor, SpO2 sensor, sleep staging AI, and 14-day battery life.',
    price: 329.00,
    originalPrice: 389.00,
    discountPercentage: 15,
    category: 'fitness',
    brand: 'ChronoFit',
    images: [
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=800&auto=format&fit=crop&q=80',
    ],
    rating: 4.8,
    ratingCount: 260,
    stock: 55,
    tags: ['smartwatch', 'gps', 'fitness', 'ecg', 'health-tracking', 'running'],
    featured: true,
    specs: { Battery: '14 Days Typical', WaterResistance: '100m (10 ATM)', Display: '1.43" AMOLED Sapphire' },
  },
  {
    sku: 'VEL-FIT-002',
    name: 'Zenith Pro Eco-Grip Yoga Mat',
    description: 'High-density non-slip natural tree rubber yoga mat with laser-etched alignment system, 5mm joint cushioning, and antimicrobial odor barrier.',
    price: 68.00,
    originalPrice: 85.00,
    discountPercentage: 20,
    category: 'fitness',
    brand: 'ZenithLife',
    images: [
      'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=800&auto=format&fit=crop&q=80',
    ],
    rating: 4.9,
    ratingCount: 140,
    stock: 90,
    tags: ['yoga', 'fitness', 'mat', 'eco-friendly', 'workout'],
    featured: false,
    specs: { Material: 'Natural Tree Rubber + PU', Thickness: '5mm', Dimensions: '183cm x 68cm' },
  },
  {
    sku: 'VEL-FIT-003',
    name: 'HydroFlow Thermal Vacuum Insulated Bottle 32oz',
    description: 'Double-walled copper-lined stainless steel water bottle keeping liquids icy cold for 28 hours or piping hot for 14 hours. Leak-proof chug cap with flex handle.',
    price: 38.00,
    originalPrice: 45.00,
    discountPercentage: 15,
    category: 'fitness',
    brand: 'HydroFlow',
    images: [
      'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&auto=format&fit=crop&q=80',
    ],
    rating: 4.8,
    ratingCount: 420,
    stock: 120,
    tags: ['bottle', 'hydration', 'fitness', 'insulated', 'outdoors'],
    featured: false,
    specs: { Capacity: '32oz (946ml)', Material: '18/8 Pro-Grade Stainless Steel', Insulation: 'TempShield' },
  },
  {
    sku: 'VEL-FIT-004',
    name: 'AeroGlide Carbon Fiber Running Shoes',
    description: 'Next-generation marathon racing shoes with full-length curved carbon fiber propulsion plate, super-critical PEBA foam, and breathable engineered mesh upper.',
    price: 220.00,
    originalPrice: 250.00,
    discountPercentage: 12,
    category: 'fitness',
    brand: 'AeroGlide',
    images: [
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&auto=format&fit=crop&q=80',
    ],
    rating: 4.7,
    ratingCount: 175,
    stock: 40,
    tags: ['shoes', 'running', 'carbon-fiber', 'marathon', 'sneakers'],
    featured: true,
    specs: { Drop: '8mm', Weight: '198g (Men 9)', Midsole: 'PEBA Foam + Carbon Plate' },
  },

  // Home & Kitchen (3 products)
  {
    sku: 'VEL-HOME-000A',
    name: 'BaristaTouch Precision Espresso Machine',
    description: 'Commercial 15-bar Italian pump espresso machine with integrated conical burr grinder, dual PID thermo-block temperature control, and micro-foam steam wand.',
    price: 699.99,
    originalPrice: 799.99,
    discountPercentage: 12,
    category: 'home-kitchen',
    brand: 'BaristaCraft',
    images: [
      'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=800&auto=format&fit=crop&q=80',
    ],
    rating: 4.9,
    ratingCount: 198,
    stock: 22,
    tags: ['coffee', 'espresso', 'kitchen', 'barista', 'appliance'],
    featured: true,
    specs: { PumpPressure: '15 Bar Italian', WaterTank: '2.5 Liters', Grinder: '30 Precision Settings' },
  },
  {
    sku: 'VEL-HOME-000B',
    name: 'Lumina Smart Ambient Desk Lamp',
    description: 'Architectural aluminum task lamp with circadian rhythm lighting, wireless phone charging pad, gesture dimming controls, and 98 CRI eye-care illumination.',
    price: 119.00,
    originalPrice: 149.00,
    discountPercentage: 20,
    category: 'home-kitchen',
    brand: 'Lumina',
    images: [
      'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&auto=format&fit=crop&q=80',
    ],
    rating: 4.7,
    ratingCount: 110,
    stock: 45,
    tags: ['lamp', 'lighting', 'desk', 'smart-home', 'minimalist'],
    featured: false,
    specs: { ColorTemp: '2700K - 6500K', CRI: 'Ra >= 98', ChargingPad: '15W Qi Fast Charge' },
  },
  {
    sku: 'VEL-HOME-000C',
    name: 'AeroPurify HEPA Air Purifier Pro',
    description: 'Medical-grade H13 True HEPA filtration system removing 99.97% of airborne particles, allergens, pet dander, and odors in rooms up to 800 sq ft.',
    price: 199.99,
    originalPrice: 239.99,
    discountPercentage: 16,
    category: 'home-kitchen',
    brand: 'AeroPurify',
    images: [
      'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800&auto=format&fit=crop&q=80',
    ],
    rating: 4.8,
    ratingCount: 165,
    stock: 35,
    tags: ['air-purifier', 'hepa', 'home', 'wellness', 'smart-home'],
    featured: false,
    specs: { CADR: '400 m3/h', NoiseLevel: '22dB (Sleep Mode)', FilterLife: '8-12 Months' },
  },

  // Fashion (2 products)
  {
    sku: 'VEL-FASH-000A',
    name: 'UrbanShield Weatherproof Commuter Parka',
    description: 'Tailored 3-layer GORE-TEX breathable waterproof coat featuring taped seams, magnetic pocket closures, insulated thermal lining, and sleek storm hood.',
    price: 289.00,
    originalPrice: 349.00,
    discountPercentage: 17,
    category: 'fashion',
    brand: 'UrbanShield',
    images: [
      'https://images.unsplash.com/photo-1544441893-675973e31985?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&auto=format&fit=crop&q=80',
    ],
    rating: 4.8,
    ratingCount: 154,
    stock: 40,
    tags: ['jacket', 'outerwear', 'waterproof', 'streetwear', 'parka'],
    featured: true,
    specs: { WaterproofRating: '20,000mm', Fabric: '3-Layer Recycled Ripstop', Fit: 'Tailored Modern' },
  },
  {
    sku: 'VEL-FASH-000B',
    name: 'Minimalist Top-Grain Leather Weekend Duffle',
    description: 'Handcrafted full-grain Tuscan leather travel bag with solid brass YKK zippers, dedicated shoe compartment, and padded 16-inch laptop sleeve.',
    price: 245.00,
    originalPrice: 295.00,
    discountPercentage: 16,
    category: 'fashion',
    brand: 'ArtisanCraft',
    images: [
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&auto=format&fit=crop&q=80',
    ],
    rating: 4.9,
    ratingCount: 112,
    stock: 25,
    tags: ['leather', 'bag', 'duffle', 'travel', 'accessories'],
    featured: false,
    specs: { Material: '100% Full Grain Leather', Capacity: '45 Liters', Dimensions: '52 x 28 x 26 cm' },
  },

  // Beauty (2 products)
  {
    sku: 'VEL-BEAU-000A',
    name: 'Botanical Hydration Glow Serum Set',
    description: 'Triple molecular hyaluronic acid serum formulated with organic rosehip, niacinamide, and botanical peptides for deep cellular hydration and skin barrier restoration.',
    price: 54.00,
    originalPrice: 65.00,
    discountPercentage: 16,
    category: 'beauty',
    brand: 'BotanicaPure',
    images: [
      'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&auto=format&fit=crop&q=80',
    ],
    rating: 4.9,
    ratingCount: 210,
    stock: 75,
    tags: ['skincare', 'serum', 'hyaluronic-acid', 'organic', 'beauty'],
    featured: true,
    specs: { Volume: '50ml (1.7 fl oz)', KeyActives: 'Hyaluronic Acid 2%, Niacinamide 5%', Certification: 'Cruelty-Free' },
  },
  {
    sku: 'VEL-BEAU-000B',
    name: 'ZenAroma Ultrasonic Ceramic Essential Oil Diffuser',
    description: 'Handcrafted ceramic ultrasonic diffuser operating at whisper-quiet 2.4MHz with ambient warm LED light and 8-hour continuous misting timer.',
    price: 48.00,
    originalPrice: 60.00,
    discountPercentage: 20,
    category: 'beauty',
    brand: 'ZenAroma',
    images: [
      'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=800&auto=format&fit=crop&q=80',
    ],
    rating: 4.7,
    ratingCount: 95,
    stock: 60,
    tags: ['diffuser', 'aromatherapy', 'wellness', 'ceramic', 'home'],
    featured: false,
    specs: { TankCapacity: '180ml', Coverage: 'Up to 300 sq ft', AutoShutoff: 'Yes (BPA-Free)' },
  },
];

// Combine all products (19 base + 200 new = 219 total)
const productsData = [...baseProductsData, ...newProductsData];

const seedUsers = [
  {
    name: 'Velora Administrator',
    email: 'admin@example.com',
    password: 'Admin123!',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    preferences: { favoriteCategories: ['electronics', 'audio', 'workspace'] },
  },
  {
    name: 'Alex Morgan',
    email: 'demo@example.com',
    password: 'Demo123!',
    role: 'user',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    preferences: { favoriteCategories: ['electronics', 'gaming', 'workspace'] },
  },
  {
    name: 'Elena Rostova',
    email: 'elena@example.com',
    password: 'User123!',
    role: 'user',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    preferences: { favoriteCategories: ['audio', 'electronics', 'workspace', 'gaming'] },
  },
  {
    name: 'David Kim',
    email: 'david@example.com',
    password: 'User123!',
    role: 'user',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    preferences: { favoriteCategories: ['electronics', 'books-learning', 'workspace'] },
  },
  {
    name: 'Sarah Jenkins',
    email: 'sarah@example.com',
    password: 'User123!',
    role: 'user',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    preferences: { favoriteCategories: ['fashion', 'beauty', 'accessories', 'home-living'] },
  },
  {
    name: 'Emily Vance',
    email: 'emily@example.com',
    password: 'User123!',
    role: 'user',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    preferences: { favoriteCategories: ['fashion', 'beauty', 'home-living', 'travel'] },
  },
  {
    name: 'Mike Chen',
    email: 'mike@example.com',
    password: 'User123!',
    role: 'user',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    preferences: { favoriteCategories: ['sports-fitness', 'fitness', 'travel', 'accessories'] },
  },
  {
    name: 'Lucas Silva',
    email: 'lucas@example.com',
    password: 'User123!',
    role: 'user',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
    preferences: { favoriteCategories: ['sports-fitness', 'fitness', 'travel', 'outdoors'] },
  },
  {
    name: 'Liam Hayes',
    email: 'liam@example.com',
    password: 'User123!',
    role: 'user',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    preferences: { favoriteCategories: ['travel', 'accessories', 'home-living'] },
  },
];

const runSeed = async ({ silent = false, reset = false } = {}) => {
  try {
    const log = (...args) => {
      if (!silent) console.log(...args);
    };

    log('🌱 Starting Velora database seed and catalog expansion...');

    // 1. Seed / Upsert Categories
    let categoryUpsertCount = 0;
    for (const cat of categoriesData) {
      await Category.findOneAndUpdate(
        { slug: cat.slug },
        { $set: cat },
        { upsert: true, new: true }
      );
      categoryUpsertCount++;
    }
    log(`✅ Ensured ${categoryUpsertCount} categories in database.`);

    // 2. Seed / Upsert Products
    let productUpsertCount = 0;
    for (const prod of productsData) {
      const filter = prod.sku ? { sku: prod.sku } : { name: prod.name };
      await Product.findOneAndUpdate(
        filter,
        { $set: prod },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      productUpsertCount++;
    }
    const finalProductCount = await Product.countDocuments();
    log(`✅ Seeded & verified ${finalProductCount} total products across all categories.`);

    // 3. Seed / Upsert Users
    const userMap = {};
    for (const u of seedUsers) {
      let existingUser = await User.findOne({ email: u.email });
      if (!existingUser) {
        existingUser = await User.create({ ...u });
      }
      userMap[u.email] = existingUser;
    }
    log(`✅ Verified ${Object.keys(userMap).length} seed demo personas.`);

    // 4. Fetch all DB products for mapping
    const allDbProducts = await Product.find({});
    const productSkuMap = {};
    const productNameMap = {};
    allDbProducts.forEach((p) => {
      if (p.sku) productSkuMap[p.sku] = p;
      productNameMap[p.name] = p;
    });

    // 5. Seed Realistic Multi-Cluster User Interactions
    const interactionsData = [];
    const addEventBySku = (userEmail, skuOrName, type, weight, ratingVal = null) => {
      const u = userMap[userEmail];
      const p = productSkuMap[skuOrName] || productNameMap[skuOrName];
      if (u && p) {
        interactionsData.push({
          userId: u._id,
          productId: p._id,
          type,
          weight,
          ratingValue: ratingVal,
          createdAt: new Date(Date.now() - Math.floor(Math.random() * 14 * 86400000)),
        });
      }
    };

    // --- Cluster 1: Tech, Gaming & Workspace (Alex, Elena, David) ---
    // Alex Morgan (demo@example.com)
    addEventBySku('demo@example.com', 'VEL-AUD-001', 'view', 1);
    addEventBySku('demo@example.com', 'VEL-AUD-001', 'click', 2);
    addEventBySku('demo@example.com', 'VEL-AUD-001', 'cart', 4);
    addEventBySku('demo@example.com', 'VEL-AUD-001', 'purchase', 5);
    addEventBySku('demo@example.com', 'VEL-ELEC-000B', 'view', 1);
    addEventBySku('demo@example.com', 'VEL-ELEC-000B', 'cart', 4);
    addEventBySku('demo@example.com', 'VEL-ELEC-000B', 'purchase', 5);
    addEventBySku('demo@example.com', 'VEL-ELEC-001', 'view', 1);
    addEventBySku('demo@example.com', 'VEL-ELEC-001', 'wishlist', 3);
    addEventBySku('demo@example.com', 'VEL-ELEC-001', 'purchase', 5);
    addEventBySku('demo@example.com', 'VEL-GAME-001', 'view', 1);
    addEventBySku('demo@example.com', 'VEL-GAME-001', 'cart', 4);
    addEventBySku('demo@example.com', 'VEL-GAME-001', 'purchase', 5);
    addEventBySku('demo@example.com', 'VEL-GAME-002', 'view', 1);
    addEventBySku('demo@example.com', 'VEL-GAME-002', 'purchase', 5);
    addEventBySku('demo@example.com', 'VEL-WORK-001', 'view', 1);
    addEventBySku('demo@example.com', 'VEL-WORK-001', 'cart', 4);
    addEventBySku('demo@example.com', 'VEL-WORK-001', 'purchase', 5);
    addEventBySku('demo@example.com', 'VEL-WORK-005', 'view', 1);
    addEventBySku('demo@example.com', 'VEL-WORK-005', 'purchase', 5);
    addEventBySku('demo@example.com', 'VEL-BOOK-001', 'view', 1);
    addEventBySku('demo@example.com', 'VEL-BOOK-001', 'purchase', 5);
    addEventBySku('demo@example.com', 'VEL-BOOK-004', 'view', 1);
    addEventBySku('demo@example.com', 'VEL-BOOK-004', 'purchase', 5);

    // Elena Rostova (elena@example.com)
    addEventBySku('elena@example.com', 'VEL-AUD-001', 'view', 1);
    addEventBySku('elena@example.com', 'VEL-AUD-001', 'purchase', 5);
    addEventBySku('elena@example.com', 'VEL-AUD-004', 'view', 1);
    addEventBySku('elena@example.com', 'VEL-AUD-004', 'purchase', 5);
    addEventBySku('elena@example.com', 'VEL-ELEC-001', 'view', 1);
    addEventBySku('elena@example.com', 'VEL-ELEC-001', 'purchase', 5);
    addEventBySku('elena@example.com', 'VEL-ELEC-009', 'view', 1);
    addEventBySku('elena@example.com', 'VEL-ELEC-009', 'purchase', 5);
    addEventBySku('elena@example.com', 'VEL-GAME-001', 'view', 1);
    addEventBySku('elena@example.com', 'VEL-GAME-001', 'purchase', 5);
    addEventBySku('elena@example.com', 'VEL-GAME-003', 'view', 1);
    addEventBySku('elena@example.com', 'VEL-GAME-003', 'purchase', 5);
    addEventBySku('elena@example.com', 'VEL-WORK-001', 'view', 1);
    addEventBySku('elena@example.com', 'VEL-WORK-001', 'purchase', 5);
    addEventBySku('elena@example.com', 'VEL-WORK-002', 'view', 1);
    addEventBySku('elena@example.com', 'VEL-WORK-002', 'purchase', 5);

    // David Kim (david@example.com)
    addEventBySku('david@example.com', 'VEL-ELEC-000A', 'view', 1);
    addEventBySku('david@example.com', 'VEL-ELEC-000A', 'purchase', 5);
    addEventBySku('david@example.com', 'VEL-ELEC-001', 'view', 1);
    addEventBySku('david@example.com', 'VEL-ELEC-001', 'purchase', 5);
    addEventBySku('david@example.com', 'VEL-WORK-001', 'view', 1);
    addEventBySku('david@example.com', 'VEL-WORK-001', 'purchase', 5);
    addEventBySku('david@example.com', 'VEL-WORK-005', 'view', 1);
    addEventBySku('david@example.com', 'VEL-WORK-005', 'purchase', 5);
    addEventBySku('david@example.com', 'VEL-BOOK-001', 'view', 1);
    addEventBySku('david@example.com', 'VEL-BOOK-001', 'purchase', 5);
    addEventBySku('david@example.com', 'VEL-BOOK-002', 'view', 1);
    addEventBySku('david@example.com', 'VEL-BOOK-002', 'purchase', 5);
    addEventBySku('david@example.com', 'VEL-BOOK-005', 'view', 1);
    addEventBySku('david@example.com', 'VEL-BOOK-005', 'purchase', 5);
    addEventBySku('david@example.com', 'VEL-BOOK-007', 'view', 1);
    addEventBySku('david@example.com', 'VEL-BOOK-007', 'purchase', 5);

    // --- Cluster 2: Fashion, Beauty, Accessories & Home (Sarah, Emily) ---
    // Sarah Jenkins (sarah@example.com)
    addEventBySku('sarah@example.com', 'VEL-FASH-001', 'view', 1);
    addEventBySku('sarah@example.com', 'VEL-FASH-001', 'purchase', 5);
    addEventBySku('sarah@example.com', 'VEL-FASH-003', 'view', 1);
    addEventBySku('sarah@example.com', 'VEL-FASH-003', 'purchase', 5);
    addEventBySku('sarah@example.com', 'VEL-FASH-007', 'view', 1);
    addEventBySku('sarah@example.com', 'VEL-FASH-007', 'purchase', 5);
    addEventBySku('sarah@example.com', 'VEL-BEAU-001', 'view', 1);
    addEventBySku('sarah@example.com', 'VEL-BEAU-001', 'purchase', 5);
    addEventBySku('sarah@example.com', 'VEL-BEAU-002', 'view', 1);
    addEventBySku('sarah@example.com', 'VEL-BEAU-002', 'purchase', 5);
    addEventBySku('sarah@example.com', 'VEL-BEAU-003', 'view', 1);
    addEventBySku('sarah@example.com', 'VEL-BEAU-003', 'purchase', 5);
    addEventBySku('sarah@example.com', 'VEL-ACCS-001', 'view', 1);
    addEventBySku('sarah@example.com', 'VEL-ACCS-001', 'purchase', 5);
    addEventBySku('sarah@example.com', 'VEL-ACCS-002', 'view', 1);
    addEventBySku('sarah@example.com', 'VEL-ACCS-002', 'purchase', 5);
    addEventBySku('sarah@example.com', 'VEL-HOME-001', 'view', 1);
    addEventBySku('sarah@example.com', 'VEL-HOME-001', 'purchase', 5);
    addEventBySku('sarah@example.com', 'VEL-HOME-005', 'view', 1);
    addEventBySku('sarah@example.com', 'VEL-HOME-005', 'purchase', 5);

    // Emily Vance (emily@example.com)
    addEventBySku('emily@example.com', 'VEL-FASH-001', 'view', 1);
    addEventBySku('emily@example.com', 'VEL-FASH-001', 'purchase', 5);
    addEventBySku('emily@example.com', 'VEL-FASH-007', 'view', 1);
    addEventBySku('emily@example.com', 'VEL-FASH-007', 'purchase', 5);
    addEventBySku('emily@example.com', 'VEL-BEAU-001', 'view', 1);
    addEventBySku('emily@example.com', 'VEL-BEAU-001', 'purchase', 5);
    addEventBySku('emily@example.com', 'VEL-BEAU-003', 'view', 1);
    addEventBySku('emily@example.com', 'VEL-BEAU-003', 'purchase', 5);
    addEventBySku('emily@example.com', 'VEL-BEAU-007', 'view', 1);
    addEventBySku('emily@example.com', 'VEL-BEAU-007', 'purchase', 5);
    addEventBySku('emily@example.com', 'VEL-ACCS-002', 'view', 1);
    addEventBySku('emily@example.com', 'VEL-ACCS-002', 'purchase', 5);
    addEventBySku('emily@example.com', 'VEL-ACCS-010', 'view', 1);
    addEventBySku('emily@example.com', 'VEL-ACCS-010', 'purchase', 5);
    addEventBySku('emily@example.com', 'VEL-HOME-001', 'view', 1);
    addEventBySku('emily@example.com', 'VEL-HOME-001', 'purchase', 5);
    addEventBySku('emily@example.com', 'VEL-HOME-006', 'view', 1);
    addEventBySku('emily@example.com', 'VEL-HOME-006', 'purchase', 5);
    addEventBySku('emily@example.com', 'VEL-TRAV-002', 'view', 1);
    addEventBySku('emily@example.com', 'VEL-TRAV-002', 'purchase', 5);

    // --- Cluster 3: Sports, Fitness, Outdoors & Active Travel (Mike, Lucas) ---
    // Mike Chen (mike@example.com)
    addEventBySku('mike@example.com', 'VEL-SPRT-001', 'view', 1);
    addEventBySku('mike@example.com', 'VEL-SPRT-001', 'purchase', 5);
    addEventBySku('mike@example.com', 'VEL-SPRT-002', 'view', 1);
    addEventBySku('mike@example.com', 'VEL-SPRT-002', 'purchase', 5);
    addEventBySku('mike@example.com', 'VEL-SPRT-003', 'view', 1);
    addEventBySku('mike@example.com', 'VEL-SPRT-003', 'purchase', 5);
    addEventBySku('mike@example.com', 'VEL-SPRT-006', 'view', 1);
    addEventBySku('mike@example.com', 'VEL-SPRT-006', 'purchase', 5);
    addEventBySku('mike@example.com', 'VEL-SPRT-007', 'view', 1);
    addEventBySku('mike@example.com', 'VEL-SPRT-007', 'purchase', 5);
    addEventBySku('mike@example.com', 'VEL-FASH-011', 'view', 1);
    addEventBySku('mike@example.com', 'VEL-FASH-011', 'purchase', 5);
    addEventBySku('mike@example.com', 'VEL-TRAV-001', 'view', 1);
    addEventBySku('mike@example.com', 'VEL-TRAV-001', 'purchase', 5);
    addEventBySku('mike@example.com', 'VEL-TRAV-005', 'view', 1);
    addEventBySku('mike@example.com', 'VEL-TRAV-005', 'purchase', 5);

    // Lucas Silva (lucas@example.com)
    addEventBySku('lucas@example.com', 'VEL-SPRT-001', 'view', 1);
    addEventBySku('lucas@example.com', 'VEL-SPRT-001', 'purchase', 5);
    addEventBySku('lucas@example.com', 'VEL-SPRT-003', 'view', 1);
    addEventBySku('lucas@example.com', 'VEL-SPRT-003', 'purchase', 5);
    addEventBySku('lucas@example.com', 'VEL-SPRT-006', 'view', 1);
    addEventBySku('lucas@example.com', 'VEL-SPRT-006', 'purchase', 5);
    addEventBySku('lucas@example.com', 'VEL-SPRT-008', 'view', 1);
    addEventBySku('lucas@example.com', 'VEL-SPRT-008', 'purchase', 5);
    addEventBySku('lucas@example.com', 'VEL-SPRT-011', 'view', 1);
    addEventBySku('lucas@example.com', 'VEL-SPRT-011', 'purchase', 5);
    addEventBySku('lucas@example.com', 'VEL-FASH-011', 'view', 1);
    addEventBySku('lucas@example.com', 'VEL-FASH-011', 'purchase', 5);
    addEventBySku('lucas@example.com', 'VEL-TRAV-001', 'view', 1);
    addEventBySku('lucas@example.com', 'VEL-TRAV-001', 'purchase', 5);
    addEventBySku('lucas@example.com', 'VEL-TRAV-002', 'view', 1);
    addEventBySku('lucas@example.com', 'VEL-TRAV-002', 'purchase', 5);

    // --- Cluster 4: Travel, Luggage & Essential Accessories (Liam Hayes) ---
    addEventBySku('liam@example.com', 'VEL-TRAV-001', 'view', 1);
    addEventBySku('liam@example.com', 'VEL-TRAV-001', 'click', 2);
    addEventBySku('liam@example.com', 'VEL-TRAV-001', 'purchase', 5);
    addEventBySku('liam@example.com', 'VEL-TRAV-002', 'view', 1);
    addEventBySku('liam@example.com', 'VEL-TRAV-002', 'wishlist', 3);
    addEventBySku('liam@example.com', 'VEL-TRAV-002', 'purchase', 5);
    addEventBySku('liam@example.com', 'VEL-TRAV-005', 'view', 1);
    addEventBySku('liam@example.com', 'VEL-TRAV-005', 'cart', 4);
    addEventBySku('liam@example.com', 'VEL-TRAV-005', 'purchase', 5);
    addEventBySku('liam@example.com', 'VEL-ACCS-001', 'view', 1);
    addEventBySku('liam@example.com', 'VEL-ACCS-001', 'purchase', 5);
    addEventBySku('liam@example.com', 'VEL-ACCS-010', 'view', 1);
    addEventBySku('liam@example.com', 'VEL-ACCS-010', 'purchase', 5);

    // 6. Clean insert of interaction dataset
    await Interaction.deleteMany({});
    const insertedInteractions = await Interaction.insertMany(interactionsData);
    log(`✅ Seeded ${insertedInteractions.length} interaction logs with preference clusters.`);

    // 7. Seed completed orders for demo user
    const demoUser = userMap['demo@example.com'];
    const pDisplay = productSkuMap['VEL-ELEC-001'];
    const pMouse = productSkuMap['VEL-GAME-001'];

    if (demoUser && pDisplay && pMouse) {
      const existingOrder = await Order.findOne({ userId: demoUser._id });
      if (!existingOrder) {
        await Order.create({
          userId: demoUser._id,
          items: [
            {
              productId: pDisplay._id,
              name: pDisplay.name,
              price: pDisplay.price,
              quantity: 1,
              image: pDisplay.images[0],
            },
            {
              productId: pMouse._id,
              name: pMouse.name,
              price: pMouse.price,
              quantity: 1,
              image: pMouse.images[0],
            },
          ],
          subtotal: pDisplay.price + pMouse.price,
          tax: Number(((pDisplay.price + pMouse.price) * 0.08).toFixed(2)),
          shippingFee: 0,
          totalAmount: Number(((pDisplay.price + pMouse.price) * 1.08).toFixed(2)),
          shippingAddress: {
            fullName: 'Alex Morgan',
            street: '742 Evergreen Terrace',
            city: 'San Francisco',
            state: 'CA',
            postalCode: '94107',
            country: 'United States',
          },
          paymentMethod: 'credit_card',
          paymentStatus: 'completed',
          status: 'Delivered',
          createdAt: new Date(Date.now() - 3 * 86400000),
        });
        log('✅ Seeded demo completed order for user demo@example.com.');
      }
    }

    log('🎉 Velora database catalog expansion seed completed successfully!\n');
    return {
      totalCategories: categoryUpsertCount,
      totalProducts: finalProductCount,
      totalInteractions: insertedInteractions.length,
    };
  } catch (error) {
    console.error(`❌ Seeding failed: ${error.message}`);
    throw error;
  }
};

if (require.main === module) {
  (async () => {
    try {
      await connectDB();
      await runSeed({ silent: false });
      process.exit(0);
    } catch (err) {
      console.error(err);
      process.exit(1);
    }
  })();
}

module.exports = { runSeed, categoriesData, productsData, seedUsers };
