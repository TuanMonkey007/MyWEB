"use client";

import { useState } from "react";
import Image from "next/image";
import {
  CalendarDays,
  Check,
  Clock,
  ExternalLink,
  Heart,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Sparkles,
  Star,
  Users,
  Utensils,
  Wine,
} from "lucide-react";
import { toast } from "sonner";

// Menu Data
const MENU_CATEGORIES = ["All", "Starters", "Mains", "Chef Specials", "Desserts", "Wine & Cocktails"];

const MENU_ITEMS = [
  {
    id: 1,
    name: "Dry-Aged Wagyu Ribeye",
    category: "Mains",
    price: "$78",
    description: "45-day dry-aged Japanese A5 Wagyu, charred shallots, bone marrow jus, truffle pomme purée.",
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80",
    tag: "Chef's Signature",
  },
  {
    id: 2,
    name: "Pan-Seared Hokkaido Scallops",
    category: "Starters",
    price: "$34",
    description: "Golden brown scallops, sweet pea velouté, crispy pancetta, lemon-herb infused olive oil.",
    image: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=800&q=80",
    tag: "Seasonal",
  },
  {
    id: 3,
    name: "Handcrafted Black Truffle Tagliolini",
    category: "Chef Specials",
    price: "$46",
    description: "House-made egg pasta, aged Parmigiano Reggiano 24 months, freshly shaved Norcia black truffles.",
    image: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=800&q=80",
    tag: "House Special",
  },
  {
    id: 4,
    name: "Roasted Mediterranean Sea Bass",
    category: "Mains",
    price: "$52",
    description: "Crispy skin wild sea bass, braised fennel, saffron emulsion, heirloom cherry tomatoes.",
    image: "https://images.unsplash.com/photo-1534939561126-855b8675edd7?auto=format&fit=crop&w=800&q=80",
    tag: "Gluten-Free",
  },
  {
    id: 5,
    name: "Valrhona Dark Chocolate Soufflé",
    category: "Desserts",
    price: "$22",
    description: "Warm 70% molten Guanaja chocolate, Grand Marnier crème anglaise, Tahitian vanilla bean gelato.",
    image: "https://images.unsplash.com/photo-1579372786545-d24232daf58c?auto=format&fit=crop&w=800&q=80",
    tag: "Made to Order",
  },
  {
    id: 6,
    name: "Reserve Barolo & Craft Cocktails",
    category: "Wine & Cocktails",
    price: "$26",
    description: "Sommelier-selected Piedmont vintage, smoke-infused rosemary negroni, botanical botanicals.",
    image: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&q=80",
    tag: "Cellar Pick",
  },
];

