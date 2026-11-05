/** Etiqueta permanente y pequeña (brief 6.6). */
export function DemoBadge() {
  return (
    <div
      className="pointer-events-none fixed bottom-3 left-3 z-50 rounded-sm bg-bond-night/90 px-2.5 py-1.5 text-bond-butter backdrop-blur-sm"
      role="note"
    >
      <span className="label-caps !text-[0.625rem] !tracking-[0.22em]">Demo · datos simulados</span>
    </div>
  );
}
