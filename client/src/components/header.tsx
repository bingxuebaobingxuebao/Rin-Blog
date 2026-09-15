import { useContext } from "react";
import { removeCookie } from "typescript-cookie";
import { Link, useLocation } from "wouter";
import { oauth_url } from "../main";
import { Profile, ProfileContext } from "../state/profile";
import { Icon } from "./icon";

/**
 * 导航栏布局对齐上游新版 Rin（xeu.life）：
 * 整条通栏、透明无胶囊；左侧头像 + 站名/描述，菜单靠右纯文字，最右是图标按钮。
 * 顶部那层主题色渐变由 App.tsx 里的 fixed 元素提供。
 */
export function Header() {
    const profile = useContext(ProfileContext);
    const [location, _] = useLocation();
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
                            <div className="flex min-w-0 flex-1 items-center justify-end">
                                <div className="flex min-w-max items-center justify-end overflow-x-auto text-sm">
                                    <NavItem title="文章" selected={location === "/" || location.startsWith('/feed')} herf="/" />
                                    {profile?.permission && <NavItem title="写作" selected={location.startsWith("/writing")} herf="/writing" />}
                                    <NavItem title="朋友们" selected={location === "/friends"} herf="/friends" />
                                    <NavItem title="关于" selected={location === "/about"} herf="/about" />
                                </div>
                            </div>
                            <UserAvatar className="shrink-0 items-center" profile={profile} />
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

function UserAvatar({ profile, className }: { className?: string, profile?: Profile }) {
    return (<div className={"flex flex-row justify-end " + className}>
        {profile?.avatar ? <>
            <div className="relative">
                <img src={profile.avatar} alt="Avatar" className="w-9 h-9 rounded-full" />
                <div className="z-50 absolute left-0 top-0 w-9 h-9 opacity-0 hover:opacity-100 duration-300">
                    <Icon label="退出登录" name="ri-logout-circle-line ri-xl" onClick={() => {
                        removeCookie("token")
                        window.location.reload()
                    }} hover={false} />
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
