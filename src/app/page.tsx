'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'
import {
  ShoppingCart,
  Menu,
  X,
  ArrowRight,
  Check,
  CheckCircle2,
  Star,
  Package,
  Boxes,
  Wallet,
  CreditCard,
  QrCode,
  Banknote,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  UserCog,
  Printer,
  MapPin,
  Store,
  Cloud,
  Smartphone,
  Globe,
  AlertTriangle,
  Zap,
  Clock,
  Mail,
  MessageCircle,
  Facebook,
  Instagram,
  Youtube,
  Play,
  FileText,
  Lock,
  KeyRound,
  Receipt,
  ScanLine,
  Grid3x3,
  HelpCircle,
  ChevronRight,
  Crown,
  Sparkles,
  TimerReset,
  CircleDollarSign,
  Send,
  Loader2,
  AlertCircle,
  ShieldCheck,
  User,
  Phone,
  RefreshCw,
  LogOut,
  Key,
  ExternalLink,
  Database,
} from 'lucide-react'

/* -------------------------------------------------------------------------- */
/*  Shared data                                                                */
/* -------------------------------------------------------------------------- */

const NAV_LINKS = [
  { label: 'Fitur', href: '#fitur' },
  { label: 'Cara Kerja', href: '#cara-kerja' },
  { label: 'Harga', href: '#harga' },
  { label: 'Pesan', href: '#order' },
  { label: 'Demo', href: '#demo' },
  { label: 'FAQ', href: '#faq' },
]

const WHATSAPP_URL = 'https://wa.me/6281572266150'
const WHATSAPP_FALLBACK_URL = 'https://wa.me/6281572266150?text=' + encodeURIComponent('Halo, saya mau order POS Kasir Sembako. Form order di web belum dikonfigurasi, tolong bantu order manual.')

// Ganti dengan URL Web App Anda (Deploy WebApp.gs → copy URL /exec).
// Lihat panduan di apps-script/auto-delivery/SETUP.md Bagian 2.
const WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbyFavhtnqZ7OsspMXqcGxC3w96XHOt-D3yj_5DhVKIGPo6UAQGjiVqcM7VY7Jhb-0h_hg/exec'

type OrderFormState = {
  nama: string
  email: string
  wa: string
  paket: string
  catatan: string
}

type OrderResult = { orderId: string } | null

/**
 * Submit form order ke Apps Script Web App via JSONP (menghindari CORS).
 * Browser execute as script tag → Apps Script wrap response as `callback({...});`.
 */
function submitOrderViaJsonp(params: Record<string, string>): Promise<{
  success: boolean
  orderId?: string
  message?: string
}> {
  return new Promise((resolve, reject) => {
    const cb = `orderCb_${Date.now()}_${Math.floor(Math.random() * 1000)}`
    const script = document.createElement('script')
    const timeout = setTimeout(() => {
      cleanup()
      reject(new Error('Koneksi timeout. Coba lagi.'))
    }, 20000)
    const cleanup = () => {
      clearTimeout(timeout)
      try {
        delete (window as unknown as Record<string, unknown>)[cb]
      } catch {
        ;(window as unknown as Record<string, unknown>)[cb] = undefined
      }
      script.remove()
    }
    ;(window as unknown as Record<string, (resp: unknown) => void>)[cb] = (
      response
    ) => {
      cleanup()
      resolve(response as { success: boolean; orderId?: string; message?: string })
    }
    const qs = new URLSearchParams({ ...params, callback: cb })
    script.src = `${WEBAPP_URL}?${qs.toString()}`
    script.onerror = () => {
      cleanup()
      reject(
        new Error('Gagal terhubung ke server. Coba lagi atau hubungi WhatsApp.')
      )
    }
    document.body.appendChild(script)
  })
}

/**
 * Fetch admin stats dari Apps Script Web App via JSONP (sama pattern
 * dengan submitOrderViaJsonp — hindari CORS).
 */
function fetchAdminStatsViaJsonp(token: string): Promise<AdminStats | { success: false; message: string }> {
  return new Promise((resolve, reject) => {
    const cb = `adminCb_${Date.now()}_${Math.floor(Math.random() * 1000)}`
    const script = document.createElement('script')
    const timeout = setTimeout(() => {
      cleanup()
      reject(new Error('Timeout menghubungi server admin.'))
    }, 20000)
    const cleanup = () => {
      clearTimeout(timeout)
      try {
        delete (window as unknown as Record<string, unknown>)[cb]
      } catch {
        ;(window as unknown as Record<string, unknown>)[cb] = undefined
      }
      script.remove()
    }
    ;(window as unknown as Record<string, (resp: unknown) => void>)[cb] = (
      response
    ) => {
      cleanup()
      resolve(response as AdminStats | { success: false; message: string })
    }
    const qs = new URLSearchParams({ action: 'admin', token, callback: cb })
    script.src = `${WEBAPP_URL}?${qs.toString()}`
    script.onerror = () => {
      cleanup()
      reject(new Error('Gagal terhubung ke server admin.'))
    }
    document.body.appendChild(script)
  })
}

type AdminRecentOrder = {
  orderId: string
  nama: string
  email: string
  paket: string
  status: string
  createdAt: string
}

type AdminStats = {
  success: true
  totals: { orders: number; pending: number; paid: number; revenue: number }
  keyPool: { available: number; assigned: number; total: number }
  recentOrders: AdminRecentOrder[]
  byPaket: { Starter: number; Pro: number; Enterprise: number }
  spreadsheetUrl: string
}

const PAKET_OPTIONS = [
  {
    name: 'Starter',
    price: 'Rp 150.000',
    desc: 'DIY install sendiri. Cocok untuk yang sudah terbiasa teknis.',
    popular: false,
  },
  {
    name: 'Pro',
    price: 'Rp 350.000',
    desc: 'Kami bantu install + branding nama toko & logo Anda.',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 'Rp 500.000',
    desc: 'Kustomisasi fitur khusus + training Zoom 1 jam.',
    popular: false,
  },
]

/* -------------------------------------------------------------------------- */
/*  Navbar                                                                    */
/* -------------------------------------------------------------------------- */

function Navbar() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/85 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        {/* Logo */}
        <a href="#top" className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-sm">
            <ShoppingCart className="size-5" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-sm font-bold text-slate-900">
              POS Kasir
            </span>
            <span className="text-[11px] font-medium text-orange-600">
              Sembako
            </span>
          </div>
        </a>

        {/* Desktop nav */}
        <div className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-orange-50 hover:text-orange-600"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Desktop CTA */}
        <div className="hidden md:block">
          <Button
            asChild
            className="bg-orange-500 text-white shadow-sm hover:bg-orange-600"
          >
            <a href="#order">
              Beli Sekarang
              <ArrowRight className="size-4" />
            </a>
          </Button>
        </div>

        {/* Mobile toggle */}
        <button
          className="inline-flex size-10 items-center justify-center rounded-md text-slate-700 hover:bg-orange-50 md:hidden"
          aria-label="Buka menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-slate-200 bg-white md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="flex items-center justify-between rounded-md px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-orange-50 hover:text-orange-600"
              >
                {link.label}
                <ChevronRight className="size-4 text-slate-400" />
              </a>
            ))}
            <Button
              asChild
              className="mt-2 bg-orange-500 text-white hover:bg-orange-600"
            >
              <a href="#order" onClick={() => setOpen(false)}>
                Beli Sekarang
                <ArrowRight className="size-4" />
              </a>
            </Button>
          </div>
        </div>
      )}
    </header>
  )
}

/* -------------------------------------------------------------------------- */
/*  Hero                                                                      */
/* -------------------------------------------------------------------------- */

