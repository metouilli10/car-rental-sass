'use client'

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
  const paddedItems = [...items]
  while (paddedItems.length < 7 && items.length > 0) {
    paddedItems.push(items[paddedItems.length % items.length])
  }
  const groups = splitTestimonials(paddedItems.slice(0, 7))

  return (
    <section id="testimonials" className="w-full bg-[#f8fafc]">
      <div className="relative mx-auto max-w-7xl rounded-lg bg-[#f8fafc] py-20 text-black md:py-24">
        <article className="mx-auto max-w-screen-md space-y-2 px-4 text-center">
          <h2 className="text-3xl font-medium xl:text-4xl">{title}</h2>
          <p className="mx-auto max-w-2xl text-gray-500">{subtitle}</p>
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
                  <div
                    key={`${testimonial.name}-${absoluteIndex}`}
                    className={getCardStyle(absoluteIndex)}
                  >
                    {needsPattern(absoluteIndex) ? <GridPattern /> : null}

                    <article className="mt-auto">
                      <p className={isCompactText(absoluteIndex) ? 'text-sm 2xl:text-base' : ''}>
                        &quot;{testimonial.quote}&quot;
                      </p>
                      <div className="pt-5">
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
                      </div>
                    </article>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
