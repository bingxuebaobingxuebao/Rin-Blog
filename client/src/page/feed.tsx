import { format } from "@astroimg/timeago";
import MarkdownPreview from '@uiw/react-markdown-preview';
import { useContext, useEffect, useRef, useState } from "react";
import { Helmet } from 'react-helmet';
import { Icon, IconSmall } from "../components/icon";
import { Waiting } from "../components/loading";
import { Toc } from "../components/toc";
import { client } from "../main";
import { ProfileContext } from "../state/profile";
import { headersWithAuth } from "../utils/auth";

type Feed = {
    id: number;
    title: string | null;
    content: string;
    uid: number;
    createdAt: Date;
    updatedAt: Date;
    hashtags: {
        id: number;
        name: string;
    }[];
    user: {
        avatar: string | null;
        id: number;
        username: string;
    };
}

export function FeedPage({ id }: { id: string }) {
    const profile = useContext(ProfileContext);
    const [feed, setFeed] = useState<Feed>()
    const [error, setError] = useState<string>()
    const [headImage, setHeadImage] = useState<string>()
    const ref = useRef("")
    useEffect(() => {
        if (ref.current == id) return
        setFeed(undefined)
        setError(undefined)
        setHeadImage(undefined)
        client.feed({ id }).get({
            headers: headersWithAuth()
        }).then(({ data, error }) => {
            if (error) {
                setError(error.value as string)
            } else if (data && typeof data !== 'string') {
                setTimeout(() => {
                    setFeed(data)
                    // 提取首图
                    const img_reg = /!\[.*?\]\((.*?)\)/;
                    const img_match = img_reg.exec(data.content)
                    if (img_match) {
                        setHeadImage(img_match[1])
                    }
                }, 0)
            }
        })
        ref.current = id
    }, [id])
    const siteName = `${process.env.NAME} - ${process.env.DESCRIPTION}`
    return (
        <Waiting wait={feed || error}>
            {feed &&
                <Helmet>
                    <title>{`${feed.title ?? "Unnamed"} - ${process.env.NAME}`}</title>
                    <meta property="og:site_name" content={siteName} />
                    <meta property="og:title" content={feed.title ?? ""} />
                    <meta property="og:image" content={headImage ?? process.env.AVATAR} />
                    <meta property="og:type" content="article" />
                    <meta property="og:url" content={document.URL} />
                    <meta name="og:description" content={feed.content.length > 200 ? feed.content.substring(0, 200) : feed.content} />
                    <meta name="author" content={feed.user.username} />
                    <meta name="keywords" content={feed.hashtags.map(({ name }) => name).join(", ")} />
                    <meta name="description" content={feed.content.length > 200 ? feed.content.substring(0, 200) : feed.content} />
                </Helmet>
            }
            {error &&
                <div className="w-full flex flex-col justify-center items-center">
                    <div className="wauto rounded-2xl bg-w m-2 p-6 items-center justify-center flex flex-col">
                        <h1 className="text-xl font-bold t-primary">
                            {error}
                        </h1>
                        <button className="mt-2 bg-theme text-white px-4 py-2 rounded-full" onClick={() => window.location.href = '/'}>
                            返回首页
                        </button>
                    </div>
                </div>
            }
            {feed &&
                <div className="w-full flex flex-col justify-center items-center">
                    {/* 正文 + 右侧目录：结构对齐 xeu.life（左右留白对称，目录 sticky） */}
                    <div className="w-full flex flex-row justify-center items-start">
                        <div className="hidden 2xl:block 2xl:w-64 shrink-0"></div>
                        <div className="w-full md:w-11/12 lg:flex-1 lg:min-w-0">
                            <main className="rounded-2xl bg-w m-2 p-6">
                                <article aria-label="正文">
                                    <div className="flex flex-row items-center">
                                        <h1 className="text-xl font-bold t-primary">
                                            {feed.title}
                                        </h1>
                                        {profile?.permission && <div className="flex-1 flex flex-col items-end justify-center">
                                            <Icon label="编辑" name="ri-edit-2-line ri-lg" onClick={() => window.location.href = `/writing/${feed.id}`} />
                                        </div>}
                                    </div>
                                    <div className="my-2">
                                        <p className="text-gray-400 text-sm" title={new Date(feed.createdAt).toLocaleString()}>
                                            发布于 {format(feed.createdAt)}
                                        </p>
                                        {feed.createdAt !== feed.updatedAt &&
                                            <p className="text-gray-400 text-sm" title={new Date(feed.updatedAt).toLocaleString()}>
                                                更新于 {format(feed.updatedAt)}
                                            </p>
                                        }
                                    </div>
                                    <MarkdownPreview source={feed.content} />
                                    {feed.hashtags.length > 0 &&
                                        <div className="mt-2 flex flex-row flex-wrap">
                                            {feed.hashtags.map(({ name }, index) => (
                                                <div key={index} className="bg-neutral-100 dark:bg-neutral-600 dark:text-neutral-300 py-1 px-2 m-1 rounded-lg">
                                                    {name}
                                                </div>
                                            ))}
                                        </div>
                                    }
                                    <div className="mt-2 flex flex-row items-center">
                                        <img src={feed.user.avatar || '/avatar.png'} className="w-8 h-8 rounded-full" />
                                        <div className="ml-2">
                                            <span className="text-gray-400 text-sm">
                                                {feed.user.username}
                                            </span>
                                        </div>
                                    </div>
                                </article>
                            </main>
                            <Comments id={id} loggedIn={!!profile} />
                        </div>
                        <Toc deps={feed.id} />
                    </div>
                    <div className="h-16" />
                </div>
            }
        </Waiting>
    )
}

