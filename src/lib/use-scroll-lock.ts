"use client";

import * as React from "react";

/**
 * Блокировка скролла body, безопасная при НЕСКОЛЬКИХ открытых оверлеях.
 *
 * Раньше каждый оверлей сам сохранял/восстанавливал body.style.overflow.
 * При переходе «бургер → шит» один оверлей восстанавливал "hidden",
 * сохранённый другим, и страница навсегда оставалась залоченной.
 *
 * Здесь общий счётчик: блок снимается только когда закрыт последний оверлей.
 */
let lockCount = 0;

export function useBodyScrollLock(active: boolean) {
  React.useEffect(() => {
    if (!active || typeof document === "undefined") return;
    lockCount += 1;
    document.body.style.overflow = "hidden";
    return () => {
      lockCount = Math.max(0, lockCount - 1);
      if (lockCount === 0) document.body.style.overflow = "";
    };
  }, [active]);
}
