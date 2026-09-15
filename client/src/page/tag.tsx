import { useEffect, useState } from "react";
import { Link } from "wouter";
import { FeedCard } from "../components/feed_card";
import { Waiting } from "../components/loading";
import { endpoint } from "../main";

type FeedItem = {
    id: number;
    title: string;
    content?: string;
    summary?: string;
    hashtags?: { id: number, name: string }[];
    createdAt: string;
    updatedAt: string;
}

/**
 * 单个标签下的文章列表。
 * 后端 `GET /tag/:name` 返回的 `feeds` 其实是 feedHashtags 中间表（只有 feedId），
 * 所以还要按 id 逐个取 `GET /feed/:id` 才拿得到标题和摘要。
 */
export function TagPage({ name }: { name: string }) {
    // wouter 对动态段是否解码不确定，这里做一次防御性解码，避免中文标签名被双重编码
    let tagName = name
    try { tagName = decodeURIComponent(name) } catch { tagName = name }

    const [feeds, setFeeds] = useState<FeedItem[]>()
    const [error, setError] = useState<string>()

    useEffect(() => {
        let alive = true
        setFeeds(undefined)
        setError(undefined)
        const getJson = (path: string) =>
            fetch(`${endpoint}${path}`).then(r => {
                if (!r.ok) throw new Error(String(r.status))
                return r.json()
            })
        getJson(`/tag/${encodeURIComponent(tagName)}`)
            .then(async (tag: any) => {
                const ids: number[] = (tag?.feeds ?? []).map((row: any) => row.feedId)
                const list = await Promise.all(
                    ids.map(id => getJson(`/feed/${id}`).catch(() => null))
                )
                if (!alive) return
                setFeeds(list.filter(Boolean).map((f: any) => ({
                    ...f,
                    summary: f.summary && f.summary.length > 0
                        ? f.summary
                        : (f.content ? String(f.content).slice(0, 100) : '')
                })))
            })
            .catch(e => {
                if (!alive) return
                setError(String(e?.message) === '404'
                    ? `没有找到标签「${tagName}」`
                    : "标签加载失败：" + String(e?.message || e))
            })
        return () => { alive = false }
    }, [tagName])

    return (
        <Waiting wait={feeds || error}>
            <div className="w-full flex flex-col justify-center items-center mb-8">
                <div className="wauto text-start text-black dark:text-white p-4">
                    <Link href="/tags" className="text-sm text-neutral-500 font-normal duration-300 hover:text-theme">
                        <i className="ri-arrow-left-line mr-1"></i>全部标签
                    </Link>
                    <p className="mt-2 text-4xl font-bold">
                        <i className="ri-hashtag text-neutral-400"></i>{tagName}
                    </p>
                    <div className="flex flex-row justify-between">
                        <p className="text-sm mt-4 text-neutral-500 font-normal">
                            共有 {feeds?.length ?? 0} 篇文章
                        </p>
                    </div>
                </div>
                {error &&
                    <div className="wauto rounded-2xl bg-w m-2 p-6 items-center justify-center flex flex-col">
                        <h1 className="text-xl font-bold t-primary">{error}</h1>
                        <button className="mt-2 bg-theme text-white px-4 py-2 rounded-full" onClick={() => window.location.href = '/tags'}>
                            返回全部标签
                        </button>
                    </div>}
                {feeds?.map(({ id, ...feed }) => (
                    <FeedCard key={id} id={id} {...feed} />
                ))}
            </div>
        </Waiting>
    )
}