function CommentInput({ id, onRefresh, loggedIn }: { id: string, onRefresh: () => void, loggedIn: boolean }) {
    const [content, setContent] = useState("")
    const [error, setError] = useState("")
    function errorHumanize(error: string) {
        if (error === 'Unauthorized') return '请先登录'
        else if (error === 'Content is required') return '评论内容不能为空'
        return error
    }
    function submit() {
        client.feed.comment({ feed: id }).post(
            { content },
            {
                headers: headersWithAuth()
            }).then(({ error }) => {
                if (error) {
                    setError(errorHumanize(error.value as string))
                } else {
                    setContent("")
                    setError("")
                    alert("评论成功")
                    onRefresh()
                }
            })
    }
    return (
        <div className="mt-4 flex flex-col items-end">
            <textarea id="comment" placeholder="说点什么吧"
                className="w-full h-28 resize-y rounded-xl border border-neutral-200 dark:border-neutral-600 bg-transparent p-3 text-sm t-primary duration-300 focus:border-theme dark:focus:border-theme"
                value={content} onChange={e => setContent(e.target.value)} />
            {!loggedIn &&
                <p className="mt-2 self-start text-xs text-neutral-400">
                    未登录也可以看，评论需要先点右上角用 Github 登录
                </p>}
            <button className="mt-2 bg-theme text-white px-4 py-2 rounded-full text-sm duration-300 hover:opacity-90" onClick={submit}>
                发表评论
            </button>
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </div>
    )
}


type Comment = {
    id: number;
    content: string;
    createdAt: Date;
    updatedAt: Date;
    user: {
        id: number;
        username: string;
        avatar: string | null;
        permission: number | null;
    };
}

function Comments({ id, loggedIn }: { id: string, loggedIn: boolean }) {
    const [comments, setComments] = useState<Comment[]>([])
    const [error, setError] = useState<string>()
    const ref = useRef("")

    function loadComments() {
        client.feed.comment({ feed: id }).get({
            headers: headersWithAuth()
        }).then(({ data, error }) => {
            if (error) {
                setError(error.value as string)
            } else if (data && Array.isArray(data)) {
                setComments(data)
            }
        })
    }
    useEffect(() => {
        if (ref.current == id) return
        loadComments()
        ref.current = id
    }, [id])
    return (
        <section className="rounded-2xl bg-w t-primary m-2 p-6">
            <h2 className="text-lg font-bold">
                评论
                {comments.length > 0 && <span className="ml-2 text-sm font-normal text-neutral-400">{comments.length}</span>}
            </h2>
            <CommentInput id={id} onRefresh={loadComments} loggedIn={loggedIn} />
            {error &&
                <div className="mt-4 flex flex-col items-center justify-center rounded-xl bg-neutral-50 dark:bg-neutral-800 p-6">
                    <h1 className="text-base font-bold t-primary">
                        {error}
                    </h1>
                    <button className="mt-2 bg-theme text-white px-4 py-2 rounded-full text-sm" onClick={loadComments}>
                        重新加载
                    </button>
                </div>
            }
            {comments.length > 0 &&
                <div className="mt-4 space-y-2">
                    {comments.map(comment => (
                        <CommentItem key={comment.id} comment={comment} onRefresh={loadComments} />
                    ))}
                </div>
            }
        </section>
    )
}

function CommentItem({ comment, onRefresh }: { comment: Comment, onRefresh: () => void }) {
    const profile = useContext(ProfileContext);
    function deleteComment() {
        // 询问
        if (!confirm("确定要删除这条评论吗？")) return
        client.comment({ id: comment.id }).delete(null, {
            headers: headersWithAuth()
        }).then(({ error }) => {
            if (error) {
                alert(error.value)
            } else {
                alert("删除成功")
                onRefresh()
            }
        })
    }
    return (
        <div className="flex flex-row items-start rounded-xl bg-neutral-50 dark:bg-neutral-800 p-3">
            <img src={comment.user.avatar || ''} className="w-8 h-8 rounded-full" />
            <div className="flex flex-col w-full ml-2">
                <div className="flex flex-row">
                    <span className="text-gray-400 text-sm">
                        {comment.user.username}
                    </span>
                    <div className="flex-1" />
                    <span title={new Date(comment.createdAt).toLocaleString()} className="text-gray-400 text-sm">
                        {format(comment.createdAt)}
                    </span>
                </div>
                <div className="flex flex-row items-start t-primary">
                    <p className="flex-1 text-sm break-words">
                        {comment.content}
                    </p>
                    {(profile?.permission || profile?.id == comment.user.id) && <div className="flex flex-row">
                        <IconSmall label="删除评论" name="ri-delete-bin-2-line ri-sm" onClick={deleteComment} />
                    </div>
                    }
                </div>
            </div>
        </div>)
}
