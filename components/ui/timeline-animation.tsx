'use client'

import { cn } from '@/lib/utils'
import { motion, useInView, type Variants } from 'framer-motion'
import type { ElementType, ReactNode, RefObject } from 'react'

type TimelineContentProps<T extends ElementType> = {
  as?: T
  children: ReactNode
  className?: string
  animationNum?: number
  customVariants?: Variants
  timelineRef?: RefObject<Element | null>
}

const defaultVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 16,
    filter: 'blur(8px)',
  },
  visible: (index: number = 0) => ({
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.45,
      delay: index * 0.08,
    },
  }),
}

export function TimelineContent<T extends ElementType = 'div'>({
  as,
  children,
  className,
  animationNum = 0,
  customVariants,
  timelineRef,
}: TimelineContentProps<T>) {
  const isInView = useInView(timelineRef ?? { current: null }, {
    once: true,
    margin: '-10% 0px',
  })

  const Component = motion.create(as ?? 'div')

  return (
    <Component
      className={cn(className)}
      custom={animationNum}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={customVariants ?? defaultVariants}
    >
      {children}
    </Component>
  )
}