export default function RestaurantLandingPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [resForm, setResForm] = useState({
    name: "",
    phone: "",
    date: "",
    time: "18:00",
    guests: "2",
  });
  const [resSubmitted, setResSubmitted] = useState(false);

  const filteredMenu =
    activeCategory === "All"
      ? MENU_ITEMS
      : MENU_ITEMS.filter((item) => item.category === activeCategory);

  const handleReservation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resForm.name || !resForm.phone || !resForm.date) {
      toast.error("Vui lòng điền đủ Tên, Số điện thoại và Ngày đặt bàn");
      return;
    }
    setResSubmitted(true);
    toast.success("Bàn của bạn đã được đặt thành công! Chúng tôi sẽ gọi xác nhận trong 15 phút.");
  };

  return (
    <div className="min-h-screen bg-[#FAF7F0] text-[#1C1917] selection:bg-[#F25C2B] selection:text-white">
      {/* ── TOP UTILITY STRIP ── */}
      <div className="border-b-2 border-[#1C1917] bg-[#1E140C] text-xs text-[#FAF7F0] py-2 px-4 sm:px-8">
        <div className="mx-auto max-w-7xl flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 font-medium">
              <Clock className="size-3.5 text-[#F25C2B]" /> Monday - Thursday: 11:00 AM - 10:00 PM
            </span>
            <span className="hidden md:inline-block text-[#F25C2B]">|</span>
            <span className="hidden md:flex items-center gap-1.5">
              <MapPin className="size-3.5 text-[#F25C2B]" /> 123 Gourmet Street, NYC
            </span>
          </div>
          <div className="flex items-center gap-3">
            <a href="tel:+15551234567" className="font-semibold text-[#F25C2B] hover:underline flex items-center gap-1">
              <Phone className="size-3" /> +1 (555) 123-4567
            </a>
          </div>
        </div>
      </div>

      {/* ── FLOATING NAVIGATION BAR (Chính xác như ảnh 2) ── */}
      <header className="sticky top-4 z-50 px-4 sm:px-6">
        <nav className="mx-auto max-w-6xl rounded-md border-2 border-[#1C1917] bg-[#FAF7F0] px-6 py-3.5 shadow-neo transition-all flex items-center justify-between">
          {/* Brand Logo */}
          <a href="#" className="font-editorial text-2xl sm:text-3xl font-bold tracking-tight text-[#1C1917]">
            La Maison
          </a>

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-[#1C1917]">
            <a href="#menu" className="hover:text-[#F25C2B] transition-colors">
              Menu
            </a>
            <a href="#our-story" className="hover:text-[#F25C2B] transition-colors">
              Our Story
            </a>
            <a href="#reservations" className="hover:text-[#F25C2B] transition-colors">
              Reservation
            </a>
            <a href="#contact" className="hover:text-[#F25C2B] transition-colors">
              Contact
            </a>
          </div>

          {/* Book a Table Button */}
          <a
            href="#reservations"
            className="inline-flex cursor-pointer items-center justify-center rounded-md border-2 border-[#1C1917] bg-[#F25C2B] px-5 py-2 text-sm font-bold text-white shadow-neo-sm hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-neo active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
          >
            Book a Table
          </a>
        </nav>
      </header>

      {/* ── HERO SECTION (Chính xác theo ảnh 2) ── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pt-12 pb-20">
        <div className="grid items-center gap-12 lg:grid-cols-12">
          {/* Left Column: Copy & CTAs */}
          <div className="space-y-6 lg:col-span-6">
            {/* Award badge */}
            <div className="inline-flex items-center gap-1.5 rounded-sm border-2 border-[#1C1917] bg-[#FAF7F0] px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#1C1917]">
              <Star className="size-3.5 fill-[#F25C2B] text-[#F25C2B]" />
              Award-Winning Cuisine
            </div>

            {/* Main Headline */}
            <h1 className="font-editorial text-5xl sm:text-6xl lg:text-7xl font-bold uppercase tracking-tight text-[#1C1917] leading-[1.05]">
              EXPERIENCE
              <span className="block text-[#F25C2B]">CULINARY ART</span>
            </h1>

            {/* Subtitle */}
            <p className="max-w-lg text-base sm:text-lg leading-relaxed text-stone-700">
              Discover the finest flavors crafted with passion. Fresh ingredients, timeless recipes, and an unforgettable dining experience await you.
            </p>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <a
                href="#reservations"
                className="inline-flex cursor-pointer items-center justify-center rounded-md border-2 border-[#1C1917] bg-[#F25C2B] px-7 py-3.5 text-base font-bold text-white shadow-neo hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-neo-lg active:translate-x-[2px] active:translate-y-[2px] active:shadow-neo-sm transition-all"
              >
                Reserve a Table
              </a>
              <a
                href="#menu"
                className="inline-flex cursor-pointer items-center justify-center rounded-md border-2 border-[#1C1917] bg-white px-7 py-3.5 text-base font-bold text-[#1C1917] shadow-neo hover:bg-[#FDF9F3] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-neo-lg active:translate-x-[2px] active:translate-y-[2px] active:shadow-neo-sm transition-all"
              >
                View Menu
              </a>
            </div>

            {/* Meta info row */}
            <div className="flex flex-wrap items-center gap-6 pt-4 text-xs font-semibold text-stone-700">
              <div className="flex items-center gap-2">
                <Clock className="size-4 text-[#F25C2B]" />
                <span>Open Daily 11AM - 11PM</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="size-4 text-[#F25C2B]" />
                <span>123 Gourmet Street, NYC</span>
              </div>
            </div>
          </div>

          {/* Right Column: 4-Photo Collage & Badge (Ảnh 2) */}
          <div className="relative lg:col-span-6">
            <div className="grid grid-cols-2 gap-3.5">
              {/* Image 1: Table fine dining */}
              <div className="relative aspect-[4/3] overflow-hidden rounded-xs border-2 border-[#1C1917] bg-stone-200 shadow-neo">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=700&q=80"
                  alt="Fine dining table"
                  className="h-full w-full object-cover"
                />
              </div>

              {/* Image 2: Sautéed delicacy */}
              <div className="relative row-span-2 aspect-[3/4] overflow-hidden rounded-xs border-2 border-[#1C1917] bg-stone-200 shadow-neo">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=700&q=80"
                  alt="Delicious gourmet steak"
                  className="h-full w-full object-cover"
                />
              </div>

              {/* Image 3: Overhead fresh plate */}
              <div className="relative aspect-square overflow-hidden rounded-xs border-2 border-[#1C1917] bg-stone-200 shadow-neo">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=700&q=80"
                  alt="Fresh ingredients plate"
                  className="h-full w-full object-cover"
                />
              </div>

              {/* Image 4: Chef hands prepping */}
              <div className="relative aspect-[4/3] overflow-hidden rounded-xs border-2 border-[#1C1917] bg-stone-200 shadow-neo">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=700&q=80"
                  alt="Chef preparing fresh herbs"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>

            {/* Floating orange badge: 15+ YEARS OF EXCELLENCE */}
            <div className="absolute -bottom-5 right-6 z-10 rounded-xs border-2 border-[#1C1917] bg-[#F25C2B] px-5 py-3 text-center text-white shadow-neo">
              <div className="font-editorial text-2xl font-black leading-none">15+</div>
              <div className="mt-0.5 text-[10px] font-bold uppercase tracking-wider">
                Years of Excellence
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION DIVIDER ICON ── */}
      <div className="mx-auto flex max-w-7xl items-center justify-center px-4 py-8">
        <div className="h-0.5 flex-1 bg-stone-300" />
        <div className="mx-4 text-[#F25C2B]">
          <Utensils className="size-5" />
        </div>
        <div className="h-0.5 flex-1 bg-stone-300" />
      </div>

      {/* ── CHEF STORY SECTION (Chính xác theo ảnh 1) ── */}
      <section id="our-story" className="mx-auto max-w-7xl px-4 sm:px-6 py-16">
        <div className="grid items-center gap-12 lg:grid-cols-12">
          {/* Left: Chef Image & Floating Quote */}
          <div className="relative lg:col-span-6">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xs border-2 border-[#1C1917] bg-stone-200 shadow-neo-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=900&q=80"
                alt="Executive Chef Marco Bellini"
                className="h-full w-full object-cover"
              />
            </div>

            {/* Overlapping Quote Box */}
            <div className="relative sm:absolute -bottom-8 right-0 sm:right-6 max-w-md mt-4 sm:mt-0 rounded-xs border-2 border-[#1C1917] bg-white p-5 sm:p-6 shadow-neo">
              <div className="font-serif text-3xl font-bold leading-none text-[#F25C2B]">“</div>
              <p className="mt-1 font-serif italic text-xs sm:text-sm leading-relaxed text-stone-800">
                &ldquo;Cooking is about passion, so it may look slightly temperamental in a way that it&apos;s too assertive to the naked eye.&rdquo;
              </p>
              <div className="mt-3 text-xs font-bold uppercase tracking-wider text-[#1C1917]">
                — Chef Marco Bellini
              </div>
            </div>
          </div>

          {/* Right: Story narrative & 3 Stats */}
          <div className="space-y-6 lg:col-span-6 lg:pl-6">
            <div className="space-y-3">
              <div className="text-xs font-bold uppercase tracking-widest text-[#F25C2B]">
                Culinary Heritage
              </div>
              <h2 className="font-editorial text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#1C1917] leading-tight">
                Crafted with Tradition, Inspired by Innovation
              </h2>
            </div>

            <p className="text-sm sm:text-base leading-relaxed text-stone-700">
              excellence in the heart of New York City. Our journey began with a simple vision: to create dishes that tell stories and bring people together.
            </p>

            <p className="text-sm sm:text-base leading-relaxed text-stone-700">
              Under the guidance of Executive Chef Marco Bellini, our kitchen transforms the finest seasonal ingredients into memorable dining experiences. Every dish is a celebration of tradition, innovation, and passion.
            </p>

            {/* 3 Stat boxes (Chính xác như ảnh 1) */}
            <div className="grid grid-cols-3 gap-3.5 pt-4">
              <div className="rounded-xs border-2 border-[#1C1917] bg-[#FDF9F3] p-4 text-center shadow-neo-sm">
                <div className="font-editorial text-2xl sm:text-3xl font-bold text-[#F25C2B]">15+</div>
                <div className="mt-1 text-[11px] font-bold uppercase tracking-wider text-[#1C1917]">
                  Years
                </div>
              </div>

              <div className="rounded-xs border-2 border-[#1C1917] bg-[#FDF9F3] p-4 text-center shadow-neo-sm">
                <div className="font-editorial text-2xl sm:text-3xl font-bold text-[#F25C2B]">50K+</div>
                <div className="mt-1 text-[11px] font-bold uppercase tracking-wider text-[#1C1917]">
                  Happy Guests
                </div>
              </div>

              <div className="rounded-xs border-2 border-[#1C1917] bg-[#FDF9F3] p-4 text-center shadow-neo-sm">
                <div className="font-editorial text-2xl sm:text-3xl font-bold text-[#F25C2B]">3</div>
                <div className="mt-1 text-[11px] font-bold uppercase tracking-wider text-[#1C1917]">
                  Michelin Stars
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── MENU PREVIEW SECTION ── */}
      <section id="menu" className="mx-auto max-w-7xl px-4 sm:px-6 py-20">
        <div className="text-center space-y-3 mb-12">
          <div className="text-xs font-bold uppercase tracking-widest text-[#F25C2B]">
            Seasonal Selection
          </div>
          <h2 className="font-editorial text-3xl sm:text-5xl font-bold tracking-tight text-[#1C1917]">
            SIGNATURE MENU
          </h2>
          <p className="max-w-xl mx-auto text-sm text-stone-600">
            A harmonious symphony of organic ingredients curated by Chef Marco Bellini
          </p>

          {/* Filter Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-6">
            {MENU_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`cursor-pointer rounded-sm border-2 border-[#1C1917] px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition-all ${
                  activeCategory === cat
                    ? "bg-[#F25C2B] text-white shadow-neo-sm"
                    : "bg-white text-[#1C1917] hover:bg-[#FDF9F3]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Menu Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredMenu.map((item) => (
            <div
              key={item.id}
              className="group flex flex-col justify-between rounded-xs border-2 border-[#1C1917] bg-white p-4 shadow-neo transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-neo-lg"
            >
              <div>
                <div className="relative mb-3.5 aspect-[4/3] w-full overflow-hidden rounded-xs border-2 border-[#1C1917] bg-stone-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  {item.tag && (
                    <span className="absolute top-2.5 right-2.5 rounded-xs border border-[#1C1917] bg-[#F25C2B] px-2 py-0.5 text-[10px] font-bold uppercase text-white shadow-neo-sm">
                      {item.tag}
                    </span>
                  )}
                </div>

                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-editorial text-lg font-bold text-[#1C1917] leading-snug">
                    {item.name}
                  </h3>
                  <span className="font-editorial text-lg font-bold text-[#F25C2B] tabular-nums">
                    {item.price}
                  </span>
                </div>

                <p className="mt-2 text-xs leading-relaxed text-stone-600">
                  {item.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t-2 border-dashed border-stone-200 flex items-center justify-between text-xs">
                <span className="text-[11px] font-semibold uppercase text-stone-500">{item.category}</span>
                <a href="#reservations" className="font-bold text-[#F25C2B] hover:underline flex items-center gap-1">
                  Order at Table →
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── RESERVATIONS SECTION (Chính xác theo ảnh 1) ── */}
      <section id="reservations" className="border-y-2 border-[#1C1917] bg-[#1E140C] text-[#FAF7F0] py-20 px-4 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="grid items-center gap-12 lg:grid-cols-12">
            {/* Left Column: Book Your Table Copy */}
            <div className="space-y-6 lg:col-span-6">
              <div className="flex items-center gap-3">
                <div className="h-0.5 w-12 bg-[#F25C2B]" />
                <span className="text-xs font-bold uppercase tracking-widest text-[#F25C2B]">
                  Reservations
                </span>
              </div>

              <h2 className="font-editorial text-4xl sm:text-5xl lg:text-6xl font-bold uppercase tracking-tight text-white leading-tight">
                BOOK YOUR TABLE
              </h2>

              <p className="text-sm sm:text-base leading-relaxed text-stone-300 max-w-md">
                Join us for an unforgettable dining experience. Reserve your table today and let us take care of the rest. For parties larger than 8, please call us directly.
              </p>

              <div className="inline-flex items-center gap-4 rounded-xs border-2 border-stone-800 bg-[#291B11] p-3 text-white">
                <div className="flex size-10 items-center justify-center rounded-xs bg-[#F25C2B] text-white">
                  <Phone className="size-5" />
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                    Direct Phone Line
                  </div>
                  <div className="font-mono text-base font-bold text-white">
                    +1 (555) 123-4567
                  </div>
                </div>
              </div>

              {/* Schedule Details */}
              <div className="border-t border-stone-800 pt-6 space-y-2 text-xs text-stone-400">
                <div className="flex justify-between max-w-sm">
                  <span>Monday - Thursday</span>
                  <span className="font-semibold text-white">11:00 AM - 10:00 PM</span>
                </div>
                <div className="flex justify-between max-w-sm">
                  <span>Friday - Sunday</span>
                  <span className="font-semibold text-white">10:00 AM - 11:00 PM</span>
                </div>
              </div>
            </div>

            {/* Right Column: Make a Reservation Card (Ảnh 1) */}
            <div className="lg:col-span-6">
              <div className="mx-auto max-w-lg rounded-xs border-2 border-[#1C1917] bg-white p-6 sm:p-8 text-[#1C1917] shadow-[6px_6px_0px_#000000]">
                <h3 className="font-editorial text-2xl font-bold uppercase tracking-wide text-[#1C1917] pb-4 border-b-2 border-stone-100">
                  MAKE A RESERVATION
                </h3>

                {resSubmitted ? (
                  <div className="py-10 text-center space-y-3">
                    <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                      <Check className="size-6 stroke-[3]" />
                    </div>
                    <div className="font-editorial text-xl font-bold text-stone-900">
                      Cảm ơn bạn, {resForm.name}!
                    </div>
                    <p className="text-xs text-stone-600">
                      Bàn {resForm.guests} người vào lúc {resForm.time}, ngày {resForm.date} đã được ghi nhận. Nhà hàng sẽ liên hệ xác nhận qua số {resForm.phone}.
                    </p>
                    <button
                      type="button"
                      onClick={() => setResSubmitted(false)}
                      className="mt-4 inline-flex cursor-pointer text-xs font-bold text-[#F25C2B] underline"
                    >
                      Đặt thêm bàn khác
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleReservation} className="mt-5 space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-[#1C1917]">
                          Name
                        </label>
                        <input
                          type="text"
                          required
                          value={resForm.name}
                          onChange={(e) => setResForm({ ...resForm, name: e.target.value })}
                          placeholder="Your name"
                          className="w-full rounded-none border-2 border-[#1C1917] bg-white px-3 py-2.5 text-sm text-[#1C1917] outline-none focus:ring-2 focus:ring-[#F25C2B]"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-[#1C1917]">
                          Phone
                        </label>
                        <input
                          type="tel"
                          required
                          value={resForm.phone}
                          onChange={(e) => setResForm({ ...resForm, phone: e.target.value })}
                          placeholder="+1 (555) 000-0000"
                          className="w-full rounded-none border-2 border-[#1C1917] bg-white px-3 py-2.5 text-sm text-[#1C1917] outline-none focus:ring-2 focus:ring-[#F25C2B]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-[#1C1917]">
                          Date
                        </label>
                        <input
                          type="date"
                          required
                          value={resForm.date}
                          onChange={(e) => setResForm({ ...resForm, date: e.target.value })}
                          className="w-full rounded-none border-2 border-[#1C1917] bg-white px-3 py-2.5 text-sm text-[#1C1917] outline-none focus:ring-2 focus:ring-[#F25C2B]"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-[#1C1917]">
                          Time
                        </label>
                        <select
                          value={resForm.time}
                          onChange={(e) => setResForm({ ...resForm, time: e.target.value })}
                          className="w-full rounded-none border-2 border-[#1C1917] bg-white px-3 py-2.5 text-sm text-[#1C1917] outline-none focus:ring-2 focus:ring-[#F25C2B]"
                        >
                          <option value="11:30">11:30 AM</option>
                          <option value="12:00">12:00 PM</option>
                          <option value="13:00">1:00 PM</option>
                          <option value="17:30">5:30 PM</option>
                          <option value="18:00">6:00 PM</option>
                          <option value="19:00">7:00 PM</option>
                          <option value="20:00">8:00 PM</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-[#1C1917]">
                        Number of Guests
                      </label>
                      <select
                        value={resForm.guests}
                        onChange={(e) => setResForm({ ...resForm, guests: e.target.value })}
                        className="w-full rounded-none border-2 border-[#1C1917] bg-white px-3 py-2.5 text-sm text-[#1C1917] outline-none focus:ring-2 focus:ring-[#F25C2B]"
                      >
                        <option value="1">1 Person (Solo Dining)</option>
                        <option value="2">2 Persons (Couple)</option>
                        <option value="4">4 Persons (Small Party)</option>
                        <option value="6">6 Persons (Family)</option>
                        <option value="8">8 Persons (Full Table)</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      className="mt-2 w-full cursor-pointer rounded-none border-2 border-[#1C1917] bg-[#F25C2B] py-3.5 text-xs font-black uppercase tracking-widest text-white shadow-neo hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-neo-lg active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
                    >
                      Confirm Reservation
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS SECTION (Chính xác theo ảnh 3) ── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-20">
        <div className="text-center space-y-3 mb-12">
          {/* Top chat bubble icon with lines */}
          <div className="flex items-center justify-center gap-3">
            <div className="h-0.5 w-16 bg-stone-300" />
            <div className="rounded-full border border-stone-300 p-1 text-[#F25C2B]">
              <MessageSquare className="size-4" />
            </div>
            <div className="h-0.5 w-16 bg-stone-300" />
          </div>

          <h2 className="font-editorial text-3xl sm:text-5xl font-bold uppercase tracking-tight text-[#1C1917]">
            WHAT OUR GUESTS SAY
          </h2>
          <p className="text-sm text-stone-600 max-w-xl mx-auto">
            Don&apos;t just take our word for it — hear from our valued guests
          </p>
        </div>

        {/* 3 Testimonials Cards (Ảnh 3) */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* Card 1: Sarah Mitchell */}
          <div className="flex flex-col justify-between rounded-xs border-2 border-[#1C1917] bg-white p-6 sm:p-7 shadow-neo">
            <div>
              <div className="flex items-center gap-1 text-[#F25C2B] mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="size-4 fill-current" />
                ))}
              </div>
              <p className="text-xs sm:text-sm leading-relaxed text-stone-800 italic">
                &ldquo;An extraordinary culinary journey. Every dish tells a story, and the attention to detail is impeccable. A must-visit for any food enthusiast.&rdquo;
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-stone-200">
              <div className="font-bold text-sm text-[#1C1917]">Sarah Mitchell</div>
              <div className="text-xs text-stone-500">Food Critic, NY Times</div>
            </div>
          </div>

          {/* Card 2: James Rodriguez */}
          <div className="flex flex-col justify-between rounded-xs border-2 border-[#1C1917] bg-white p-6 sm:p-7 shadow-neo">
            <div>
              <div className="flex items-center gap-1 text-[#F25C2B] mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="size-4 fill-current" />
                ))}
              </div>
              <p className="text-xs sm:text-sm leading-relaxed text-stone-800 italic">
                &ldquo;We&apos;ve celebrated every anniversary here for the past 5 years. The ambiance, service, and food never disappoint. Simply the best in the city.&rdquo;
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-stone-200">
              <div className="font-bold text-sm text-[#1C1917]">James Rodriguez</div>
              <div className="text-xs text-stone-500">Regular Guest</div>
            </div>
          </div>

          {/* Card 3: Emily Chen */}
          <div className="flex flex-col justify-between rounded-xs border-2 border-[#1C1917] bg-white p-6 sm:p-7 shadow-neo">
            <div>
              <div className="flex items-center gap-1 text-[#F25C2B] mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="size-4 fill-current" />
                ))}
              </div>
              <p className="text-xs sm:text-sm leading-relaxed text-stone-800 italic">
                &ldquo;The Wagyu ribeye is hands down the best steak I&apos;ve ever had. Chef Marco&apos;s passion shines through in every bite. Absolutely phenomenal!&rdquo;
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-stone-200">
              <div className="font-bold text-sm text-[#1C1917]">Emily Chen</div>
              <div className="text-xs text-stone-500">Food Blogger</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── LOCATION MAP & VISIT SECTION ── */}
      <section id="contact" className="border-t-2 border-[#1C1917] bg-[#FDF9F3] py-20 px-4 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-12 items-center">
            <div className="space-y-6 lg:col-span-5">
              <div className="text-xs font-bold uppercase tracking-widest text-[#F25C2B]">
                Visit Us
              </div>
              <h2 className="font-editorial text-3xl sm:text-4xl font-bold tracking-tight text-[#1C1917]">
                FIND LA MAISON IN NEW YORK
              </h2>
              <p className="text-sm text-stone-700 leading-relaxed">
                Located in Manhattan&apos;s historic dining quarter, steps away from central subway connections with complimentary valet parking.
              </p>

              <div className="space-y-3 pt-2 text-sm">
                <div className="flex items-start gap-3">
                  <MapPin className="size-5 text-[#F25C2B] shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-[#1C1917]">123 Gourmet Street, West Village</div>
                    <div className="text-xs text-stone-600">New York, NY 10014</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="size-5 text-[#F25C2B] shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-[#1C1917]">+1 (555) 123-4567</div>
                    <div className="text-xs text-stone-600">Concierge & Private Dining Inquiries</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="size-5 text-[#F25C2B] shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-[#1C1917]">reservations@lamaison-nyc.com</div>
                    <div className="text-xs text-stone-600">Guaranteed response within 2 hours</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Visual Map Card */}
            <div className="lg:col-span-7">
              <div className="overflow-hidden rounded-xs border-2 border-[#1C1917] bg-white p-2 shadow-neo-lg">
                <div className="relative aspect-[16/9] w-full rounded-xs border border-stone-300 bg-[#E8E1D7] overflow-hidden">
                  {/* Styled Map background */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=1200&q=80"
                    alt="Map Location"
                    className="h-full w-full object-cover opacity-65 contrast-125"
                  />
                  {/* Map Pin overlay */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/10">
                    <div className="rounded-full bg-[#F25C2B] p-3 text-white border-2 border-[#1C1917] shadow-neo animate-bounce">
                      <MapPin className="size-7" />
                    </div>
                    <div className="mt-2 rounded-xs border-2 border-[#1C1917] bg-white px-3.5 py-1.5 text-xs font-bold text-[#1C1917] shadow-neo-sm">
                      La Maison NYC ★ 3 Michelin Stars
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t-2 border-[#1C1917] bg-[#140E08] text-white py-12 px-4 sm:px-6">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <div className="font-editorial text-2xl font-bold tracking-tight">La Maison</div>
            <p className="text-xs text-stone-400 mt-1">
              Excellence in every dish • 123 Gourmet Street, New York, NY
            </p>
          </div>

          <div className="flex items-center gap-6 text-xs text-stone-300 font-medium">
            <a href="#menu" className="hover:text-[#F25C2B]">Menu</a>
            <a href="#our-story" className="hover:text-[#F25C2B]">Our Story</a>
            <a href="#reservations" className="hover:text-[#F25C2B]">Reservations</a>
            <a href="/login" className="hover:text-[#F25C2B]">HNF Admin</a>
          </div>

          <div className="text-xs text-stone-500">
            © {new Date().getFullYear()} La Maison Restaurant. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
