import { useContext, useEffect, useRef, useState } from "react";
import { removeCookie } from "typescript-cookie";
import { Link, useLocation } from "wouter";
import { oauth_url } from "../main";
import { Profile, ProfileContext } from "../state/profile";
import { Icon } from "./icon";

/**
 * 导航栏布局对齐上游新版 Rin（xeu.life）：
 * - 整条通栏、透明无胶囊；顶部那层主题色渐变由 App.tsx 里的 fixed 元素提供
 * - 宽屏（>=768px）：站名在左，菜单纯文字靠右，最右是图标按钮
 * - 窄屏（<768px）：菜单折叠成右侧「三条杠」，点开是下拉抽屉
 */
type NavEntry = { title: string, herf: string, isActive: (location: string) => boolean }

const NAV_ITEMS: NavEntry[] = [
    { title: "文章", herf: "/", isActive: l => l === "/" || l.startsWith("/feed") },
    { title: "标签", herf: "/tags", isActive: l => l === "/tags" || l.startsWith("/tag/") },
    { title: "朋友们", herf: "/friends", isActive: l => l === "/friends" },
    { title: "关于", herf: "/about", isActive: l => l === "/about" },
]

export function Header() {
    const profile = useContext(ProfileContext);
    const [location, _] = useLocation();
    const [menuOpen, setMenuOpen] = useState(false);
    const rightRef = useRef<HTMLDivElement>(null);

    // 换页就把抽屉收起来
    useEffect(() => { setMenuOpen(false) }, [location]);

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
        NAV_ITEMS[0],
        ...(profile?.permission
            ? [{ title: "写作", herf: "/writing", isActive: (l: string) => l.startsWith("/writing") }]
            : []),
        ...NAV_ITEMS.slice(1),
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
                        <div className="flex w-full items-center justify-between gap-3 px-4 py-3">
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
                                            <NavItem key={item.herf} title={item.title} herf={item.herf} selected={item.isActive(location)} />
                                        ))}
                                    </div>
                                </div>
                                {/* 宽屏：最右图标按钮 */}
                                <UserAvatar className="hidden md:flex" profile={profile} onLogout={logout} />

                                {/* 窄屏：三条杠 / 叉 */}
                                <button
                                    type="button"
                                    title={menuOpen ? "关闭菜单" : "菜单"}
                                    aria-label={menuOpen ? "关闭菜单" : "菜单"}
                                    aria-expanded={menuOpen}
                                    onClick={() => setMenuOpen(v => !v)}
                                    className="flex h-10 w-10 items-center justify-center rounded-full text-neutral-600 transition-colors hover:bg-black/5 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-white/10 dark:hover:text-neutral-100 md:hidden">
                                    <i className={menuOpen ? "ri-close-line ri-lg" : "ri-menu-line ri-lg"}></i>
                                </button>

                                {/* 窄屏抽屉 */}
                                {menuOpen &&
                                    <div className="absolute right-0 top-12 z-50 flex w-44 flex-col rounded-2xl bg-w py-2 shadow-xl shadow-color md:hidden">
                                        {items.map(item => (
                                            <Link key={item.herf} href={item.herf}
                                                className={"px-4 py-3 text-sm font-medium duration-300 hover:text-theme " + (item.isActive(location) ? "text-theme" : "t-secondary")}>
                                                {item.title}
                                            </Link>
                                        ))}
                                        <div className="my-1 border-t border-neutral-100 dark:border-neutral-700" />
                                        {profile?.avatar
                                            ? <button type="button" onClick={logout}
                                                className="px-4 py-3 text-start text-sm font-medium t-secondary duration-300 hover:text-theme">
                                                退出登录
                                            </button>
                                            : <button type="button" onClick={() => window.location.href = `${oauth_url}`}
                                                className="flex flex-row items-center px-4 py-3 text-start text-sm font-medium t-secondary duration-300 hover:text-theme">
                                                <i className="ri-github-line mr-2"></i>Github 登录
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
    return (<div className={"flex flex-row justify-end " + className}>
        {profile?.avatar ? <>
            <div className="relative">
                <img src={profile.avatar} alt="Avatar" className="w-9 h-9 rounded-full" />
                <div className="z-50 absolute left-0 top-0 w-9 h-9 opacity-0 hover:opacity-100 duration-300">
                    <Icon label="退出登录" name="ri-logout-circle-line ri-xl" onClick={onLogout} hover={false} />
                </div>
            </div>
        </> : <>
            <button title="Github 登录" aria-label="Github 登录"
                onClick={() => window.location.href = `${oauth_url}`}
                className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-600 transition-colors hover:bg-black/5 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-white/10 dark:hover:text-neutral-100">
                <i className="ri-github-line ri-xl"></i>
            </button>
        </>}
    </div>)
}
