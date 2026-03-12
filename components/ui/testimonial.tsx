'use client'

import Image from 'next/image'
import { useRef } from 'react'

import { TimelineContent } from '@/components/ui/timeline-animation'

type TestimonialItem = {
  quote: string
  name: string
  role: string
  company: string
}

type ClientFeedbackProps = {
  title: string
  subtitle: string
  items: TestimonialItem[]
}

const PORTRAITS = [
  'https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=687&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1512485694743-9c9538b4e6e0?q=80&w=687&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1566753323558-f4e0952af115?q=80&w=1021&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1615109398623-88346a601842?q=80&w=687&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1563237023-b1e970526dcb?q=80&w=765&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1590086782957-93c06ef21604?q=80&w=687&auto=format&fit=crop',
]

const CARD_STYLES = [
  'relative flex flex-[6] flex-col justify-between overflow-hidden rounded-lg border border-gray-200 bg-[#eef4ff] p-5 text-slate-900 lg:flex-[7]',
  'relative flex flex-[4] flex-col justify-between overflow-hidden rounded-lg border border-gray-200 bg-blue-600 p-5 text-white lg:h-fit lg:flex-[3] lg:shrink-0',
  'relative flex flex-col justify-between overflow-hidden rounded-lg border border-gray-200 bg-[#111111] p-5 text-white',
  'relative flex flex-col justify-between overflow-hidden rounded-lg border border-gray-200 bg-[#111111] p-5 text-white',
  'relative flex flex-col justify-between overflow-hidden rounded-lg border border-gray-200 bg-[#111111] p-5 text-white',
  'relative flex flex-[4] flex-col justify-between overflow-hidden rounded-lg border border-gray-200 bg-blue-600 p-5 text-white lg:flex-[3]',
  'relative flex flex-[6] flex-col justify-between overflow-hidden rounded-lg border border-gray-200 bg-[#eef4ff] p-5 text-slate-900 lg:flex-[7]',
]

const GRID_WRAPPERS = [
  'gap-2 md:flex lg:flex-col lg:gap-0 lg:space-y-2',
  'h-fit gap-2 md:flex lg:h-full lg:flex-col lg:gap-0 lg:space-y-2',
  'h-full gap-2 md:flex lg:flex-col lg:gap-0 lg:space-y-2',
]

function GridPattern() {
  return (
    <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f12_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f12_1px,transparent_1px)] bg-[size:50px_56px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
  )
}

function splitTestimonials(items: TestimonialItem[]) {
  return [items.slice(0, 2), items.slice(2, 5), items.slice(5, 7)]
}

function getCardStyle(index: number) {
  return CARD_STYLES[index] ?? CARD_STYLES[CARD_STYLES.length - 1]
}

function needsPattern(index: number) {
  return index === 0 || index === 6
}

function isCompactText(index: number) {
  return index >= 2 && index <= 4
}

export default function ClientFeedback({
  title,
  subtitle,
  items,
}: ClientFeedbackProps) {
  const testimonialRef = useRef<HTMLDivElement>(null)

  const revealVariants = {
    visible: (i: number) => ({
      y: 0,
      opacity: 1,
      filter: 'blur(0px)',
      transition: {
        delay: i * 0.12,
        duration: 0.45,
      },
    }),
    hidden: {
      filter: 'blur(10px)',
      y: -20,
      opacity: 0,
    },
  }

  const paddedItems = [...items]
  while (paddedItems.length < 7 && items.length > 0) {
    paddedItems.push(items[paddedItems.length % items.length])
  }
  const groups = splitTestimonials(paddedItems.slice(0, 7))

  return (
    <main className="w-full bg-[#f8fafc]">
      <section
        className="relative mx-auto h-full max-w-7xl rounded-lg bg-[#f8fafc] py-14 text-black"
        ref={testimonialRef}
      >
        <article className="mx-auto max-w-screen-md space-y-2 text-center">
          <TimelineContent
            as="h2"
            className="text-3xl font-medium xl:text-4xl"
            animationNum={0}
            customVariants={revealVariants}
            timelineRef={testimonialRef}
          >
            {title}
          </TimelineContent>
          <TimelineContent
            as="p"
            className="mx-auto max-w-2xl text-gray-500"
            animationNum={1}
            customVariants={revealVariants}
            timelineRef={testimonialRef}
          >
            {subtitle}
          </TimelineContent>
        </article>

        <div className="flex w-full flex-col gap-2 px-4 pb-4 pt-10 lg:grid lg:grid-cols-3 lg:px-10 lg:py-10">
          {groups.map((group, groupIndex) => (
            <div key={groupIndex} className={GRID_WRAPPERS[groupIndex]}>
              {group.map((testimonial, itemIndex) => {
                const absoluteIndex =
                  groupIndex === 0
                    ? itemIndex
                    : groupIndex === 1
                      ? itemIndex + 2
                      : itemIndex + 5

                return (
                  <TimelineContent
                    key={`${testimonial.name}-${absoluteIndex}`}
                    animationNum={absoluteIndex}
                    customVariants={revealVariants}
                    timelineRef={testimonialRef}
                    className={getCardStyle(absoluteIndex)}
                  >
                    {needsPattern(absoluteIndex) ? <GridPattern /> : null}

                    <article className="mt-auto">
                      <p className={isCompactText(absoluteIndex) ? 'text-sm 2xl:text-base' : ''}>
                        &quot;{testimonial.quote}&quot;
                      </p>
                      <div className="flex justify-between pt-5">
                        <div>
                          <h3
                            className={
                              isCompactText(absoluteIndex)
                                ? 'text-lg font-semibold lg:text-xl'
                                : 'text-sm font-semibold lg:text-xl'
                            }
                          >
                            {testimonial.name}
                          </h3>
                          <p className={isCompactText(absoluteIndex) ? 'text-sm lg:text-base' : ''}>
                            {testimonial.role}
                          </p>
                          <p className="text-sm opacity-80">{testimonial.company}</p>
                        </div>
                        <Image
                          src={PORTRAITS[absoluteIndex % PORTRAITS.length]}
                          alt={testimonial.name}
                          width={200}
                          height={200}
                          className={
                            isCompactText(absoluteIndex)
                              ? 'h-12 w-12 rounded-xl object-cover lg:h-16 lg:w-16'
                              : 'h-16 w-16 rounded-xl object-cover'
                          }
                        />
                      </div>
                    </article>
                  </TimelineContent>
                )
              })}
            </div>
          ))}
        </div>

        <div className="absolute bottom-4 left-[5%] z-[2] h-16 w-[90%] border-b-2 border-[#e6e6e6] md:left-0 md:w-full">
          <div className="container relative mx-auto h-full w-full before:absolute before:-bottom-2 before:-left-2 before:h-4 before:w-4 before:border before:border-gray-300 before:bg-white before:shadow-sm after:absolute after:-bottom-2 after:-right-2 after:h-4 after:w-4 after:border after:border-gray-300 after:bg-white after:shadow-sm" />
        </div>
      </section>
    </main>
  )
}
