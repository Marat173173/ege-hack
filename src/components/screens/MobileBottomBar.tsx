"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Gauge, Building2, Footprints, BookOpen, MessageCircle, CalendarClock, Flame, X,
  type LucideIcon,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { computeScore } from "@/lib/score-model";
import { overallReadiness } from "@/lib/floor-build";
import { SpireMark } from "@/components/ui/spire-mark";
import { useBodyScrollLock } from "@/lib/use-scroll-lock";

/**
 * Мобильная навигация (только телефон).
 *
 * По ТЗ: вся навигация свёрнута в плавающую кнопку-бургер В ВИДЕ ЛОГОТИПА-Шпиля.
 * Тап раскрывает «облако» пунктов в стекле macOS Tahoe (liquid glass).
 * Прогресс-бар готовности оставлен ОТДЕЛЬНО — тонкой плашкой внизу.
 */
export function MobileBottomBar() {
  const subject = useApp((s) => s.subject());
  const profile = useApp((s) => s.profile);
  const updateProfile = useApp((s) => s.updateProfile);
  const setSheet = useApp((s) => s.setSheet);
  const setScreen = useApp((s) => s.setScreen);
  const closeInspector = useApp((s) => s.closeInspector);

  const [open, setOpen] = React.useState(false);

  const sc = computeScore(subject);
  const ready = overallReadiness(subject.floors);
  const isPath = profile.viewMode === "path";

  // блок фон-скролла (общий ref-count) + Escape, пока облако открыто
  useBodyScrollLock(open);
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function act(fn: () => void) {
    setOpen(false);
    fn();
  }

  const items: {
    icon: LucideIcon;
    label: string;
    onClick: () => void;
    custom?: React.ReactNode;
    accent?: boolean;
  }[] = [
    {
      icon: isPath ? Footprints : Building2,
      label: isPath ? "Тропа" : "Шпиль",
      onClick: () =>
        act(() => {
          closeInspector();
          updateProfile({ viewMode: isPath ? "spire" : "path", viewChosen: true });
        }),
    },
    { icon: BookOpen, label: "Урок", onClick: () => act(() => setSheet("lessonPicker")) },
    { icon: Gauge, label: "Прогресс", onClick: () => act(() => setSheet("progress")) },
    { icon: Flame, label: `${sc.solid}/${sc.total}`, onClick: () => act(() => setSheet("progress")), accent: true },
    { icon: MessageCircle, label: "Чат", onClick: () => act(() => setScreen("chat")) },
    {
      icon: BookOpen, // не используется — рисуем custom-аватар
      label: "Профиль",
      onClick: () => act(() => setScreen("profile")),
      custom: (
        <span
          className="grid h-7 w-7 place-items-center rounded-full text-[15px]"
          style={{
            background: `hsl(${profile.avatarHue} 70% 55% / 0.22)`,
            border: `1.5px solid hsl(${profile.avatarHue} 70% 55% / 0.6)`,
          }}
        >
          {profile.avatarEmoji}
        </span>
      ),
    },
  ];

  return (
    <>
      {/* ——— тонкий прогресс-бар готовности (остаётся внизу отдельно) ——— */}
      <button
        onClick={() => setSheet("progress")}
        className="pointer-events-auto fixed inset-x-0 bottom-0 z-[38] flex w-full items-center gap-2.5 border-t border-line bg-[rgb(var(--glass-tint)/0.82)] px-3 pt-2 backdrop-blur-xl"
        style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
        aria-label="Открыть прогресс готовности"
      >
        <Gauge size={15} className="shrink-0 text-accent" />
        <div className="min-w-0 flex-1">
          <div className="mb-0.5 flex items-center justify-between">
            <span className="hud-label text-[8px] text-lo">Готовность · {subject.short}</span>
            <span className="font-mono text-[11px] font-bold text-accent">{ready}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-[rgb(var(--glass-hi)/0.1)]">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-accent-2 to-accent"
              animate={{ width: `${ready}%` }}
              transition={{ type: "spring", stiffness: 120, damping: 22 }}
            />
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className="flex items-center justify-end gap-1 hud-label text-[7.5px] text-lo">
            <CalendarClock size={8} /> До ЕГЭ
          </div>
          <b className="font-mono text-[12px] text-hi">{subject.days}д</b>
        </div>
      </button>

      {/* ——— бэкдроп облака ——— */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[44]"
            style={{
              background: "rgb(var(--scrim) / 0.4)",
              backdropFilter: "blur(7px) saturate(120%)",
              WebkitBackdropFilter: "blur(7px) saturate(120%)",
            }}
          />
        )}
      </AnimatePresence>

      {/* ——— «облако» пунктов меню (стекло macOS) ——— */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 360, damping: 30 }}
            className="liquid-glass fixed left-2 z-[46] w-[min(320px,calc(100vw-16px))] origin-top-left overflow-hidden rounded-[26px] p-3"
            style={{
              top: "calc(env(safe-area-inset-top) + 60px)",
              // плотный фон, чтобы пункты читались поверх сцены
              background:
                "linear-gradient(180deg, rgb(var(--glass-hi) / 0.08), transparent 45%), rgb(var(--bg-1) / 0.97)",
              backdropFilter: "blur(28px) saturate(185%)",
              WebkitBackdropFilter: "blur(28px) saturate(185%)",
            }}
            role="menu"
            aria-label="Навигация"
          >
            <span className="liquid-glass-sheen" aria-hidden="true" />
            {/* закрытие — в левом верхнем углу облака, чтобы не перекрывать плитки */}
            <div className="mb-2 flex items-center justify-between px-0.5">
              <button
                onClick={() => setOpen(false)}
                aria-label="Закрыть меню"
                className="grid h-8 w-8 place-items-center rounded-full border border-line bg-[rgb(var(--glass-hi)/0.06)] text-accent transition-colors active:bg-[rgb(var(--glass-hi)/0.14)]"
              >
                <X size={18} strokeWidth={2.4} />
              </button>
              <span className="hud-label text-[8.5px] text-lo">Навигация</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {items.map((it, i) => (
                <CloudItem key={it.label} {...it} index={i} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ——— кнопка-бургер в виде логотипа-Шпиля (СЛЕВА СВЕРХУ, на месте логотипа) ——— */}
      <motion.button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Закрыть меню" : "Открыть меню"}
        aria-expanded={open}
        whileTap={{ scale: 0.9 }}
        className="liquid-glass fixed left-2 z-[47] grid place-items-center rounded-full"
        style={{
          top: "calc(env(safe-area-inset-top) + 8px)",
          width: 46,
          height: 46,
          background:
            "linear-gradient(180deg, rgb(var(--glass-hi) / 0.1), transparent 50%), rgb(var(--bg-1) / 0.92)",
          backdropFilter: "blur(22px) saturate(180%)",
          WebkitBackdropFilter: "blur(22px) saturate(180%)",
          boxShadow:
            "0 10px 28px -10px rgb(var(--accent) / 0.55), inset 0 1px 0 rgb(var(--glass-hi) / 0.5)",
        }}
      >
        <span className="liquid-glass-sheen" aria-hidden="true" />
        <span
          className="absolute inset-0 rounded-full"
          style={{
            background:
              "radial-gradient(60% 60% at 50% 30%, rgb(var(--accent) / 0.22), transparent 70%)",
          }}
        />
        {/* всегда логотип-Шпиль (закрытие меню — крестиком в самом облаке) */}
        <motion.span
          animate={{ rotate: open ? 90 : 0 }}
          transition={{ duration: 0.2 }}
          className="relative text-accent"
        >
          <SpireMark size={24} strokeWidth={2.4} />
        </motion.span>
      </motion.button>
    </>
  );
}

function CloudItem({
  icon: Icon,
  label,
  onClick,
  custom,
  accent,
  index,
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  custom?: React.ReactNode;
  accent?: boolean;
  index: number;
}) {
  return (
    <motion.button
      role="menuitem"
      onClick={onClick}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.03 * index, type: "spring", stiffness: 420, damping: 28 }}
      whileTap={{ scale: 0.92 }}
      className="flex flex-col items-center gap-1.5 rounded-2xl border border-line bg-[rgb(var(--glass-hi)/0.04)] px-2 py-3 transition-colors active:bg-[rgb(var(--glass-hi)/0.1)]"
    >
      {custom ?? <Icon size={22} className={accent ? "text-accent" : "text-mid"} />}
      <span
        className="hud-label text-[8.5px]"
        style={{ color: accent ? "rgb(var(--accent))" : "rgb(var(--mid))" }}
      >
        {label}
      </span>
    </motion.button>
  );
}
