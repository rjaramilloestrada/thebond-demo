import type { ElementType, ReactNode } from "react";

/** Etiqueta pequeña en mayúsculas con tracking amplio (brief 3.2). */
export function Label({
  children,
  as: Tag = "span",
  className = "",
}: {
  children: ReactNode;
  as?: ElementType;
  className?: string;
}) {
  return <Tag className={`label-caps ${className}`}>{children}</Tag>;
}