function HeroDashboardMockup() {
  return (
    <div className="relative">
      {/* glow */}
      <div
        aria-hidden
        className="absolute -inset-4 rounded-3xl bg-gradient-to-tr from-orange-300/40 via-amber-200/40 to-orange-200/30 blur-2xl"
      />
      <Card className="relative overflow-hidden rounded-2xl border-slate-200 p-0 shadow-2xl shadow-orange-500/10">
        {/* top bar */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-md bg-gradient-to-br from-orange-500 to-amber-500 text-white">
              <ShoppingCart className="size-4" />
            </div>
            <div className="leading-none">
              <p className="text-xs font-bold text-slate-900">POS Kasir</p>
              <p className="text-[10px] text-slate-500">Toko Sembako Sentosa</p>
            </div>
          </div>
          <div className="hidden items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-medium text-emerald-700 sm:flex">
            <Cloud className="size-3" />
            Cloud Synced
          </div>
        </div>

        {/* body */}
        <div className="grid grid-cols-1 gap-0 sm:grid-cols-5">
          {/* product list */}
          <div className="sm:col-span-3 sm:border-r sm:border-slate-200">
            <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-2.5">
              <div className="flex flex-1 items-center gap-2 rounded-md border border-slate-200 bg-white px-2.5 py-1.5">
                <ScanLine className="size-3.5 text-orange-500" />
                <span className="text-[11px] text-slate-400">
                  Cari produk / scan barcode...
                </span>
              </div>
            </div>
            <ul className="divide-y divide-slate-100">
              {[
                {
                  name: 'Beras Premium 10kg',
                  price: 'Rp 65.000',
                  stock: 8,
                  bar: 'bg-orange-500',
                  w: 'w-[80%]',
                },
                {
                  name: 'Minyak Goreng 2L',
                  price: 'Rp 38.000',
                  stock: 12,
                  bar: 'bg-amber-500',
                  w: 'w-[92%]',
                },
                {
                  name: 'Gula Pasir 1kg',
                  price: 'Rp 15.000',
                  stock: 25,
                  bar: 'bg-orange-400',
                  w: 'w-[100%]',
                },
                {
                  name: 'Telur Ayam 1kg',
                  price: 'Rp 28.000',
                  stock: 4,
                  bar: 'bg-red-400',
                  w: 'w-[40%]',
                },
              ].map((p) => (
                <li
                  key={p.name}
                  className="flex items-center justify-between px-4 py-2.5 hover:bg-orange-50/40"
                >
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-slate-800">
                      {p.name}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <div className="h-1 w-16 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full rounded-full ${p.bar} ${p.w}`}
                        />
                      </div>
                      <span className="text-[10px] text-slate-400">
                        Stok {p.stock}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-slate-900">
                    {p.price}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* cart */}
          <div className="bg-slate-50/60 sm:col-span-2">
            <div className="flex items-center justify-between px-4 py-2.5">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                <ShoppingCart className="size-3.5 text-orange-500" />
                Keranjang (3)
              </span>
              <span className="text-[10px] text-slate-400">Kasir: Admin</span>
            </div>
            <ul className="space-y-1.5 px-3">
              {[
                { n: 'Beras Premium 10kg', q: 'x1', t: 'Rp 65.000' },
                { n: 'Minyak Goreng 2L', q: 'x1', t: 'Rp 38.000' },
                { n: 'Gula Pasir 1kg', q: 'x1', t: 'Rp 15.000' },
              ].map((i) => (
                <li
                  key={i.n}
                  className="flex items-center justify-between rounded-md bg-white px-2.5 py-2 text-[11px] shadow-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-800">
                      {i.n}
                    </p>
                    <p className="text-slate-400">{i.q}</p>
                  </div>
                  <span className="font-semibold text-slate-900">{i.t}</span>
                </li>
              ))}
            </ul>
            <div className="mt-2 space-y-1 px-4 py-2 text-[11px]">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal</span>
                <span>Rp 118.000</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Diskon</span>
                <span>Rp 0</span>
              </div>
              <div className="flex items-center justify-between border-t border-dashed border-slate-200 pt-1.5 text-sm font-bold text-slate-900">
                <span>Total</span>
                <span className="text-orange-600">Rp 118.000</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-1.5 px-3 pb-3">
              <button className="flex flex-col items-center gap-0.5 rounded-md bg-orange-500 py-1.5 text-[10px] font-medium text-white">
                <Banknote className="size-3.5" />
                Tunai
              </button>
              <button className="flex flex-col items-center gap-0.5 rounded-md bg-white py-1.5 text-[10px] font-medium text-slate-600 ring-1 ring-slate-200">
                <QrCode className="size-3.5" />
                QRIS
              </button>
              <button className="flex flex-col items-center gap-0.5 rounded-md bg-white py-1.5 text-[10px] font-medium text-slate-600 ring-1 ring-slate-200">
                <CreditCard className="size-3.5" />
                Transfer
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* floating badge */}
      <div className="absolute -left-3 top-1/2 hidden -translate-y-1/2 rotate-3 rounded-xl bg-white p-2.5 shadow-lg ring-1 ring-slate-100 lg:block">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="size-4" />
          </div>
          <div className="leading-none">
            <p className="text-[10px] text-slate-400">Transaksi sukses</p>
            <p className="text-xs font-bold text-slate-900">+Rp 118.000</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function Hero() {
  return (
    <section
      id="top"
      className="relative overflow-hidden bg-gradient-to-b from-orange-50 via-amber-50 to-white scroll-mt-16"
    >
      {/* decorative blobs */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-orange-200/50 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 top-40 size-72 rounded-full bg-amber-200/40 blur-3xl"
      />

      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 lg:grid-cols-2 lg:py-24">
        {/* Left copy */}
        <div>
          <Badge className="mb-5 gap-1.5 rounded-full border-orange-200 bg-orange-100/70 px-3 py-1 text-orange-700">
            <Sparkles className="size-3.5" />
            Aplikasi Kasir Sembako Modern
          </Badge>

          <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
            Kelola Toko Sembako Anda{' '}
            <span className="bg-gradient-to-r from-orange-600 to-amber-500 bg-clip-text text-transparent">
              Lebih Cepat &amp; Akurat
            </span>
          </h1>

          <p className="mt-5 text-lg font-medium text-slate-700">
            Kelola Toko Sembako Lebih Cepat, Akurat, &amp; Modern.
          </p>
          <p className="mt-2 max-w-xl text-base text-slate-600">
            Aplikasi Kasir Cloud-Based. Tanpa Server. Tanpa Langganan Bulanan.
            Sekali Bayar, Milik Selamanya.
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="bg-orange-500 text-white shadow-lg shadow-orange-500/30 hover:bg-orange-600"
            >
              <a href="#order">
                Beli Sekarang — Mulai Rp 150.000
                <ArrowRight className="size-4" />
              </a>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-slate-300 bg-white text-slate-800 hover:bg-orange-50 hover:text-orange-600"
            >
              <a href="#demo">
                <Play className="size-4" />
                Lihat Demo
              </a>
            </Button>
          </div>

          {/* trust badges */}
          <ul className="mt-8 flex flex-wrap gap-x-5 gap-y-2.5">
            {[
              { icon: Lock, label: '100% Milik Anda' },
              { icon: Cloud, label: 'Gratis Hosting Selamanya' },
              { icon: Globe, label: 'Bahasa Indonesia Penuh' },
              { icon: TimerReset, label: 'Tanpa Langganan Bulanan' },
            ].map(({ icon: Icon, label }) => (
              <li
                key={label}
                className="flex items-center gap-1.5 text-sm font-medium text-slate-700"
              >
                <Icon className="size-4 text-orange-500" />
                {label}
              </li>
            ))}
          </ul>
        </div>

        {/* Right mockup */}
        <div className="lg:pl-6">
          <HeroDashboardMockup />
        </div>
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------------- */
/*  Stats bar                                                                 */
/* -------------------------------------------------------------------------- */

function StatsBar() {
  const stats = [
    {
      icon: Store,
      value: '500+',
      label: 'Toko Pakai',
    },
    {
      icon: CircleDollarSign,
      value: 'Rp 0',
      label: 'Biaya Server',
    },
    {
      icon: Star,
      value: '4.9/5',
      label: 'Rating Pengguna',
    },
    {
      icon: Cloud,
      value: '24/7',
      label: 'Akses Cloud',
    },
  ]
  return (
    <section className="border-y border-slate-200 bg-white">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px bg-slate-200 lg:grid-cols-4">
        {stats.map(({ icon: Icon, value, label }) => (
          <div
            key={label}
            className="flex flex-col items-center justify-center gap-2 bg-white px-4 py-8 text-center"
          >
            <div className="flex size-11 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
              <Icon className="size-5" />
            </div>
            <p className="text-2xl font-extrabold text-slate-900">{value}</p>
            <p className="text-xs font-medium text-slate-500">{label}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------------- */
/*  Problems                                                                  */
/* -------------------------------------------------------------------------- */

function Problems() {
  const problems = [
    {
      title: 'Catat Manual di Buku',
      desc: 'Catat penjualan manual di buku, susah direkap di akhir hari.',
    },
    {
      title: 'Stok Sering Hilang',
      desc: 'Stok barang sering hilang atau lupa di-restock tepat waktu.',
    },
    {
      title: 'Sulit Lihat Laba-Rugi',
      desc: 'Sulit melihat laba-rugi harian dan mingguan dengan akurat.',
    },
    {
      title: 'Kasir Lama Hitung',
      desc: 'Kasir butuh lama hitung total & kembalian, antrean membludak.',
    },
  ]
  return (
    <section className="bg-slate-50 py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mx-auto max-w-2xl text-center">
          <Badge className="mb-4 gap-1.5 rounded-full border-red-200 bg-red-50 px-3 py-1 text-red-600">
            <AlertTriangle className="size-3.5" />
            Sudah Lelah Dengan...
          </Badge>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Masalah Toko Sembako Tradisional
          </h2>
          <p className="mt-3 text-slate-600">
            Mengelola toko sembako dengan cara lama penuh kendala. Saatnya
            beralih ke cara yang lebih modern.
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {problems.map((p) => (
            <Card
              key={p.title}
              className="gap-0 border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="mb-3 flex size-11 items-center justify-center rounded-xl bg-red-50 text-red-500">
                <AlertTriangle className="size-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">{p.title}</h3>
              <p className="mt-1.5 text-sm text-slate-600">{p.desc}</p>
            </Card>
          ))}
        </div>

        {/* transition */}
        <div className="mx-auto mt-12 max-w-3xl rounded-2xl border border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50 p-6 text-center">
          <p className="text-lg font-semibold text-slate-800">
            <span className="text-orange-600">POS Kasir Sembako</span> hadir
            sebagai solusi modern untuk toko Anda.
          </p>
        </div>
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------------- */
/*  Features grid                                                             */
/* -------------------------------------------------------------------------- */

function Features() {
  const features = [
    {
      icon: ScanLine,
      title: 'Scan Barcode Produk',
      desc: 'Dukungan barcode scanner untuk input produk super cepat.',
    },
    {
      icon: Wallet,
      title: 'Multi Metode Bayar',
      desc: 'Tunai, QRIS, Transfer, dan Tempo (utang) dalam satu kasir.',
    },
    {
      icon: Boxes,
      title: 'Manajemen Stok Otomatis',
      desc: 'Stok berkurang otomatis setiap kali transaksi selesai.',
    },
    {
      icon: Users,
      title: 'Pelanggan Retail & Grosir',
      desc: 'Harga berbeda untuk pelanggan retail dan grosir.',
    },
    {
      icon: BarChart3,
      title: 'Laporan Penjualan Real-time',
      desc: 'Dashboard live, langsung export ke Excel kapan saja.',
    },
    {
      icon: TrendingUp,
      title: 'Cash Flow (Mutasi)',
      desc: 'Pantau uang masuk, keluar, dan net dengan rapi.',
    },
    {
      icon: UserCog,
      title: 'Multi User (Admin/Kasir/Owner)',
      desc: 'Role-based access control untuk keamanan penuh.',
    },
    {
      icon: Printer,
      title: 'Struk Cetak Thermal',
      desc: 'Support printer thermal 58mm untuk struk penjualan.',
    },
    {
      icon: Grid3x3,
      title: 'Inventory 6 Stat Cards',
      desc: 'Total produk, stok menipis, nilai stok, dan lainnya.',
    },
    {
      icon: MapPin,
      title: 'Lokasi Rak Produk',
      desc: 'Tracking produk per rak, gampang cari barang.',
    },
    {
      icon: CreditCard,
      title: 'Limit Kredit Pelanggan',
      desc: 'Kontrol piutang pelanggan grosir dengan limit kredit.',
    },
    {
      icon: Smartphone,
      title: 'Cloud-Based Mobile',
      desc: 'Akses dari HP, tablet, laptop di mana saja dan kapan saja.',
    },
  ]
  return (
    <section id="fitur" className="scroll-mt-16 bg-white py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mx-auto max-w-2xl text-center">
          <Badge className="mb-4 gap-1.5 rounded-full border-orange-200 bg-orange-50 px-3 py-1 text-orange-600">
            <Zap className="size-3.5" />
            Fitur Lengkap
          </Badge>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Semua yang Toko Sembako Anda Butuhkan
          </h2>
          <p className="mt-3 text-slate-600">
            12 fitur utama yang dirancang khusus untuk operasional toko sembako,
            warung, dan toko kelontong kecil.
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {features.map(({ icon: Icon, title, desc }) => (
            <Card
              key={title}
              className="group gap-0 border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:border-orange-200 hover:shadow-md hover:shadow-orange-500/5"
            >
              <div className="mb-3 flex size-11 items-center justify-center rounded-xl bg-orange-50 text-orange-500 transition-colors group-hover:bg-orange-500 group-hover:text-white">
                <Icon className="size-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">{title}</h3>
              <p className="mt-1.5 text-sm text-slate-600">{desc}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------------- */
/*  How it works                                                              */
/* -------------------------------------------------------------------------- */

function HowItWorks() {
  const steps = [
    {
      icon: ShoppingBag,
      step: '01',
      title: 'Beli & Dapatkan Source Code',
      desc: 'Bayar sekali, dapat source code lengkap + license key langsung via email.',
    },
    {
      icon: FileText,
      step: '02',
      title: 'Install di Google Apps Script',
      desc: '5 menit setup, ikuti panduan PDF langkah demi langkah yang jelas.',
    },
    {
      icon: KeyRound,
      step: '03',
      title: 'Login & Mulai Transaksi',
      desc: 'Login sebagai admin, ganti password, langsung transaksi pertama.',
    },
  ]
  return (
    <section
      id="cara-kerja"
      className="scroll-mt-16 bg-slate-50 py-20 lg:py-24"
    >
      <div className="mx-auto max-w-7xl px-4">
        <div className="mx-auto max-w-2xl text-center">
          <Badge className="mb-4 gap-1.5 rounded-full border-orange-200 bg-orange-50 px-3 py-1 text-orange-600">
            <Clock className="size-3.5" />
            Mulai dalam 5 Menit
          </Badge>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Cara Kerja Sangat Mudah
          </h2>
          <p className="mt-3 text-slate-600">
            Tiga langkah simpel dari pembelian sampai transaksi pertama Anda.
          </p>
        </div>

        <div className="relative mt-14 grid gap-8 md:grid-cols-3">
          {/* connecting line */}
          <div
            aria-hidden
            className="absolute left-0 right-0 top-12 hidden h-0.5 bg-gradient-to-r from-orange-200 via-amber-200 to-orange-200 md:block"
          />
          {steps.map(({ icon: Icon, step, title, desc }, i) => (
            <div key={step} className="relative flex flex-col items-center text-center">
              <div className="relative z-10 flex size-24 items-center justify-center rounded-full bg-white shadow-md ring-1 ring-slate-100">
                <div className="flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-amber-500 text-white">
                  <Icon className="size-7" />
                </div>
                <span className="absolute -right-1 -top-1 flex size-7 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                  {step}
                </span>
              </div>
              <h3 className="mt-5 text-lg font-bold text-slate-900">{title}</h3>
              <p className="mt-2 max-w-xs text-sm text-slate-600">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* small local icon import alias to avoid clutter */
function ShoppingBag(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  )
}

/* -------------------------------------------------------------------------- */
/*  Pricing                                                                   */
/* -------------------------------------------------------------------------- */

function CheckItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2.5 text-sm text-slate-700">
      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-orange-500" />
      <span>{children}</span>
    </li>
  )
}

function Pricing({ onSelectPaket }: { onSelectPaket: (paket: string) => void }) {
  const plans = [
    {
      name: 'Starter',
      price: 'Rp 150.000',
      tag: 'SATU KALI BAYAR',
      popular: false,
      desc: 'Untuk toko yang ingin DIY install sendiri.',
      features: [
        'Source code (Code.gs + blogger.html + license.html)',
        'Panduan install PDF',
        '1 bulan support WhatsApp',
        'License key untuk 1 toko',
        'Update minor gratis selama 1 bulan',
      ],
      cta: 'Pilih Starter',
    },
    {
      name: 'Pro',
      price: 'Rp 350.000',
      tag: 'PALING POPULER',
      popular: true,
      desc: 'Paling banyak dipilih, kami bantu install sampai jalan.',
      features: [
        'Semua fitur Starter',
        'Setup bantu install (kami install untuk Anda)',
        'Kustom nama toko & logo',
        '3 bulan support WhatsApp',
        'License key untuk 1 toko',
        'Update minor gratis selama 3 bulan',
      ],
      cta: 'Pilih Pro',
    },
    {
      name: 'Enterprise',
      price: 'Rp 500.000',
      tag: 'SATU KALI BAYAR',
      popular: false,
      desc: 'Untuk toko dengan kebutuhan kustomisasi khusus.',
      features: [
        'Semua fitur Pro',
        'Kustomisasi fitur khusus',
        '6 bulan support prioritas',
        'Training Zoom 1 jam',
        'License key untuk 1 toko',
        'Update minor gratis selama 6 bulan',
      ],
      cta: 'Pilih Enterprise',
    },
  ]

  return (
    <section id="harga" className="scroll-mt-16 bg-white py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mx-auto max-w-2xl text-center">
          <Badge className="mb-4 gap-1.5 rounded-full border-orange-200 bg-orange-50 px-3 py-1 text-orange-600">
            <CircleDollarSign className="size-3.5" />
            Harga Transparan
          </Badge>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Pilih Paket Sesuai Kebutuhan
          </h2>
          <p className="mt-3 text-slate-600">
            Bayar sekali, milik selamanya. Tanpa biaya bulanan, tanpa biaya
            server.
          </p>
        </div>

        <div className="mt-12 grid items-stretch gap-6 lg:grid-cols-3">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={[
                'relative flex flex-col gap-0 border-2 bg-white p-6 transition-all',
                plan.popular
                  ? 'border-orange-500 shadow-xl shadow-orange-500/10 lg:-translate-y-3 lg:scale-[1.03]'
                  : 'border-slate-200 shadow-sm hover:border-orange-200 hover:shadow-md',
              ].join(' ')}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="flex items-center gap-1 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-1 text-xs font-bold text-white shadow-md">
                    <Crown className="size-3.5" />
                    PALING POPULER
                  </span>
                </div>
              )}

              <div className="mb-4">
                <p className="text-sm font-bold uppercase tracking-wide text-orange-600">
                  {plan.name}
                </p>
                <p className="mt-1 text-xs font-medium text-slate-500">
                  {plan.desc}
                </p>
              </div>

              <div className="mb-2">
                <span className="text-3xl font-extrabold text-slate-900">
                  {plan.price}
                </span>
              </div>
              <span
                className={[
                  'mb-5 inline-flex w-fit items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold',
                  plan.popular
                    ? 'bg-orange-100 text-orange-700'
                    : 'bg-slate-100 text-slate-600',
                ].join(' ')}
              >
                {plan.tag}
              </span>

              <ul className="mb-6 space-y-2.5">
                {plan.features.map((f) => (
                  <CheckItem key={f}>{f}</CheckItem>
                ))}
              </ul>

              <Button
                asChild
                className={[
                  'mt-auto w-full',
                  plan.popular
                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30 hover:bg-orange-600'
                    : 'bg-slate-900 text-white hover:bg-slate-800',
                ].join(' ')}
              >
                <a
                  href="#order"
                  onClick={() => onSelectPaket(plan.name)}
                >
                  {plan.cta}
                  <ArrowRight className="size-4" />
                </a>
              </Button>
            </Card>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-slate-500">
          Semua harga <span className="font-semibold text-slate-700">sekali bayar</span>. Tanpa biaya bulanan. Tanpa biaya server.
        </p>
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------------- */
/*  Order Form (Web App integration)                                          */
/* -------------------------------------------------------------------------- */

function OrderSection({
  form,
  setForm,
  submitting,
  result,
  error,
  onSubmit,
  onDismissError,
  onReset,
}: {
  form: OrderFormState
  setForm: React.Dispatch<React.SetStateAction<OrderFormState>>
  submitting: boolean
  result: OrderResult
  error: string | null
  onSubmit: () => void
  onDismissError: () => void
  onReset: () => void
}) {
  // Pre-filled WhatsApp link after successful order
  const waConfirmUrl = result
    ? `https://wa.me/6281572266150?text=${encodeURIComponent(
        `Halo, saya sudah order POS Kasir (Order ID: ${result.orderId}). Berikut bukti transfer saya:`
      )}`
    : WHATSAPP_URL

  return (
    <section id="order" className="scroll-mt-16 bg-slate-50 py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4">
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center">
          <Badge className="mb-4 gap-1.5 rounded-full border-orange-200 bg-orange-50 px-3 py-1 text-orange-600">
            <Send className="size-3.5" />
            PESAN SEKARANG
          </Badge>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Langsung Order di Sini
          </h2>
          <p className="mt-3 text-slate-600">
            Isi form, instruksi pembayaran dikirim otomatis ke email Anda.
            License key dikirim setelah pembayaran dikonfirmasi.
          </p>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-5">
          {/* LEFT: Form card (3 cols) */}
          <div className="lg:col-span-3">
            <Card className="gap-0 border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              {result ? (
                /* ----- SUCCESS STATE ----- */
                <div className="flex flex-col items-center text-center">
                  <div className="flex size-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-500">
                    <CheckCircle2 className="size-9" />
                  </div>
                  <h3 className="mt-4 text-2xl font-extrabold text-slate-900">
                    Order Diterima!
                  </h3>
                  <p className="mt-2 text-sm text-slate-600">
                    Simpan Order ID Anda. Cek email untuk instruksi pembayaran.
                  </p>
                  <div className="mt-4 rounded-lg border border-orange-200 bg-orange-50 px-4 py-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-orange-600">
                      Order ID
                    </span>
                    <p className="mt-0.5 font-mono text-lg font-bold text-orange-700">
                      {result.orderId}
                    </p>
                  </div>

                  <ul className="mt-6 w-full space-y-3 text-left text-sm text-slate-700">
                    {[
                      'Cek email Anda untuk instruksi pembayaran (cek folder spam juga).',
                      'Transfer sesuai paket yang dipilih (bank / QRIS / e-wallet).',
                      'Kirim bukti transfer via WhatsApp 0815-7226-6150.',
                      'License key dikirim otomatis setelah pembayaran dikonfirmasi.',
                    ].map((step, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-orange-500 text-[11px] font-bold text-white">
                          {i + 1}
                        </span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-7 flex w-full flex-col gap-3 sm:flex-row">
                    <Button
                      asChild
                      className="bg-orange-500 text-white shadow-lg shadow-orange-500/30 hover:bg-orange-600"
                    >
                      <a
                        href={waConfirmUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <MessageCircle className="size-4" />
                        Chat WhatsApp
                      </a>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={onReset}
                      className="border-slate-300 bg-white text-slate-700 hover:bg-orange-50 hover:text-orange-600"
                    >
                      Buat Order Baru
                    </Button>
                  </div>
                </div>
              ) : (
                /* ----- FORM ----- */
                <form
                  className="space-y-5"
                  onSubmit={(e) => {
                    e.preventDefault()
                    onSubmit()
                  }}
                >
                  {/* Error alert */}
                  {error && (
                    <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                      <AlertCircle className="mt-0.5 size-4 shrink-0" />
                      <span className="flex-1">{error}</span>
                      <button
                        type="button"
                        onClick={onDismissError}
                        aria-label="Tutup pesan error"
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  )}

                  {/* Nama */}
                  <div className="space-y-1.5">
                    <Label htmlFor="order-nama" className="text-slate-800">
                      Nama Lengkap
                    </Label>
                    <div className="relative">
                      <User className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        id="order-nama"
                        type="text"
                        autoComplete="name"
                        placeholder="cth: Budi Santoso"
                        required
                        minLength={2}
                        maxLength={100}
                        value={form.nama}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, nama: e.target.value }))
                        }
                        className="pl-9"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5">
                    <Label htmlFor="order-email" className="text-slate-800">
                      Email
                    </Label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        id="order-email"
                        type="email"
                        autoComplete="email"
                        placeholder="email@anda.com"
                        required
                        value={form.email}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, email: e.target.value }))
                        }
                        className="pl-9"
                      />
                    </div>
                    <p className="text-xs text-slate-500">
                      License key akan dikirim ke email ini
                    </p>
                  </div>

                  {/* WhatsApp */}
                  <div className="space-y-1.5">
                    <Label htmlFor="order-wa" className="text-slate-800">
                      Nomor WhatsApp{' '}
                      <span className="font-normal text-slate-400">
                        (opsional)
                      </span>
                    </Label>
                    <div className="relative">
                      <Phone className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        id="order-wa"
                        type="tel"
                        autoComplete="tel"
                        inputMode="numeric"
                        placeholder="08xxxxxxxxxx"
                        value={form.wa}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, wa: e.target.value }))
                        }
                        className="pl-9"
                      />
                    </div>
                    <p className="text-xs text-slate-500">
                      Untuk mempercepat konfirmasi pembayaran
                    </p>
                  </div>

                  {/* Paket */}
                  <div className="space-y-1.5">
                    <Label className="text-slate-800">Paket</Label>
                    <div
                      role="radiogroup"
                      aria-label="Pilih paket"
                      className="grid gap-2.5 sm:grid-cols-3"
                    >
                      {PAKET_OPTIONS.map((p) => {
                        const selected = form.paket === p.name
                        return (
                          <button
                            key={p.name}
                            type="button"
                            role="radio"
                            aria-checked={selected}
                            onClick={() =>
                              setForm((f) => ({ ...f, paket: p.name }))
                            }
                            className={[
                              'relative flex flex-col gap-1 rounded-lg border-2 p-3 text-left transition-all',
                              selected
                                ? 'border-orange-500 bg-orange-50 ring-1 ring-orange-500'
                                : 'border-slate-200 bg-white hover:border-orange-200 hover:bg-orange-50/40',
                            ].join(' ')}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-bold text-slate-900">
                                {p.name}
                              </span>
                              {p.popular && (
                                <Badge className="bg-orange-500 px-1.5 py-0 text-[9px] font-bold uppercase text-white">
                                  Populer
                                </Badge>
                              )}
                              {selected && (
                                <CheckCircle2 className="size-4 text-orange-500" />
                              )}
                            </div>
                            <span className="text-xs font-semibold text-orange-600">
                              {p.price}
                            </span>
                            <span className="text-[11px] leading-snug text-slate-500">
                              {p.desc}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Catatan */}
                  <div className="space-y-1.5">
                    <Label htmlFor="order-catatan" className="text-slate-800">
                      Catatan{' '}
                      <span className="font-normal text-slate-400">
                        (opsional)
                      </span>
                    </Label>
                    <Textarea
                      id="order-catatan"
                      rows={3}
                      maxLength={500}
                      placeholder="Pertanyaan atau permintaan khusus..."
                      value={form.catatan}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, catatan: e.target.value }))
                      }
                    />
                  </div>

                  {/* Submit */}
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-orange-500 text-white shadow-lg shadow-orange-500/30 hover:bg-orange-600 disabled:opacity-60"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Mengirim...
                      </>
                    ) : (
                      <>
                        <Send className="size-4" />
                        Kirim Order Sekarang
                      </>
                    )}
                  </Button>

                  <p className="flex items-center justify-center gap-1.5 text-center text-xs text-slate-500">
                    <ShieldCheck className="size-3.5 text-emerald-500" />
                    Data Anda aman &amp; hanya dipakai untuk proses order.
                  </p>
                </form>
              )}
            </Card>
          </div>

          {/* RIGHT: Info panel (2 cols) */}
          <div className="space-y-6 lg:col-span-2">
            {/* Cara Pembayaran */}
            <Card className="gap-0 border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-slate-900">
                <CreditCard className="size-4 text-orange-500" />
                Cara Pembayaran
              </h3>
              <ol className="space-y-3">
                {[
                  'Isi form order di samping',
                  'Cek email — instruksi pembayaran otomatis terkirim',
                  'Transfer bank / QRIS / e-wallet',
                  'Kirim bukti transfer via WhatsApp → license key dikirim otomatis',
                ].map((step, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-slate-700">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-orange-500 text-[11px] font-bold text-white">
                      {i + 1}
                    </span>
                    <span className="leading-snug">{step}</span>
                  </li>
                ))}
              </ol>
            </Card>

            {/* Butuh Bantuan */}
            <Card className="gap-0 border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-slate-900">
                <MessageCircle className="size-4 text-orange-500" />
                Butuh Bantuan?
              </h3>
              <p className="mb-4 text-sm text-slate-600">
                Tim kami siap membantu proses order, instalasi, atau pertanyaan
                teknis lainnya.
              </p>
              <Button
                asChild
                className="w-full bg-orange-500 text-white shadow-sm hover:bg-orange-600"
              >
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="size-4" />
                  Chat WhatsApp: 0815-7226-6150
                </a>
              </Button>
              <a
                href="mailto:dankhamdan@gmail.com"
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600"
              >
                <Mail className="size-4" />
                dankhamdan@gmail.com
              </a>
              <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-slate-500">
                <Clock className="size-3.5 text-orange-500" />
                Cepat dijam kerja 08.00–21.00 WIB
              </p>
            </Card>

            {/* Trust note */}
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center">
              <p className="flex items-center justify-center gap-1.5 text-sm font-semibold text-emerald-700">
                <ShieldCheck className="size-4" />
                100% garansi
              </p>
              <p className="mt-1 text-xs text-emerald-600">
                License key valid atau uang kembali
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------------- */
/*  Demo                                                                      */
/* -------------------------------------------------------------------------- */

function DemoMockup() {
  const bars = [40, 65, 50, 80, 70, 95, 60]
  const days = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']
  return (
    <Card className="overflow-hidden rounded-2xl border-slate-200 p-0 shadow-2xl shadow-orange-500/10">
      {/* header */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-3">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-md bg-gradient-to-br from-orange-500 to-amber-500 text-white">
            <BarChart3 className="size-4" />
          </div>
          <div className="leading-none">
            <p className="text-sm font-bold text-slate-900">Dashboard Owner</p>
            <p className="text-[10px] text-slate-500">Periode: Okt 2025</p>
          </div>
        </div>
        <Badge className="bg-emerald-50 text-emerald-700">Live</Badge>
      </div>

      {/* stat cards */}
      <div className="grid grid-cols-2 gap-3 p-5 lg:grid-cols-4">
        {[
          { icon: CircleDollarSign, label: 'Omzet Hari Ini', value: 'Rp 1,8jt', trend: '+12%', up: true },
          { icon: Receipt, label: 'Transaksi', value: '47', trend: '+8', up: true },
          { icon: Package, label: 'Item Terjual', value: '128', trend: '+5%', up: true },
          { icon: AlertTriangle, label: 'Stok Menipis', value: '6', trend: '-2', up: false },
        ].map(({ icon: Icon, label, value, trend, up }) => (
          <div
            key={label}
            className="rounded-xl border border-slate-200 bg-white p-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex size-7 items-center justify-center rounded-md bg-orange-50 text-orange-500">
                <Icon className="size-4" />
              </div>
              <span
                className={[
                  'flex items-center gap-0.5 text-[10px] font-semibold',
                  up ? 'text-emerald-600' : 'text-red-500',
                ].join(' ')}
              >
                {up ? (
                  <TrendingUp className="size-3" />
                ) : (
                  <TrendingDown className="size-3" />
                )}
                {trend}
              </span>
            </div>
            <p className="mt-2 text-[11px] text-slate-500">{label}</p>
            <p className="text-base font-bold text-slate-900">{value}</p>
          </div>
        ))}
      </div>

      {/* chart */}
      <div className="px-5 pb-5">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-700">
              Penjualan Mingguan
            </p>
            <span className="text-[10px] text-slate-400">7 hari terakhir</span>
          </div>
          <div className="flex h-32 items-end justify-between gap-2">
            {bars.map((h, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
                <div className="flex w-full flex-1 items-end">
                  <div
                    className="w-full rounded-t-md bg-gradient-to-t from-orange-500 to-amber-400"
                    style={{ height: `${h}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-400">{days[i]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  )
}

function Demo() {
  return (
    <section id="demo" className="scroll-mt-16 bg-slate-50 py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="order-2 lg:order-1">
            <DemoMockup />
          </div>
          <div className="order-1 lg:order-2">
            <Badge className="mb-4 gap-1.5 rounded-full border-orange-200 bg-orange-50 px-3 py-1 text-orange-600">
              <Play className="size-3.5" />
              Coba Sebelum Beli
            </Badge>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Lihat Aplikasi Sebelum Membeli
            </h2>
            <p className="mt-3 text-lg text-slate-600">
              Coba demo gratis 7 hari, tanpa kartu kredit. Rasakan langsung
              kelancaran dan fitur lengkap aplikasi POS Kasir Sembako.
            </p>

            <ul className="mt-6 space-y-2.5">
              {[
                'Akses dashboard lengkap selama 7 hari',
                'Tanpa kartu kredit, tanpa komitmen',
                'Data demo sudah terisi, langsung bisa dipakai',
                'Cocok untuk uji coba bersama tim toko Anda',
              ].map((t) => (
                <li
                  key={t}
                  className="flex items-start gap-2.5 text-sm text-slate-700"
                >
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-orange-500" />
                  {t}
                </li>
              ))}
            </ul>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="bg-orange-500 text-white shadow-lg shadow-orange-500/30 hover:bg-orange-600"
              >
                <a href="https://script.google.com/a/~/macros/s/AKfycbyrNhBxZ0w61uoqpDmxFvcJVh_MHsfXZVCDnqjN7Cf2qMDV9RY-3OS6A_1OaKQhHZZW/exec" target="_blank" rel="noopener noreferrer">
  <Sparkles className="size-4" />
  Coba Demo Gratis 7 Hari
</a>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-slate-300 bg-white text-slate-800 hover:bg-orange-50 hover:text-orange-600"
              >
                <a href="/demo-tour.webm" target="_blank" rel="noopener noreferrer">
  <Play className="size-4" />
  Lihat Video Demo
</a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------------- */
/*  Testimonials                                                              */
/* -------------------------------------------------------------------------- */

function Testimonials() {
  const items = [
    {
      quote:
        'Mantap, kasir jadi lebih cepat. Pelanggan gak ngantre lama. Transaksi selesai dalam hitungan detik.',
      name: 'Pak Budi',
      store: 'Toko Sembako Sentosa',
      initial: 'B',
    },
    {
      quote:
        'Stok gak pernah kehabisan lagi. Notifikasi stok menipis sangat membantu saya restock tepat waktu.',
      name: 'Ibu Siti',
      store: 'Warung Berkah',
      initial: 'S',
    },
    {
      quote:
        'Laporan harian bikin gampang kontrol untung. Worth it banget buat toko sembako seperti saya!',
      name: 'Pak Joko',
      store: 'Toko Maju Jaya',
      initial: 'J',
    },
  ]
  return (
    <section className="bg-white py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mx-auto max-w-2xl text-center">
          <Badge className="mb-4 gap-1.5 rounded-full border-orange-200 bg-orange-50 px-3 py-1 text-orange-600">
            <Star className="size-3.5" />
            Testimoni Pengguna
          </Badge>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Dipercaya 500+ Toko Sembako
          </h2>
          <p className="mt-3 text-slate-600">
            Cerita nyata dari pemilik toko yang sudah naik kelas bersama kami.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {items.map((t) => (
            <Card
              key={t.name}
              className="flex flex-col gap-0 border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="mb-3 flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className="size-4 fill-amber-400 text-amber-400"
                  />
                ))}
              </div>
              <p className="flex-1 text-sm leading-relaxed text-slate-700">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="mt-5 flex items-center gap-3 border-t border-slate-100 pt-4">
                <div className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-amber-500 text-sm font-bold text-white">
                  {t.initial}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{t.name}</p>
                  <p className="text-xs text-slate-500">{t.store}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------------- */
/*  FAQ                                                                       */
/* -------------------------------------------------------------------------- */

function FAQ() {
  const faqs = [
    {
      q: 'Apakah butuh internet terus-menerus?',
      a: 'Untuk akses cloud-based, ya butuh internet. Tapi data tersinkron otomatis saat online kembali.',
    },
    {
      q: 'Apakah data saya aman?',
      a: 'Data disimpan di Google Sheets milik Anda sendiri. Tidak ada server pihak ketiga.',
    },
    {
      q: 'Bisa dipakai di HP Android/iPhone?',
      a: 'Ya, aplikasi responsive dan bisa diakses dari browser HP apa pun.',
    },
    {
      q: 'Bagaimana kalau quota Google habis?',
      a: 'Quota Apps Script consumer 20.000 request/hari, cukup untuk 200 transaksi/hari. Untuk volume lebih, gunakan Google Workspace.',
    },
    {
      q: 'Bisa minta kustomisasi fitur?',
      a: 'Tentu! Paket Enterprise termasuk kustomisasi. Atau pesan add-on terpisah.',
    },
    {
      q: 'Apakah ada biaya bulanan?',
      a: 'TIDAK. Sekali bayar, milik selamanya. Gratis hosting via Google.',
    },
    {
      q: 'Bisa ganti logo dan nama toko?',
      a: 'Ya, ada menu Branding di Settings. Ganti logo, nama, warna tema, semua bebas.',
    },
    {
      q: 'Cara bayar bagaimana?',
      a: 'Transfer bank (BCA/BNI/Mandiri), QRIS, GoPay, OVO. License key dikirim setelah pembayaran lunas.',
    },
    {
      q: 'Berapa lama proses install?',
      a: '5-10 menit untuk paket Starter (DIY). Untuk Pro/Enterprise, kami bantu install dalam 1x24 jam.',
    },
    {
      q: 'Kalau ada error, dapat support bagaimana?',
      a: 'WhatsApp support sesuai paket: Starter 1 bulan, Pro 3 bulan, Enterprise 6 bulan. Response dalam jam kerja.',
    },
  ]
  return (
    <section id="faq" className="scroll-mt-16 bg-slate-50 py-20 lg:py-24">
      <div className="mx-auto max-w-3xl px-4">
        <div className="mx-auto max-w-2xl text-center">
          <Badge className="mb-4 gap-1.5 rounded-full border-orange-200 bg-orange-50 px-3 py-1 text-orange-600">
            <HelpCircle className="size-3.5" />
            FAQ
          </Badge>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Pertanyaan yang Sering Diajukan
          </h2>
          <p className="mt-3 text-slate-600">
            Belum menemukan jawaban? Hubungi kami via WhatsApp.
          </p>
        </div>

        <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((f, i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className="px-4 last:border-b-0"
              >
                <AccordionTrigger className="text-left text-sm font-semibold text-slate-900 hover:no-underline hover:text-orange-600">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-slate-600">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------------- */
/*  Final CTA                                                                 */
/* -------------------------------------------------------------------------- */

function FinalCTA() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-orange-500 via-orange-500 to-amber-500 py-20 lg:py-24">
      {/* decorative */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-20 -top-20 size-72 rounded-full bg-white/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-20 -right-20 size-72 rounded-full bg-amber-300/30 blur-3xl"
      />

      <div className="relative mx-auto max-w-4xl px-4 text-center">
        <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
          Siap Mulai Digitalisasi Toko Anda?
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-orange-50">
          Bergabung dengan 500+ toko sembako yang sudah naik kelas. Bayar
          sekali, milik selamanya.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button
            asChild
            size="lg"
            className="bg-white text-orange-600 shadow-xl hover:bg-orange-50"
          >
            <a href="#order">
              <Send className="size-4" />
              Isi Form Order
            </a>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white"
          >
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="size-4" />
              Chat WhatsApp: 0815-7226-6150
            </a>
          </Button>
        </div>

        <p className="mt-6 text-sm text-orange-100">
          Atau langsung isi form order{' '}
          <a
            href="#order"
            className="font-semibold text-white underline underline-offset-4 hover:text-amber-100"
          >
            di sini
          </a>{' '}
          &rarr; {' '}atau beli via{' '}
          <a
            href="#"
            className="font-semibold text-white underline underline-offset-4 hover:text-amber-100"
          >
            Tokopedia
          </a>{' '}
          /{' '}
          <a
            href="#"
            className="font-semibold text-white underline underline-offset-4 hover:text-amber-100"
          >
            Shopee
          </a>
        </p>
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------------- */
/*  Footer                                                                    */
/* -------------------------------------------------------------------------- */

function TikTokIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      {...props}
    >
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.84-.1Z" />
    </svg>
  )
}

function Footer() {
  return (
    <footer className="mt-auto bg-slate-900 text-slate-300">
      <div className="mx-auto max-w-7xl px-4 py-14">
        <div className="grid gap-10 lg:grid-cols-4">
          {/* Col 1: brand */}
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 text-white">
                <ShoppingCart className="size-5" />
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-sm font-bold text-white">
                  POS Kasir
                </span>
                <span className="text-[11px] font-medium text-orange-400">
                  Sembako
                </span>
              </div>
            </div>
            <p className="mt-4 text-sm text-slate-400">
              Kelola Toko Sembako Lebih Cepat, Akurat, &amp; Modern. Aplikasi
              kasir cloud-based tanpa server, tanpa langganan bulanan.
            </p>
            <div className="mt-5 flex gap-2">
              {[
                { icon: Facebook, label: 'Facebook' },
                { icon: Instagram, label: 'Instagram' },
                { icon: TikTokIcon, label: 'TikTok' },
                { icon: Youtube, label: 'YouTube' },
              ].map(({ icon: Icon, label }) => (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
                  className="flex size-9 items-center justify-center rounded-lg bg-slate-800 text-slate-300 transition-colors hover:bg-orange-500 hover:text-white"
                >
                  <Icon className="size-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Col 2: Produk */}
          <div>
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">
              Produk
            </h3>
            <ul className="space-y-2.5 text-sm">
              {['Fitur', 'Harga', 'Demo', 'Kustomisasi'].map((l) => (
                <li key={l}>
                  <a
                    href={`#${l.toLowerCase()}`}
                    className="text-slate-400 transition-colors hover:text-orange-400"
                  >
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Perusahaan */}
          <div>
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">
              Perusahaan
            </h3>
            <ul className="space-y-2.5 text-sm">
              {['Tentang Kami', 'Blog', 'Kontak', 'Affiliate'].map((l) => (
                <li key={l}>
                  <a
                    href="#"
                    className="text-slate-400 transition-colors hover:text-orange-400"
                  >
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4: Kontak */}
          <div>
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">
              Kontak
            </h3>
            <ul className="space-y-3 text-sm text-slate-400">
              <li className="flex items-center gap-2.5">
                <MessageCircle className="size-4 text-orange-400" />
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-orange-400"
                >
                  WhatsApp: 0815-7226-6150
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="size-4 text-orange-400" />
                <a
                  href="mailto:dankhamdan@gmail.com"
                  className="hover:text-orange-400"
                >
                  dankhamdan@gmail.com
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 size-4 text-orange-400" />
                <span>Jakarta, Indonesia</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Clock className="size-4 text-orange-400" />
                <span>Senin–Sabtu, 09.00–18.00 WIB</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-slate-800 pt-6">
          <div className="flex flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-left">
            <p className="text-xs text-slate-500">
              © 2025 POS Kasir Sembako. All rights reserved.
            </p>
            <p className="text-xs text-slate-500">
              Dibuat dengan Next.js + Tailwind CSS | Hosted on Google Apps Script
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}

/* -------------------------------------------------------------------------- */
/*  Admin Dashboard (hidden — visible via URL hash #admin)                    */
/* -------------------------------------------------------------------------- */

function formatRupiah(value: number): string {
  if (!Number.isFinite(value)) return 'Rp 0'
  return 'Rp ' + new Intl.NumberFormat('id-ID').format(value)
}

function formatTanggal(iso: string): string {
  if (!iso) return '-'
  try {
    const d = new Date(iso)
    return d.toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

type AdminSectionProps = {
  token: string
  setToken: (v: string) => void
  loggedIn: boolean
  setLoggedIn: (v: boolean) => void
  stats: AdminStats | null
  setStats: (v: AdminStats | null) => void
  loading: boolean
  setLoading: (v: boolean) => void
  error: string | null
  setError: (v: string | null) => void
  onLogin: () => void
  onRefresh: () => void
  onLogout: () => void
}

function AdminStatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  accent: 'orange' | 'emerald' | 'amber' | 'sky'
}) {
  const accentMap: Record<string, string> = {
    orange: 'bg-orange-100 text-orange-600',
    emerald: 'bg-emerald-100 text-emerald-600',
    amber: 'bg-amber-100 text-amber-600',
    sky: 'bg-sky-100 text-sky-600',
  }
  return (
    <Card className="border-slate-200 bg-white shadow-sm">
      <CardContent className="flex items-center gap-4 p-5">
        <div
          className={`flex size-12 items-center justify-center rounded-xl ${accentMap[accent]}`}
        >
          <Icon className="size-6" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
            {label}
          </p>
          <p className="truncate text-2xl font-bold text-slate-900">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function AdminSection(props: AdminSectionProps) {
  const {
    token,
    setToken,
    loggedIn,
    stats,
    loading,
    error,
    onLogin,
    onRefresh,
    onLogout,
  } = props

  // Login view
  if (!loggedIn) {
    return (
      <section
        id="admin"
        aria-labelledby="admin-heading"
        className="min-h-screen bg-slate-100 py-16"
      >
        <div className="mx-auto max-w-md px-4">
          <Card className="border-slate-200 bg-white shadow-md">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-orange-500">
                  <Lock className="size-5 text-white" />
                </div>
                <h2
                  id="admin-heading"
                  className="text-xl font-bold text-slate-900"
                >
                  Admin Dashboard
                </h2>
              </div>
              <p className="mb-4 text-sm text-slate-600">
                Masukkan token admin untuk melihat statistik penjualan.
              </p>
              <Input
                type="password"
                placeholder="Token admin"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && token && !loading) onLogin()
                }}
                className="mb-3"
                aria-label="Token admin"
              />
              {error && (
                <div className="mb-3 flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                  <AlertCircle className="mt-0.5 size-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              <Button
                onClick={onLogin}
                disabled={loading || !token}
                className="w-full bg-orange-500 hover:bg-orange-600"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Login'
                )}
              </Button>
              <p className="mt-3 text-xs text-slate-500">
                Token ada di <code className="rounded bg-slate-200 px-1 py-0.5">WEBAPP_CONFIG.ADMIN_TOKEN</code> di Code.gs.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    )
  }

  // Dashboard view
  const totals = stats?.totals ?? { orders: 0, pending: 0, paid: 0, revenue: 0 }
  const keyPool = stats?.keyPool ?? { available: 0, assigned: 0, total: 0 }
  const byPaket = stats?.byPaket ?? { Starter: 0, Pro: 0, Enterprise: 0 }
  const recentOrders = stats?.recentOrders ?? []
  const spreadsheetUrl = stats?.spreadsheetUrl ?? '#'

  const paketMax = Math.max(byPaket.Starter, byPaket.Pro, byPaket.Enterprise, 1)
  const paketEntries: Array<[string, number, string]> = [
    ['Starter', byPaket.Starter, 'bg-orange-500'],
    ['Pro', byPaket.Pro, 'bg-amber-500'],
    ['Enterprise', byPaket.Enterprise, 'bg-rose-500'],
  ]
  const keyPoolPct =
    keyPool.total > 0 ? Math.round((keyPool.available / keyPool.total) * 100) : 0

  return (
    <section
      id="admin"
      aria-labelledby="admin-heading"
      className="min-h-screen bg-slate-100 py-12"
    >
      <div className="mx-auto max-w-6xl px-4">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-orange-600">
              Admin Dashboard
            </p>
            <h1
              id="admin-heading"
              className="text-2xl font-bold text-slate-900 sm:text-3xl"
            >
              Statistik Penjualan POS Kasir Sembako
            </h1>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onRefresh}
              disabled={loading}
              className="border-slate-300"
            >
              {loading ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 size-4" />
              )}
              Refresh
            </Button>
            <Button
              variant="outline"
              onClick={onLogout}
              className="border-slate-300"
            >
              <LogOut className="mr-2 size-4" />
              Logout
            </Button>
          </div>
        </div>

        {error && (
          <div className="mb-6 flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Stat cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <AdminStatCard
            icon={ShoppingBag}
            label="Total Orders"
            value={String(totals.orders)}
            accent="orange"
          />
          <AdminStatCard
            icon={TrendingUp}
            label="Total Revenue"
            value={formatRupiah(totals.revenue)}
            accent="emerald"
          />
          <AdminStatCard
            icon={Clock}
            label="Pending Orders"
            value={String(totals.pending)}
            accent="amber"
          />
          <AdminStatCard
            icon={CheckCircle2}
            label="Paid Orders"
            value={String(totals.paid)}
            accent="sky"
          />
        </div>

        {/* Two-column: by-paket chart + key pool */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* By Paket chart */}
          <Card className="border-slate-200 bg-white shadow-sm">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center gap-2">
                <BarChart3 className="size-5 text-orange-500" />
                <h3 className="text-base font-bold text-slate-900">
                  Distribusi per Paket
                </h3>
              </div>
              <div className="space-y-4">
                {paketEntries.map(([name, count, color]) => {
                  const pct = Math.round((count / paketMax) * 100)
                  const sharePct =
                    totals.orders > 0
                      ? Math.round((count / totals.orders) * 100)
                      : 0
                  return (
                    <div key={name}>
                      <div className="mb-1.5 flex items-center justify-between text-sm">
                        <span className="font-medium text-slate-700">{name}</span>
                        <span className="text-slate-500">
                          {count} order
                          <span className="ml-2 text-xs text-slate-400">
                            ({sharePct}% share)
                          </span>
                        </span>
                      </div>
                      <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full rounded-full ${color} transition-all`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Key Pool status */}
          <Card className="border-slate-200 bg-white shadow-sm">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center gap-2">
                <Key className="size-5 text-orange-500" />
                <h3 className="text-base font-bold text-slate-900">
                  Status License Key Pool
                </h3>
              </div>
              <div className="mb-4 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-slate-900">
                  {keyPool.available}
                </span>
                <span className="text-sm text-slate-500">
                  / {keyPool.total} key tersedia
                </span>
              </div>
              <Progress value={keyPoolPct} className="mb-3 h-2.5" />
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-emerald-600">
                  <span className="size-2 rounded-full bg-emerald-500" />
                  Available: {keyPool.available}
                </span>
                <span className="flex items-center gap-1.5 text-amber-600">
                  <span className="size-2 rounded-full bg-amber-500" />
                  Assigned: {keyPool.assigned}
                </span>
              </div>
              {keyPool.available <= 10 && keyPool.total > 0 && (
                <div className="mt-4 flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                  <span>
                    Stok key menipis! Tambahkan key baru via{' '}
                    <code className="rounded bg-amber-100 px-1 py-0.5">
                      seedKeyPool()
                    </code>{' '}
                    di Apps Script.
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent orders table */}
        <Card className="mt-6 border-slate-200 bg-white shadow-sm">
          <CardContent className="p-6">
            <div className="mb-4 flex items-center gap-2">
              <Receipt className="size-5 text-orange-500" />
              <h3 className="text-base font-bold text-slate-900">
                10 Order Terbaru
              </h3>
            </div>
            {recentOrders.length === 0 ? (
              <div className="py-10 text-center text-sm text-slate-500">
                Belum ada order. Statistik akan muncul setelah pembeli pertama
                submit form order.
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Nama</TableHead>
                      <TableHead>Paket</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="whitespace-nowrap">Tanggal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentOrders.map((o, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-mono text-xs text-slate-700">
                          {o.orderId || '-'}
                        </TableCell>
                        <TableCell className="max-w-[180px] truncate text-sm text-slate-900">
                          {o.nama || '-'}
                          {o.email && (
                            <span className="block truncate text-xs text-slate-400">
                              {o.email}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              o.paket === 'Pro'
                                ? 'border-orange-200 bg-orange-50 text-orange-700'
                                : o.paket === 'Enterprise'
                                ? 'border-rose-200 bg-rose-50 text-rose-700'
                                : 'border-slate-200 bg-slate-50 text-slate-700'
                            }
                          >
                            {o.paket || '-'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {o.status.toUpperCase() === 'PAID' ? (
                            <Badge className="gap-1 bg-emerald-500 text-white hover:bg-emerald-600">
                              <CheckCircle2 className="size-3" />
                              PAID
                            </Badge>
                          ) : (
                            <Badge className="gap-1 bg-amber-500 text-white hover:bg-amber-600">
                              <Clock className="size-3" />
                              {o.status.toUpperCase() || 'PENDING'}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-xs text-slate-500">
                          {formatTanggal(o.createdAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Spreadsheet link */}
        <div className="mt-6 flex justify-center">
          <Button asChild variant="outline" className="border-slate-300">
            <a
              href={spreadsheetUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Database className="mr-2 size-4" />
              Buka Spreadsheet Database
              <ExternalLink className="ml-2 size-3" />
            </a>
          </Button>
        </div>
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

export default function Home() {
  // Order form state
  const [orderForm, setOrderForm] = useState<OrderFormState>({
    nama: '',
    email: '',
    wa: '',
    paket: 'Pro',
    catatan: '',
  })
  const [orderSubmitting, setOrderSubmitting] = useState(false)
  const [orderResult, setOrderResult] = useState<OrderResult>(null)
  const [orderError, setOrderError] = useState<string | null>(null)

  // Admin dashboard state
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminToken, setAdminToken] = useState('')
  const [adminLoggedIn, setAdminLoggedIn] = useState(false)
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null)
  const [adminLoading, setAdminLoading] = useState(false)
  const [adminError, setAdminError] = useState<string | null>(null)

  // Detect #admin in URL hash → show admin section
  useEffect(() => {
    const checkHash = () => setIsAdmin(window.location.hash === '#admin')
    checkHash()
    window.addEventListener('hashchange', checkHash)
    return () => window.removeEventListener('hashchange', checkHash)
  }, [])

  const handleAdminLogin = async () => {
    setAdminError(null)
    if (WEBAPP_URL.includes('GANTI')) {
      setAdminError(
        'WEBAPP_URL belum dikonfigurasi. Admin dashboard tidak bisa terhubung ke backend.'
      )
      return
    }
    if (!adminToken.trim()) {
      setAdminError('Token admin tidak boleh kosong.')
      return
    }
    setAdminLoading(true)
    try {
      const res = await fetchAdminStatsViaJsonp(adminToken.trim())
      if (res.success) {
        setAdminStats(res)
        setAdminLoggedIn(true)
      } else {
        setAdminError(
          (res as { success: false; message: string }).message ||
            'Token admin tidak valid.'
        )
      }
    } catch (err) {
      setAdminError(
        err instanceof Error
          ? err.message
          : 'Gagal menghubungi server admin. Coba lagi.'
      )
    } finally {
      setAdminLoading(false)
    }
  }

  const handleAdminRefresh = async () => {
    if (!adminToken.trim()) return
    setAdminError(null)
    setAdminLoading(true)
    try {
      const res = await fetchAdminStatsViaJsonp(adminToken.trim())
      if (res.success) {
        setAdminStats(res)
      } else {
        setAdminError(
          (res as { success: false; message: string }).message ||
            'Gagal refresh statistik.'
        )
      }
    } catch (err) {
      setAdminError(
        err instanceof Error ? err.message : 'Gagal refresh statistik.'
      )
    } finally {
      setAdminLoading(false)
    }
  }

  const handleAdminLogout = () => {
    setAdminLoggedIn(false)
    setAdminToken('')
    setAdminStats(null)
    setAdminError(null)
  }

  const handleSelectPaket = (paket: string) => {
    setOrderForm((f) => ({ ...f, paket }))
    setOrderResult(null)
    setOrderError(null)
  }

  const handleDismissError = () => setOrderError(null)

  const handleResetOrder = () => {
    setOrderResult(null)
    setOrderError(null)
    setOrderForm((f) => ({ ...f, catatan: '' }))
  }

  const handleSubmitOrder = async () => {
    setOrderError(null)

    // Client-side validation
    const nama = orderForm.nama.trim()
    const email = orderForm.email.trim()
    if (nama.length < 2) {
      setOrderError('Nama minimal 2 karakter.')
      return
    }
    const emailRe = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    if (!emailRe.test(email)) {
      setOrderError('Format email tidak valid.')
      return
    }
    if (!orderForm.paket) {
      setOrderError('Pilih paket dulu.')
      return
    }
    // WA optional, validate if filled
    const waDigits = orderForm.wa.replace(/\D/g, '')
    if (orderForm.wa && (waDigits.length < 9 || waDigits.length > 15)) {
      setOrderError('Nomor WhatsApp harus 9-15 digit.')
      return
    }

    // Config guard: WEBAPP_URL must be replaced
    if (WEBAPP_URL.includes('GANTI')) {
      setOrderError(
        'Form order belum dikonfigurasi. Untuk order sekarang, hubungi WhatsApp kami.'
      )
      // Open WhatsApp fallback after small delay so user sees the message
      setTimeout(() => {
        window.open(WHATSAPP_FALLBACK_URL, '_blank', 'noopener,noreferrer')
      }, 600)
      return
    }

    setOrderSubmitting(true)
    try {
      const res = await submitOrderViaJsonp({
        action: 'order',
        nama: nama,
        email: email.toLowerCase(),
        wa: waDigits,
        paket: orderForm.paket,
        catatan: orderForm.catatan.trim(),
      })
      if (res.success && res.orderId) {
        setOrderResult({ orderId: res.orderId })
        setOrderError(null)
        // Scroll to top of order section so success state is visible
        const el = document.getElementById('order')
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      } else {
        setOrderError(res.message || 'Gagal mengirim order. Coba lagi.')
      }
    } catch (err) {
      setOrderError(
        err instanceof Error
          ? err.message
          : 'Gagal mengirim order. Coba lagi atau hubungi WhatsApp.'
      )
    } finally {
      setOrderSubmitting(false)
    }
  }

  // JSON-LD structured data for SEO (SoftwareApplication + FAQPage)
  const jsonLdSoftware = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'POS Kasir Sembako',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    offers: [
      {
        '@type': 'Offer',
        name: 'Starter',
        price: '150000',
        priceCurrency: 'IDR',
      },
      {
        '@type': 'Offer',
        name: 'Pro',
        price: '350000',
        priceCurrency: 'IDR',
      },
      {
        '@type': 'Offer',
        name: 'Enterprise',
        price: '500000',
        priceCurrency: 'IDR',
      },
    ],
    description:
      'Aplikasi kasir modern untuk toko sembako, warung, dan toko kelontong. Scan barcode, multi metode bayar (Tunai/QRIS/Transfer/Tempo), laporan real-time. Sekali bayar, milik selamanya.',
    publisher: { '@type': 'Person', name: 'Dan Khamdan' },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      ratingCount: '500',
    },
  }

  const jsonLdFaq = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Apakah butuh internet terus-menerus?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Untuk akses cloud-based, ya butuh internet. Tapi data tersinkron otomatis saat online kembali.',
        },
      },
      {
        '@type': 'Question',
        name: 'Apakah data saya aman?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Data disimpan di Google Sheets milik Anda sendiri. Tidak ada server pihak ketiga.',
        },
      },
      {
        '@type': 'Question',
        name: 'Bisa dipakai di HP Android/iPhone?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Ya, aplikasi responsive dan bisa diakses dari browser HP apa pun.',
        },
      },
      {
        '@type': 'Question',
        name: 'Bagaimana kalau quota Google habis?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Quota Apps Script consumer 20.000 request/hari, cukup untuk 200 transaksi/hari. Untuk volume lebih, gunakan Google Workspace.',
        },
      },
      {
        '@type': 'Question',
        name: 'Bisa minta kustomisasi fitur?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Tentu! Paket Enterprise termasuk kustomisasi. Atau pesan add-on terpisah.',
        },
      },
      {
        '@type': 'Question',
        name: 'Apakah ada biaya bulanan?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'TIDAK. Sekali bayar, milik selamanya. Gratis hosting via Google.',
        },
      },
      {
        '@type': 'Question',
        name: 'Bisa ganti logo dan nama toko?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Ya, ada menu Branding di Settings. Ganti logo, nama, warna tema, semua bebas.',
        },
      },
      {
        '@type': 'Question',
        name: 'Cara bayar bagaimana?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Transfer bank (BCA/BNI/Mandiri), QRIS, GoPay, OVO. License key dikirim setelah pembayaran lunas.',
        },
      },
      {
        '@type': 'Question',
        name: 'Berapa lama proses install?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: '5-10 menit untuk paket Starter (DIY). Untuk Pro/Enterprise, kami bantu install dalam 1x24 jam.',
        },
      },
      {
        '@type': 'Question',
        name: 'Kalau ada error, dapat support bagaimana?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'WhatsApp support sesuai paket: Starter 1 bulan, Pro 3 bulan, Enterprise 6 bulan. Response dalam jam kerja.',
        },
      },
    ],
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* SEO: JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdSoftware) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdFaq) }}
      />

      <Navbar />
      <main className="flex-1">
        <Hero />
        <StatsBar />
        <Problems />
        <Features />
        <HowItWorks />
        <Pricing onSelectPaket={handleSelectPaket} />
        <OrderSection
          form={orderForm}
          setForm={setOrderForm}
          submitting={orderSubmitting}
          result={orderResult}
          error={orderError}
          onSubmit={handleSubmitOrder}
          onDismissError={handleDismissError}
          onReset={handleResetOrder}
        />
        <Demo />
        <Testimonials />
        <FAQ />
        <FinalCTA />
        {isAdmin && (
          <AdminSection
            token={adminToken}
            setToken={setAdminToken}
            loggedIn={adminLoggedIn}
            setLoggedIn={setAdminLoggedIn}
            stats={adminStats}
            setStats={setAdminStats}
            loading={adminLoading}
            setLoading={setAdminLoading}
            error={adminError}
            setError={setAdminError}
            onLogin={handleAdminLogin}
            onRefresh={handleAdminRefresh}
            onLogout={handleAdminLogout}
          />
        )}
      </main>
      <Footer />
    </div>
  )
}
