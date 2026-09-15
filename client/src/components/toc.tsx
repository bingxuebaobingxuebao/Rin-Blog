import { useEffect, useState } from "react";

type TocItem = {
    id: string;
    text: string;
    level: number;
}

/**
 * 文章右侧「目录」（对齐 xeu.life 的侧栏）。
 *
 * 关键点：**不去自己算 slug**，而是等 MarkdownPreview 渲染完之后直接读 DOM 里标题的 id。
 * 因为上游渲染器已经给每个标题加了 GitHub 风格的中文锚点 id（如「一photoshop-是什么」），
 * 自己再实现一套 slug 很容易和它对不上。
 */
export function Toc({ container = "article .wmde-markdown", deps }: { container?: string, deps?: any }) {
    const [items, setItems] = useState<TocItem[]>([])
    const [active, setActive] = useState<string>("")

    useEffect(() => {
        const box = document.querySelector(container)
        if (!box) {
            setItems([])
            return
        }
        const list: TocItem[] = []
        box.querySelectorAll("h1,h2,h3,h4,h5,h6").forEach(el => {
            const id = el.id
            const text = (el.textContent || "").trim()
            if (!id || !text) return
            list.push({ id, text, level: Number(el.tagName.slice(1)) })
        })
        setItems(list)
    }, [container, deps])

    // 滚动高亮：找出最后一个已经滚过视口上沿的标题
    useEffect(() => {
        if (items.length === 0) return
        let raf = 0
        const onScroll = () => {
            if (raf) return
            raf = window.requestAnimationFrame(() => {
                raf = 0
                let current = items[0].id
                for (const it of items) {
                    const el = document.getElementById(it.id)
                    if (!el) continue
                    if (el.getBoundingClientRect().top <= 120) current = it.id
                }
                setActive(current)
            })
        }
        onScroll()
        window.addEventListener("scroll", onScroll, { passive: true })
        return () => {
            window.removeEventListener("scroll", onScroll)
            if (raf) window.cancelAnimationFrame(raf)
        }
    }, [items])

    if (items.length === 0) return null

    const base = Math.min(...items.map(i => i.level))

    return (
        <div className="hidden lg:block w-64 xl:w-80 shrink-0">
            <div className="sticky top-20">
                <div className="rounded-2xl bg-w py-4 px-4 t-primary">
                    <h2 className="text-lg font-bold">目录</h2>
                    <ul className="mt-2 max-h-[calc(100vh-10rem)] overflow-auto" style={{ scrollbarWidth: "none" }}>
                        {items.map(it => (
                            <li key={it.id}
                                title={it.text}
                                onClick={() => {
                                    document.getElementById(it.id)?.scrollIntoView({ behavior: "smooth", block: "start" })
                                }}
                                style={{ marginLeft: Math.max(0, it.level - base) * 10 }}
                                className={"cursor-pointer duration-300 hover:opacity-50 text-sm py-1 leading-snug truncate " + (active === it.id ? "text-theme" : "")}>
                                {it.text}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    )
}
