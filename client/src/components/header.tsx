import { useContext, useEffect, useRef, useState } from "react";
import { removeCookie } from "typescript-cookie";
import { Link, useLocation } from "wouter";
import { oauth_url } from "../main";
import { LANGS, useI18n } from "../state/i18n";
import { Profile, ProfileContext } from "../state/profile";
import { Icon } from "./icon";
import { LangSwitcher } from "./lang";

/**
 * 导航栏布局对齐上游新版 Rin（xeu.life）：
 * - 整条通栏、透明无胶囊；顶部那层主题色渐变由 App.tsx 里的 fixed 元素提供
 * - 宽屏（>=768px）：站名在左，菜单纯文字靠右，最右是「语言 + 图标按钮」
 * - 窄屏（<768px）：菜单折叠成右侧「三条杠」，点开是下拉抽屉（语言在里面铺开成标签）
 */
type NavEntry = { titleKey: string, herf: string, isActive: (location: string) => boolean }

const NAV_KEYS: NavEntry[] = [
    { titleKey: "nav.articles", herf: "/", isActive: l => l === "/" || l.startsWith("/feed") },
    { titleKey: "nav.tags", herf: "/tags", isActive: l => l === "/tags" || l.startsWith("/tag/") },
    { titleKey: "nav.friends", herf: "/friends", isActive: l => l === "/friends" },
    { titleKey: "nav.about", herf: "/about", isActive: l => l === "/about" },
]

/**
 * 滚动超过这个距离，导航栏就从「全透明」切成「毛玻璃」。
 * 25 是照抄参考站 xeu.life 实测出来的拐点：scrollY=24 还透明，=25 就变毛玻璃。
 */
const NAV_BLUR_AT = 25

