'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  CalendarDays,
  CarFront,
  Menu,
  MoveUpRight,
  ShieldCheck,
  Star,
  Wallet,
  X,
} from 'lucide-react'
import type { Variants } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { AnimatedGroup } from '@/components/ui/animated-group'
import { cn } from '@/lib/utils'
import { useScroll } from 'motion/react'

const transitionVariants: { item: Variants } = {
  item: {
    hidden: {
      opacity: 0,
      filter: 'blur(12px)',
      y: 12,
    },
    visible: {
      opacity: 1,
      filter: 'blur(0px)',
      y: 0,
      transition: {
        type: 'spring',
        bounce: 0.3,
        duration: 1.2,
      },
    },
  },
}

const menuItems = [
  { name: 'Pricing', href: '#pricing' },
  { name: 'About us', href: '#about' },
  { name: 'Blog', href: '#blog' },
  { name: 'Docs', href: '#docs' },
]

const logoItems = [
  'Rental agencies',
  'Fleet teams',
  'Operators',
  'Desk managers',
  'Owners',
]

const tabs = ['Dashboard', 'Reservations', 'Calendar', 'Finance']
const testimonials = [
  {
    quote:
      'Before Locaryx, we managed bookings across calls, WhatsApp, and spreadsheets. Now the whole team sees the same schedule and we react faster.',
    highlight: 'the whole team sees the same schedule',
    name: 'Yassine El Amrani',
    role: 'Agency Manager, Casablanca',
  },
  {
    quote:
      'Deposits, returns, and payments are no longer scattered. That clarity helps us save time and keep the desk operation under control every day.',
    highlight: 'save time and keep the desk operation under control',
    name: 'Sara Bennani',
    role: 'Operations Lead, Marrakech',
  },
]

