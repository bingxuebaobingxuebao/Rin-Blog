import { format as timeagoFormat, register } from "@astroimg/timeago";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type Lang = "zh-CN" | "zh-TW" | "en" | "ja";

/** 语言清单（顺序和示范站一致） */
export const LANGS: { code: Lang, name: string }[] = [
    { code: "zh-CN", name: "简体中文" },
    { code: "zh-TW", name: "繁體中文" },
    { code: "en", name: "English" },
    { code: "ja", name: "日本語" },
];

type Dict = Record<string, string>;

type Rel = { now: string, minutes: string, hours: string, yesterday: string }

const relZhCN: Rel = { now: "刚刚", minutes: "%s分钟前", hours: "%s小时前", yesterday: "昨天 %s" };
const relZhTW: Rel = { now: "剛剛", minutes: "%s分鐘前", hours: "%s小時前", yesterday: "昨天 %s" };
const relEn: Rel = { now: "just now", minutes: "%sm ago", hours: "%sh ago", yesterday: "yesterday %s" };
const relJa: Rel = { now: "たった今", minutes: "%s分前", hours: "%s時間前", yesterday: "昨日 %s" };

const REL: Record<Lang, Rel> = { "zh-CN": relZhCN, "zh-TW": relZhTW, en: relEn, ja: relJa };

