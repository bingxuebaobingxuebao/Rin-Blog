import { useEffect, useRef, useState } from "react";
import { LANGS, useI18n } from "../state/i18n";

/**
 * 语言切换按钮（对齐 xeu.life 的 Languages，`ri-translate-2` 图标 + 浮层）。
 * 窄屏不用这个组件，直接在汉堡抽屉里铺一排语言标签，触屏更好点。
 */
export function LangSwitcher({ plain = false }: { plain?: boolean }) {
    const { lang, setLang, t } = useI18n();
    const [open, setOpen] = useState(false);
    const boxRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return
        const onDown = (e: MouseEvent) => {
            if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener("mousedown", onDown)
        return () => document.removeEventListener("mousedown", onDown)
    }, [open])

    return (
        <div ref={boxRef} className="relative flex flex-row items-center">
            <button type="button"
                title={t("nav.language")}
                aria-label={t("nav.language")}
                aria-expanded={open}
                onClick={() => setOpen(v => !v)}
                className={plain
                    ? "flex aspect-[1] items-center justify-center px-1.5 text-neutral-500 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
                    : "flex h-9 w-9 items-center justify-center rounded-full text-neutral-600 transition-colors hover:bg-black/5 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-white/10 dark:hover:text-neutral-100"}>
                <i className="ri-translate-2 ri-lg"></i>
            </button>
            {open &&
                <div className="absolute right-0 top-12 z-50 flex w-40 flex-col rounded-2xl bg-w py-2 shadow-xl shadow-color">
                    {LANGS.map(l => (
                        <button key={l.code} type="button"
                            onClick={() => { setLang(l.code); setOpen(false); }}
                            className={"px-4 py-2 text-start text-sm duration-300 hover:text-theme " + (l.code === lang ? "text-theme font-medium" : "t-secondary")}>
                            {l.name}
                        </button>
                    ))}
                </div>
            }
        </div>
    )
}
