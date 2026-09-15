import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Waiting } from "../components/loading";
import { endpoint } from "../main";
import { useI18n } from "../state/i18n";

type TagInfo = {
    id: number;
    name: string;
}

/**
 * 标签总览页。
 * 后端 `GET /tag` 只返回 { id, name } 没有文章数，
 * 所以再拉一次文章列表（`GET /feed`，每条都带 hashtags）在本地统计每个标签下的文章数。
 * 这里刻意不用 Eden client：`client.tag.get()` 会被序列化成 `/tag/index`，而服务端只注册了 `/tag`。
 */
export function TagsPage() {
    const { t } = useI18n();
    const [tags, setTags] = useState<TagInfo[]>()
    const [counts, setCounts] = useState<Record<string, number>>({})
    const [error, setError] = useState<string>()

    useEffect(() => {
        let alive = true
        const getJson = (path: string) =>
            fetch(`${endpoint}${path}`).then(r => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`)
                return r.json()
            })
        Promise.all([
            getJson('/tag'),
            getJson('/feed?page=1&limit=50').catch(() => ({ data: [] as any[] })),
        ]).then(([tagList, feedList]: [any, any]) => {
            if (!alive) return
            const c: Record<string, number> = {}
            for (const feed of (feedList?.data ?? [])) {
                for (const h of (feed?.hashtags ?? [])) {
                    c[h.name] = (c[h.name] ?? 0) + 1
                }
            }
            setCounts(c)
            setTags(Array.isArray(tagList) ? tagList : [])
        }).catch(e => {
            if (!alive) return
            setError(String(e?.message || e))
        })
        return () => { alive = false }
    }, [])

    return (
        <Waiting wait={tags || error}>
            <div className="w-full flex flex-col justify-center items-center mb-8">
                <div className="wauto text-start text-black dark:text-white p-4 text-4xl font-bold">
                    <p>{t("tags.title")}</p>
                    <p className="text-sm mt-4 text-neutral-500 font-normal">
                        {t("tags.count", tags?.length ?? 0)}
                    </p>
                </div>
                {error &&
                    <div className="wauto rounded-2xl bg-w m-2 p-6 items-center justify-center flex flex-col">
                        <h1 className="text-xl font-bold t-primary">{t("tags.loadFailed")}: {error}</h1>
                        <button className="mt-2 bg-theme text-white px-4 py-2 rounded-full" onClick={() => window.location.reload()}>
                            {t("common.reload")}
                        </button>
                    </div>}
                <div className="wauto flex flex-row flex-wrap p-2">
                    {tags?.map(tag => (
                        <Link key={tag.id} href={`/tag/${encodeURIComponent(tag.name)}`}
                            className="m-2 flex flex-row items-center rounded-2xl bg-w bg-hover px-5 py-3 duration-300 t-primary">
                            <i className="ri-hashtag mr-1 text-neutral-400"></i>
                            <span className="text-base font-medium">{tag.name}</span>
                            {counts[tag.name] !== undefined &&
                                <span className="ml-2 text-xs text-neutral-400">{t("tags.perTag", counts[tag.name])}</span>}
                        </Link>
                    ))}
                </div>
            </div>
        </Waiting>
    )
}