const pad = (n: number) => String(n).padStart(2, "0");
const fmtDM = (d: Date) => `${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fmtYMD = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/**
 * `@astroimg/timeago` 自带的 DEFAULT 类型只认识 zh-CN / en，
 * 传 zh-TW 或 ja 会取到 undefined 然后 `.replace` 直接炸。
 * 所以这里自己注册一套认 4 种语言的时间格式。
 */
register("RIN", [
    {
        label: "IN_5_MIN",
        parse: (_diff, _date, locale) => rel(locale).now,
    },
    {
        label: "IN_1_HOUR",
        parse: (diff, _date, locale) => rel(locale).minutes.replace(/%s/gi, String(Math.floor(diff / 60))),
    },
    {
        label: "IN_TODAY",
        parse: (diff, _date, locale) => rel(locale).hours.replace(/%s/gi, String(Math.floor(diff / 3600))),
    },
    {
        label: "IN_YESTERDAY",
        parse: (_diff, date, locale) =>
            rel(locale).yesterday.replace(/%s/gi, `${pad(date.getHours())}:${pad(date.getMinutes())}`),
    },
    { label: "IN_1_YEAR", parse: (_diff, date) => fmtDM(date) },
    { label: "IN_YEARS", parse: (_diff, date) => fmtYMD(date) },
]);

function rel(locale?: string): Rel {
    return REL[locale as Lang] ?? REL["zh-CN"];
}

// ---------------------------------------------------------------- 词典

const zhCN: Dict = {
    "nav.articles": "文章",
    "nav.tags": "标签",
    "nav.friends": "朋友们",
    "nav.about": "关于",
    "nav.write": "写作",
    "nav.menu": "菜单",
    "nav.closeMenu": "关闭菜单",
    "nav.login": "Github 登录",
    "nav.logout": "退出登录",
    "nav.language": "语言",

    "list.articles": "文章",
    "list.drafts": "草稿箱",
    "list.unlisted": "未列出",
    "list.count": "共有 {0} 篇文章",
    "list.prev": "上一页",
    "list.next": "下一页",

    "time.published": "发布于 {0}",
    "time.updated": "更新于 {0}",
    "card.draft": "草稿",
    "card.unlisted": "未列出",

    "feed.backHome": "返回首页",
    "common.reload": "重新加载",

    "comment.title": "评论",
    "comment.placeholder": "说点什么吧",
    "comment.submit": "发表评论",
    "comment.hint": "未登录也可以看，评论需要先点右上角用 Github 登录",
    "comment.success": "评论成功",
    "comment.confirmDelete": "确定要删除这条评论吗？",
    "comment.deleted": "删除成功",

    "friends.title": "朋友们",
    "friends.slogan": "梦想的同行者",
    "friends.away": "暂时离开",
    "friends.create": "创建友链",
    "friends.name": "站点名称",
    "friends.desc": "描述",
    "friends.avatar": "头像地址",
    "friends.url": "地址",
    "friends.submit": "创建",
    "friends.created": "创建成功",
    "friends.certExpired": "证书已过期",
    "friends.unreachable": "无法访问",

    "write.publish": "发布",
    "write.title": "标题",
    "write.summary": "摘要",
    "write.tags": "标签",
    "write.alias": "别名",
    "write.draft": "仅自己可见",
    "write.listed": "列出在文章中",
    "write.published": "发布成功",
    "write.updated": "更新成功",
    "write.uploadFailed": "上传失败",
    "write.tooLarge": "图片不能超过 5MB",

    "tags.title": "标签",
    "tags.count": "共 {0} 个标签",
    "tags.perTag": "{0} 篇",
    "tags.all": "全部标签",
    "tags.feedCount": "共有 {0} 篇文章",
    "tags.notFound": "没有找到标签「{0}」",
    "tags.loadFailed": "标签加载失败",

    "theme.light": "浅色模式",
    "theme.system": "跟随系统",
    "theme.dark": "深色模式",

    "app.notFound": "404: 页面不存在",

    "err.Not found": "内容不存在",
    "err.Permission denied": "没有权限",
    "err.Unauthorized": "请先登录",
    "err.Content is required": "内容不能为空",
    "err.Title is required": "标题不能为空",
    "err.Content already exists": "内容已存在",
};

const zhTW: Dict = {
    "nav.articles": "文章",
    "nav.tags": "標籤",
    "nav.friends": "朋友們",
    "nav.about": "關於",
    "nav.write": "寫作",
    "nav.menu": "選單",
    "nav.closeMenu": "關閉選單",
    "nav.login": "以 Github 登入",
    "nav.logout": "登出",
    "nav.language": "語言",

    "list.articles": "文章",
    "list.drafts": "草稿匣",
    "list.unlisted": "未列出",
    "list.count": "共有 {0} 篇文章",
    "list.prev": "上一頁",
    "list.next": "下一頁",

    "time.published": "發佈於 {0}",
    "time.updated": "更新於 {0}",
    "card.draft": "草稿",
    "card.unlisted": "未列出",

    "feed.backHome": "返回首頁",
    "common.reload": "重新載入",

    "comment.title": "評論",
    "comment.placeholder": "說點什麼吧",
    "comment.submit": "發表評論",
    "comment.hint": "未登入也可以看，留言需要先點右上角用 Github 登入",
    "comment.success": "留言成功",
    "comment.confirmDelete": "確定要刪除這則留言嗎？",
    "comment.deleted": "刪除成功",

    "friends.title": "朋友們",
    "friends.slogan": "夢想的同行者",
    "friends.away": "暫時離開",
    "friends.create": "建立友鏈",
    "friends.name": "站點名稱",
    "friends.desc": "描述",
    "friends.avatar": "頭像網址",
    "friends.url": "網址",
    "friends.submit": "建立",
    "friends.created": "建立成功",
    "friends.certExpired": "憑證已過期",
    "friends.unreachable": "無法存取",

    "write.publish": "發佈",
    "write.title": "標題",
    "write.summary": "摘要",
    "write.tags": "標籤",
    "write.alias": "別名",
    "write.draft": "僅自己可見",
    "write.listed": "列出在文章中",
    "write.published": "發佈成功",
    "write.updated": "更新成功",
    "write.uploadFailed": "上傳失敗",
    "write.tooLarge": "圖片不能超過 5MB",

    "tags.title": "標籤",
    "tags.count": "共 {0} 個標籤",
    "tags.perTag": "{0} 篇",
    "tags.all": "全部標籤",
    "tags.feedCount": "共有 {0} 篇文章",
    "tags.notFound": "找不到標籤「{0}」",
    "tags.loadFailed": "標籤載入失敗",

    "theme.light": "淺色模式",
    "theme.system": "跟隨系統",
    "theme.dark": "深色模式",

    "app.notFound": "404: 頁面不存在",

    "err.Not found": "找不到內容",
    "err.Permission denied": "沒有權限",
    "err.Unauthorized": "請先登入",
    "err.Content is required": "內容不能為空",
    "err.Title is required": "標題不能為空",
    "err.Content already exists": "內容已存在",
};

const en: Dict = {
    "nav.articles": "Articles",
    "nav.tags": "Tags",
    "nav.friends": "Friends",
    "nav.about": "About",
    "nav.write": "Write",
    "nav.menu": "Menu",
    "nav.closeMenu": "Close menu",
    "nav.login": "Sign in with Github",
    "nav.logout": "Sign out",
    "nav.language": "Languages",

    "list.articles": "Articles",
    "list.drafts": "Drafts",
    "list.unlisted": "Unlisted",
    "list.count": "{0} articles",
    "list.prev": "Previous",
    "list.next": "Next",

    "time.published": "Published {0}",
    "time.updated": "Updated {0}",
    "card.draft": "Draft",
    "card.unlisted": "Unlisted",

    "feed.backHome": "Back to home",
    "common.reload": "Reload",

    "comment.title": "Comments",
    "comment.placeholder": "Say something…",
    "comment.submit": "Post",
    "comment.hint": "Reading needs no account — posting a comment requires the Github login at the top right",
    "comment.success": "Posted",
    "comment.confirmDelete": "Delete this comment?",
    "comment.deleted": "Deleted",

    "friends.title": "Friends",
    "friends.slogan": "Fellow travellers",
    "friends.away": "Away for now",
    "friends.create": "Add a friend link",
    "friends.name": "Site name",
    "friends.desc": "Description",
    "friends.avatar": "Avatar URL",
    "friends.url": "URL",
    "friends.submit": "Create",
    "friends.created": "Created",
    "friends.certExpired": "Certificate expired",
    "friends.unreachable": "Unreachable",

    "write.publish": "Publish",
    "write.title": "Title",
    "write.summary": "Summary",
    "write.tags": "Tags",
    "write.alias": "Alias",
    "write.draft": "Visible only to me",
    "write.listed": "List on home page",
    "write.published": "Published",
    "write.updated": "Updated",
    "write.uploadFailed": "Upload failed",
    "write.tooLarge": "Image must be under 5MB",

    "tags.title": "Tags",
    "tags.count": "{0} tags",
    "tags.perTag": "{0}",
    "tags.all": "All tags",
    "tags.feedCount": "{0} articles",
    "tags.notFound": "Tag “{0}” not found",
    "tags.loadFailed": "Failed to load tags",

    "theme.light": "Light mode",
    "theme.system": "Follow system",
    "theme.dark": "Dark mode",

    "app.notFound": "404: No such page!",

    "err.Not found": "Not found",
    "err.Permission denied": "Permission denied",
    "err.Unauthorized": "Please sign in",
    "err.Content is required": "Content is required",
    "err.Title is required": "Title is required",
    "err.Content already exists": "Content already exists",
};

const ja: Dict = {
    "nav.articles": "記事",
    "nav.tags": "タグ",
    "nav.friends": "フレンズ",
    "nav.about": "について",
    "nav.write": "書く",
    "nav.menu": "メニュー",
    "nav.closeMenu": "メニューを閉じる",
    "nav.login": "Github でログイン",
    "nav.logout": "ログアウト",
    "nav.language": "言語",

    "list.articles": "記事",
    "list.drafts": "下書き",
    "list.unlisted": "非公開",
    "list.count": "記事 {0} 件",
    "list.prev": "前へ",
    "list.next": "次へ",

    "time.published": "{0}に公開",
    "time.updated": "{0}に更新",
    "card.draft": "下書き",
    "card.unlisted": "非公開",

    "feed.backHome": "ホームへ戻る",
    "common.reload": "再読み込み",

    "comment.title": "コメント",
    "comment.placeholder": "何か書いてください",
    "comment.submit": "投稿する",
    "comment.hint": "閲覧だけならログイン不要です。コメントには右上の Github ログインが必要です",
    "comment.success": "投稿しました",
    "comment.confirmDelete": "このコメントを削除しますか？",
    "comment.deleted": "削除しました",

    "friends.title": "フレンズ",
    "friends.slogan": "夢の同行者",
    "friends.away": "しばらくお休み",
    "friends.create": "リンクを追加",
    "friends.name": "サイト名",
    "friends.desc": "説明",
    "friends.avatar": "アバターURL",
    "friends.url": "URL",
    "friends.submit": "作成",
    "friends.created": "作成しました",
    "friends.certExpired": "証明書の有効期限切れ",
    "friends.unreachable": "接続できません",

    "write.publish": "公開",
    "write.title": "タイトル",
    "write.summary": "要約",
    "write.tags": "タグ",
    "write.alias": "エイリアス",
    "write.draft": "自分のみ公開",
    "write.listed": "一覧に表示",
    "write.published": "公開しました",
    "write.updated": "更新しました",
    "write.uploadFailed": "アップロードに失敗しました",
    "write.tooLarge": "画像は 5MB 以下にしてください",

    "tags.title": "タグ",
    "tags.count": "タグ {0} 件",
    "tags.perTag": "{0} 件",
    "tags.all": "すべてのタグ",
    "tags.feedCount": "記事 {0} 件",
    "tags.notFound": "タグ「{0}」が見つかりません",
    "tags.loadFailed": "タグの読み込みに失敗しました",

    "theme.light": "ライトモード",
    "theme.system": "システムに従う",
    "theme.dark": "ダークモード",

    "app.notFound": "404: ページが見つかりません",

    "err.Not found": "見つかりません",
    "err.Permission denied": "権限がありません",
    "err.Unauthorized": "ログインしてください",
    "err.Content is required": "本文を入力してください",
    "err.Title is required": "タイトルを入力してください",
    "err.Content already exists": "同じ内容が既に存在します",
};

const dicts: Record<Lang, Dict> = { "zh-CN": zhCN, "zh-TW": zhTW, en: en, ja: ja };

/**
 * 供「组件外」的普通函数取词用的全局兜底（`alert()` 文案、工具函数等）。
 * Provider 挂载/切语言时会刷新这里；React 组件里请一律用 `useI18n()`。
 */
let activeDict: Dict = zhCN;

function setActiveLang(lang: Lang) {
    activeDict = dicts[lang] ?? zhCN;
}

function fill(s: string, args: (string | number)[]) {
    args.forEach((a, i) => { s = s.replace(new RegExp(`\\{${i}\\}`, "g"), String(a)); });
    return s;
}

export function tGlobal(key: string, ...args: (string | number)[]) {
    return fill(activeDict[key] ?? zhCN[key] ?? key, args);
}

/** 把后端英文错误串翻一下（组件外版本） */
export function tErrGlobal(message?: string) {
    if (!message) return "";
    return activeDict[`err.${message}`] ?? message;
}

// ---------------------------------------------------------------- 上下文

export type I18n = {
    lang: Lang;
    setLang: (lang: Lang) => void;
    /** t('list.count', 3) -> 共有 3 篇文章 */
    t: (key: string, ...args: (string | number)[]) => string;
    /** 把后端返回的英文错误串翻一下，没收录就原样返回 */
    tErr: (message?: string) => string;
    /** 相对时间，例如「3小时前」/「3h ago」 */
    fmtAgo: (time: string | number | Date) => string;
};

const STORAGE_KEY = "lang";

/**
 * 默认始终是简体中文（不按浏览器语言猜）——避免站长自己打开时界面突然变英文。
 * 只有用户手动切过才记在 localStorage 里。
 */
function readLang(): Lang {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved && (REL as Record<string, Rel>)[saved]) return saved as Lang;
    } catch { /* 隐私模式等 */ }
    return "zh-CN";
}

const I18nContext = createContext<I18n>({
    lang: "zh-CN",
    setLang: () => { },
    t: (key, ...args) => {
        let s = zhCN[key] ?? key;
        args.forEach((a, i) => { s = s.replace(new RegExp(`\\{${i}\\}`, "g"), String(a)); });
        return s;
    },
    tErr: (message) => message ?? "",
    fmtAgo: (time) => timeagoFormat(time, "RIN", "zh-CN"),
});

export function I18nProvider({ children }: { children?: React.ReactNode }) {
    const [lang, setLangState] = useState<Lang>(readLang);

    const setLang = useCallback((next: Lang) => {
        setLangState(next);
        try { localStorage.setItem(STORAGE_KEY, next); } catch { /* ignore */ }
    }, []);

    useEffect(() => {
        setActiveLang(lang);
        document.documentElement.setAttribute("lang", lang);
    }, [lang]);

    const value = useMemo<I18n>(() => {
        const dict = dicts[lang] ?? zhCN;
        return {
            lang,
            setLang,
            t: (key, ...args) => fill(dict[key] ?? zhCN[key] ?? key, args),
            tErr: (message) => (message ? (dict[`err.${message}`] ?? message) : ""),
            fmtAgo: (time) => timeagoFormat(time, "RIN", lang),
        };
    }, [lang, setLang]);

    return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
    return useContext(I18nContext);
}