export function HeroSection2() {
  return (
    <>
      <HeroHeader />
      <main className="overflow-hidden bg-[#f7f4ef] text-slate-950">
        <section className="relative overflow-hidden pb-16 pt-24 lg:pb-20 lg:pt-28">
          <BackgroundLines />

          <div className="relative z-10 mx-auto max-w-7xl px-6">
            <div className="mx-auto max-w-[980px]">
              <AnimatedGroup
                variants={{
                  container: {
                    visible: {
                      transition: {
                        staggerChildren: 0.06,
                        delayChildren: 0.12,
                      },
                    },
                  },
                  ...transitionVariants,
                }}
                className="items-start"
              >
                <div className="max-w-[820px]">
                  <h1 className="max-w-[820px] text-[44px] font-semibold leading-[1.02] tracking-[-0.055em] text-slate-950 md:text-[56px] lg:text-[62px]">
                    The{' '}
                    <span className="bg-[#4da4ea] px-1.5 py-0.5 text-white">
                      simple & actionable
                    </span>
                    <br />
                    car rental management
                  </h1>
                </div>

                <p className="mt-5 max-w-[640px] text-[17px] font-medium leading-[1.55] text-slate-500 md:text-[18px]">
                  See what your agency actually does. Understand what slows it
                  down.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Button
                    asChild
                    size="lg"
                    className="h-10 rounded-xl bg-[#4da4ea] px-5 text-[15px] font-semibold text-white shadow-[0_10px_30px_-14px_rgba(77,164,234,0.85)] hover:bg-[#3996e2]"
                  >
                    <Link href="/signup">Start for free</Link>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="secondary"
                    className="h-10 rounded-xl border border-slate-200 bg-white px-5 text-[15px] font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <Link href="/login">View live demo</Link>
                  </Button>
                </div>

                <div className="mt-8 flex flex-wrap items-center gap-x-7 gap-y-3 text-[13px] font-semibold text-slate-400">
                  {logoItems.map((item) => (
                    <span key={item} className="tracking-wide">
                      {item}
                    </span>
                  ))}
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-2 text-[13px] text-slate-400">
                  <div className="flex items-center gap-1 text-[#f3b34c]">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Star key={index} className="size-3.5 fill-current" />
                    ))}
                  </div>
                  <span>Trusted by modern agencies for daily operations.</span>
                </div>
              </AnimatedGroup>
            </div>

            <AnimatedGroup
              variants={{
                container: {
                  visible: {
                    transition: {
                      staggerChildren: 0.05,
                      delayChildren: 0.2,
                    },
                  },
                },
                ...transitionVariants,
              }}
            >
              <div className="relative mx-auto mt-10 max-w-[1024px] lg:mt-12">
                <div className="absolute -right-2 -top-10 z-20 hidden rounded-[24px] bg-white/85 px-4 py-3 shadow-[0_30px_60px_-35px_rgba(15,23,42,0.35)] ring-1 ring-black/5 backdrop-blur md:block">
                  <div className="flex items-start gap-3">
                    <div className="rounded-2xl bg-emerald-50 p-2 text-emerald-600">
                      <ShieldCheck className="size-4.5" />
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-slate-900">
                        Everything in one view
                      </p>
                      <p className="mt-1 max-w-[200px] text-[13px] leading-5 text-slate-500">
                        Departures, returns, deposits and cash collection stay visible.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="relative overflow-hidden rounded-[14px] border border-[#e7e3da] bg-white shadow-[0_40px_100px_-40px_rgba(15,23,42,0.3)] ring-1 ring-black/5">
                  <Image
                    src="/screenshots/locaryxx.png"
                    alt="Locaryx application preview"
                    width={1600}
                    height={1000}
                    priority
                    className="h-auto w-full rounded-none"
                  />
                </div>

                <div className="mt-5 flex justify-center">
                  <div className="inline-flex flex-wrap items-center gap-1 rounded-full border border-black/5 bg-white p-1 shadow-[0_15px_40px_-30px_rgba(15,23,42,0.35)]">
                    {tabs.map((tab, index) => (
                      <span
                        key={tab}
                        className={cn(
                          'rounded-full px-4 py-1.5 text-[13px] font-medium text-slate-500',
                          index === 0 && 'bg-slate-950 text-white shadow-sm'
                        )}
                      >
                        {tab}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </AnimatedGroup>
          </div>
        </section>

        <section className="relative overflow-hidden pb-24 pt-10 lg:pb-28 lg:pt-14">
          <BackgroundLines />

          <div className="relative z-10 mx-auto max-w-7xl px-6">
            <div className="mx-auto max-w-[980px]">
              <div className="max-w-[880px]">
                <h2 className="text-[31px] font-semibold leading-[1.2] tracking-[-0.04em] text-slate-950 md:text-[36px] lg:text-[40px]">
                  Start seeing where your rental agency loses time.
                  <span className="text-[#b8b1aa]"> Be it at </span>
                  <span className="inline-flex items-center gap-2 rounded-lg border border-[#e8e2d9] bg-[#f1ece5] px-2 py-1 align-middle text-[22px] font-semibold leading-none text-[#b8b1aa] md:text-[25px]">
                    <CalendarDays className="size-4 text-[#b8b1aa]" />
                    bookings
                  </span>
                  <span className="text-[#b8b1aa]">, </span>
                  <span className="inline-flex items-center gap-2 rounded-lg border border-[#e8e2d9] bg-[#f1ece5] px-2 py-1 align-middle text-[22px] font-semibold leading-none text-[#b8b1aa] md:text-[25px]">
                    <CarFront className="size-4 text-[#b8b1aa]" />
                    fleet
                  </span>
                  <span className="text-[#b8b1aa]">, or </span>
                  <span className="inline-flex items-center gap-2 rounded-lg border border-[#e8e2d9] bg-[#f1ece5] px-2 py-1 align-middle text-[22px] font-semibold leading-none text-[#b8b1aa] md:text-[25px]">
                    <Wallet className="size-4 text-[#b8b1aa]" />
                    payments
                  </span>
                  <span className="text-[#b8b1aa]">.</span>
                </h2>
              </div>

              <p className="mt-5 max-w-[700px] text-[14px] leading-8 text-slate-500 md:text-[15px]">
                Set up Locaryx in minutes, request a demo, or message us if you
                need help structuring your workflow. It gives your team one
                place to operate without guessing.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <Button
                  asChild
                  className="h-10 rounded-xl bg-[#4da4ea] px-5 text-[15px] font-semibold text-white hover:bg-[#3996e2]"
                >
                  <Link href="/signup">Start for free</Link>
                </Button>
                <Button
                  asChild
                  variant="secondary"
                  className="h-10 rounded-xl border border-[#e2ddd5] bg-[#f1ece6] px-5 text-[15px] font-semibold text-slate-700 hover:bg-[#ebe4dc]"
                >
                  <Link href="/login">Get a demo</Link>
                </Button>
              </div>

              <div className="mt-12 grid gap-10 md:grid-cols-2">
                {testimonials.map((testimonial) => {
                  const [before, after] = testimonial.quote.split(
                    testimonial.highlight
                  )

                  return (
                    <article key={testimonial.name} className="max-w-[430px]">
                      <div className="mb-4 flex items-center gap-1 text-[#f3b34c]">
                        {Array.from({ length: 5 }).map((_, index) => (
                          <Star key={index} className="size-4 fill-current" />
                        ))}
                      </div>

                      <p className="text-[13px] leading-8 text-slate-600 md:text-[14px]">
                        &ldquo;{before}
                        <span className="bg-[#d8ecff] px-1 text-slate-800">
                          {testimonial.highlight}
                        </span>
                        {after}&rdquo;
                      </p>

                      <div className="mt-6 flex items-center gap-3">
                        <div className="flex size-11 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-700">
                          {testimonial.name
                            .split(' ')
                            .map((part) => part[0])
                            .join('')
                            .slice(0, 2)}
                        </div>
                        <div>
                          <p className="text-[13px] font-semibold text-slate-900">
                            {testimonial.name}
                          </p>
                          <p className="text-[13px] text-slate-400">
                            {testimonial.role}
                          </p>
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}

function BackgroundLines() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -left-[22rem] top-[-12rem] h-[42rem] w-[42rem] rounded-full border border-[#ede7dc]" />
      <div className="absolute -left-[18rem] top-[-8rem] h-[34rem] w-[34rem] rounded-full border border-[#f1ebe0]" />
      <div className="absolute -right-[18rem] bottom-[-12rem] h-[34rem] w-[34rem] rounded-full border border-[#ede7dc]" />
      <div className="absolute -right-[12rem] bottom-[-6rem] h-[24rem] w-[24rem] rounded-full border border-[#f1ebe0]" />
    </div>
  )
}

export const HeroHeader = () => {
  const [menuState, setMenuState] = React.useState(false)
  const [scrolled, setScrolled] = React.useState(false)
  const { scrollYProgress } = useScroll()

  React.useEffect(() => {
    const unsubscribe = scrollYProgress.on('change', (latest) => {
      setScrolled(latest > 0.05)
    })

    return () => unsubscribe()
  }, [scrollYProgress])

  return (
    <header>
      <nav
        data-state={menuState ? 'active' : 'inactive'}
        className={cn(
          'fixed inset-x-0 top-0 z-30 transition-all duration-200',
          scrolled && 'bg-[#f7f4ef]/90 backdrop-blur-xl'
        )}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" aria-label="home" className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-full bg-slate-950 text-white">
              <span className="text-sm font-semibold">L</span>
            </div>
          </Link>

          <button
            onClick={() => setMenuState((current) => !current)}
            aria-label={menuState ? 'Close Menu' : 'Open Menu'}
            className="relative block p-2 lg:hidden"
          >
            <Menu className="size-6 transition duration-200 group-data-[state=active]:scale-0 group-data-[state=active]:opacity-0" />
            <X className="absolute inset-0 m-auto size-6 scale-0 opacity-0 transition duration-200 group-data-[state=active]:scale-100 group-data-[state=active]:opacity-100" />
          </button>

          <div className="hidden items-center gap-8 lg:flex">
            <ul className="flex items-center gap-8 text-[15px] font-medium text-slate-500">
              {menuItems.map((item, index) => (
                <li key={item.name} className="flex items-center gap-8">
                  <Link href={item.href} className="transition-colors hover:text-slate-900">
                    {item.name}
                  </Link>
                  {index === menuItems.length - 1 ? null : (
                    <span className="h-5 w-px bg-slate-200 last:hidden" />
                  )}
                </li>
              ))}
            </ul>

            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="text-[15px] font-medium text-slate-600 transition-colors hover:text-slate-900"
              >
                Sign in
              </Link>
              <Button
                asChild
                className="h-10 rounded-xl bg-[#4da4ea] px-5 text-sm font-semibold text-white hover:bg-[#3996e2]"
              >
                <Link href="/signup">Start for free</Link>
              </Button>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-6 lg:hidden">
          <div className="hidden rounded-3xl border border-black/5 bg-white/95 p-6 shadow-xl group-data-[state=active]:block">
            <div className="space-y-5">
              {menuItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="block text-base font-medium text-slate-600"
                >
                  {item.name}
                </Link>
              ))}
            </div>
            <div className="mt-6 flex flex-col gap-3">
              <Button asChild variant="outline" className="rounded-xl">
                <Link href="/login">Sign in</Link>
              </Button>
              <Button asChild className="rounded-xl bg-[#4da4ea] hover:bg-[#3996e2]">
                <Link href="/signup">
                  Start for free
                  <MoveUpRight className="size-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>
    </header>
  )
}