export function Header() {
    const profile = useContext(ProfileContext);
    const [location, _] = useLocation();
    const [menuOpen, setMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const rightRef = useRef<HTMLDivElement>(null);
    const { t, lang, setLang } = useI18n();

    // 换页就把抽屉收起来
    useEffect(() => { setMenuOpen(false) }, [location]);

    // 往下滚到 NAV_BLUR_AT 之后，给导航栏加一层毛玻璃（和参考站一致）
    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY >= NAV_BLUR_AT)
        onScroll()
        window.addEventListener("scroll", onScroll, { passive: true })
        return () => window.removeEventListener("scroll", onScroll)
    }, []);

    // 点抽屉外面任意位置也收起来
    useEffect(() => {
        if (!menuOpen) return
        const onDown = (e: MouseEvent) => {
            if (rightRef.current && !rightRef.current.contains(e.target as Node)) {
                setMenuOpen(false)
            }
        }
        document.addEventListener("mousedown", onDown)
        return () => document.removeEventListener("mousedown", onDown)
    }, [menuOpen])

    const items: NavEntry[] = [
        NAV_KEYS[0],
        ...(profile?.permission
            ? [{ titleKey: "nav.write", herf: "/writing", isActive: (l: string) => l.startsWith("/writing") }]
            : []),
        ...NAV_KEYS.slice(1),
    ]

    function logout() {
        removeCookie("token")
        window.location.reload()
    }

    return (
        <>
            <div className="fixed inset-x-0 top-0 z-40">
                <div className="w-screen">
                    <div className="w-full">
                        {/* 类名与参考站一一对应：静止 bg-transparent backdrop-blur-none，
                            滚动后 bg-white/20 backdrop-blur-xl（深色模式 dark:bg-white/[0.03]）。
                            参考站没有过渡，所以这里也不加 transition，保证切换手感一致。 */}
                        <div className={"flex w-full items-center justify-between gap-3 px-4 py-3 " + (scrolled
                            ? "bg-white/20 backdrop-blur-xl dark:bg-white/[0.03]"
                            : "bg-transparent backdrop-blur-none")}>
                            <Link href="/" className="min-w-0 flex flex-row items-center shrink-0">
                                <span className="relative inline-flex shrink-0 items-center justify-center overflow-hidden h-10 w-10 rounded-full">
                                    <img src={process.env.AVATAR} alt={process.env.NAME} className="absolute inset-0 h-full w-full object-cover" />
                                </span>
                                <div className="mx-2 flex min-w-0 flex-col items-start justify-center">
                                    <p className="max-w-full truncate text-base font-bold tracking-tight t-primary">
                                        {process.env.NAME}
                                    </p>
                                    <p className="hidden max-w-full truncate text-xs text-neutral-500 sm:block">
                                        {process.env.DESCRIPTION}
                                    </p>
                                </div>
                            </Link>

                            <div ref={rightRef} className="relative flex shrink-0 items-center gap-1">
                                {/* 宽屏：文字菜单靠右 */}
                                <div className="hidden min-w-0 items-center justify-end md:flex">
                                    <div className="flex min-w-max items-center overflow-x-auto text-sm">
                                        {items.map(item => (
                                            <NavItem key={item.herf} title={t(item.titleKey)} herf={item.herf} selected={item.isActive(location)} />
                                        ))}
                                    </div>
                                </div>
                                {/* 宽屏：语言 + 最右图标按钮 */}
                                <LangSwitcher />
                                <UserAvatar className="hidden md:flex" profile={profile} onLogout={logout} />

                                {/* 窄屏：三条杠 / 叉 */}
                                <button
                                    type="button"
                                    title={menuOpen ? t("nav.closeMenu") : t("nav.menu")}
                                    aria-label={menuOpen ? t("nav.closeMenu") : t("nav.menu")}
                                    aria-expanded={menuOpen}
                                    onClick={() => setMenuOpen(v => !v)}
                                    className="flex h-10 w-10 items-center justify-center rounded-full text-neutral-600 transition-colors hover:bg-black/5 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-white/10 dark:hover:text-neutral-100 md:hidden">
                                    <i className={menuOpen ? "ri-close-line ri-lg" : "ri-menu-line ri-lg"}></i>
                                </button>

                                {/* 窄屏抽屉 */}
                                {menuOpen &&
                                    <div className="absolute right-0 top-12 z-50 flex w-48 flex-col rounded-2xl bg-w py-2 shadow-xl shadow-color md:hidden">
                                        {items.map(item => (
                                            <Link key={item.herf} href={item.herf}
                                                className={"px-4 py-3 text-sm font-medium duration-300 hover:text-theme " + (item.isActive(location) ? "text-theme" : "t-secondary")}>
                                                {t(item.titleKey)}
                                            </Link>
                                        ))}
                                        <div className="my-1 border-t border-neutral-100 dark:border-neutral-700" />
                                        {/* 窄屏语言切换：铺成标签，比嵌套浮层好点 */}
                                        <div className="flex flex-row flex-wrap gap-2 px-4 py-3">
                                            {LANGS.map(l => (
                                                <button key={l.code} type="button"
                                                    onClick={() => setLang(l.code)}
                                                    className={"rounded-lg px-2 py-1 text-xs duration-300 " + (l.code === lang
                                                        ? "bg-theme text-white"
                                                        : "bg-neutral-100 dark:bg-neutral-700 t-secondary")}>
                                                    {l.name}
                                                </button>
                                            ))}
                                        </div>
                                        <div className="my-1 border-t border-neutral-100 dark:border-neutral-700" />
                                        {profile?.avatar
                                            ? <button type="button" onClick={logout}
                                                className="px-4 py-3 text-start text-sm font-medium t-secondary duration-300 hover:text-theme">
                                                {t("nav.logout")}
                                            </button>
                                            : <button type="button" onClick={() => window.location.href = `${oauth_url}`}
                                                className="flex flex-row items-center px-4 py-3 text-start text-sm font-medium t-secondary duration-300 hover:text-theme">
                                                <i className="ri-github-line mr-2"></i>{t("nav.login")}
                                            </button>}
                                    </div>
                                }
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="h-16"></div>
        </>
    )
}

function NavItem({ title, selected, herf }: { title: string, selected: boolean, herf: string }) {
    return (
        <Link href={herf} className={"cursor-pointer hover:text-theme duration-300 px-0 py-1 pr-3 text-sm font-medium " + (selected ? "text-theme" : "text-neutral-600 dark:text-neutral-300")}>
            {title}
        </Link>
    )
}

function UserAvatar({ profile, className, onLogout }: { className?: string, profile?: Profile, onLogout: () => void }) {
    const { t } = useI18n();
    return (<div className={"flex flex-row justify-end " + className}>
        {profile?.avatar ? <>
            <div className="relative">
                <img src={profile.avatar} alt="Avatar" className="w-9 h-9 rounded-full" />
                <div className="z-50 absolute left-0 top-0 w-9 h-9 opacity-0 hover:opacity-100 duration-300">
                    <Icon label={t("nav.logout")} name="ri-logout-circle-line ri-xl" onClick={onLogout} hover={false} />
                </div>
            </div>
        </> : <>
            <button title={t("nav.login")} aria-label={t("nav.login")}
                onClick={() => window.location.href = `${oauth_url}`}
                className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-600 transition-colors hover:bg-black/5 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-white/10 dark:hover:text-neutral-100">
                <i className="ri-github-line ri-xl"></i>
            </button>
        </>}
    </div>)
}
