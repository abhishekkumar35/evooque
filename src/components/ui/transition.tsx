import { Fragment, ReactNode } from 'react';
import { Transition as HeadlessTransition } from '@headlessui/react';
import { cn } from '@/lib/utils';

interface TransitionProps {
  show: boolean;
  children: ReactNode;
  appear?: boolean;
  className?: string;
  type?: 'fade' | 'slide' | 'scale' | 'bounce';
}

export function Transition({
  show,
  children,
  appear = false,
  className,
  type = 'fade',
}: TransitionProps) {
  const transitions = {
    fade: {
      enter: 'animate-fade-in',
      enterFrom: 'opacity-0',
      enterTo: 'opacity-100',
      leave: 'animate-fade-out',
      leaveFrom: 'opacity-100',
      leaveTo: 'opacity-0',
    },
    slide: {
      enter: 'animate-slide-in',
      enterFrom: 'opacity-0 translate-y-4',
      enterTo: 'opacity-100 translate-y-0',
      leave: 'animate-slide-out',
      leaveFrom: 'opacity-100 translate-y-0',
      leaveTo: 'opacity-0 translate-y-4',
    },
    scale: {
      enter: 'animate-scale-in',
      enterFrom: 'opacity-0 scale-95',
      enterTo: 'opacity-100 scale-100',
      leave: 'animate-scale-out',
      leaveFrom: 'opacity-100 scale-100',
      leaveTo: 'opacity-0 scale-95',
    },
    bounce: {
      enter: 'animate-bounce-in',
      enterFrom: 'opacity-0 scale-30',
      enterTo: 'opacity-100 scale-100',
      leave: 'animate-scale-out',
      leaveFrom: 'opacity-100 scale-100',
      leaveTo: 'opacity-0 scale-95',
    },
  };

  const transition = transitions[type];

  return (
    <HeadlessTransition
      as={Fragment}
      show={show}
      appear={appear}
      enter={cn('transform transition duration-200 ease-out', transition.enter)}
      enterFrom={transition.enterFrom}
      enterTo={transition.enterTo}
      leave={cn('transform transition duration-200 ease-in', transition.leave)}
      leaveFrom={transition.leaveFrom}
      leaveTo={transition.leaveTo}
    >
      <div className={className}>{children}</div>
    </HeadlessTransition>
  );
} 