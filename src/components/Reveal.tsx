"use client";

import { motion, useInView, useReducedMotion } from "motion/react";
import { useRef, type ReactNode } from "react";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Reveal del titular por líneas con máscara (brief 4.2). Con
 * `prefers-reduced-motion` solo hace un fade simple.
 */
export function RevealLines({
  lines,
  className = "",
  lineClassName = "",
  as: Tag = "h2",
}: {
  lines: ReactNode[];
  className?: string;
  lineClassName?: string;
  as?: "h1" | "h2" | "h3" | "p";
}) {
  const reduce = useReducedMotion();
  // Se observa el contenedor (no la línea): la línea está recortada por su máscara
  // y el IntersectionObserver nunca la vería.
  const ref = useRef<HTMLHeadingElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });
  return (
    <Tag ref={ref} className={className}>
      {lines.map((line, i) => (
        <span key={i} className={`block overflow-hidden pb-[0.22em] -mb-[0.22em] pl-[0.08em] -ml-[0.08em] pr-[0.04em] ${lineClassName}`}>
          <motion.span
            className="block"
            initial={false}
            animate={reduce ? { opacity: inView ? 1 : 0 } : { y: inView ? "0%" : "108%" }}
            transition={{ duration: reduce ? 0.2 : 0.9, delay: reduce ? 0 : i * 0.12, ease: EASE }}
          >
            {line}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
}

/** Fade-up genérico para bloques. */
export function FadeIn({ children, className = "", delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: reduce ? 0 : 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: reduce ? 0.2 : 0.7, delay: reduce ? 0 : delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}
