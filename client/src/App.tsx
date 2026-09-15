import { useEffect, useRef, useState } from 'react'
import { DefaultParams, PathPattern, Route, RouteProps, Switch } from 'wouter'
import Footer from './components/footer'
import { Header } from './components/header'
import { Padding } from './components/padding'
import { client } from './main'
import { CallbackPage } from './page/callback'
import { FeedPage } from './page/feed'
import { FeedsPage } from './page/feeds'
import { FriendsPage } from './page/friends'
import { WritingPage } from './page/writing'
import { Profile, ProfileContext } from './state/profile'
import { headersWithAuth } from './utils/auth'
function App() {
  const ref = useRef(false)
  const [profile, setProfile] = useState<Profile | undefined>()
  useEffect(() => {
    if (ref.current) return
    client.user.profile.get({
      headers: headersWithAuth()
    }).then(({ data }) => {
      if (data && typeof data != 'string') {
        setProfile({
          id: data.id,
          avatar: data.avatar || '',
          permission: data.permission,
          name: data.username
        })
      }
    })
    ref.current = true
  }, [])
  return (
    <>
      {/* 顶部主题色渐变（对齐 xeu.life）：通栏、固定、位于所有内容之下 */}
      <div className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-64 bg-gradient-to-b from-theme/15 to-white/0 dark:from-theme/20 dark:to-transparent"></div>
      <ProfileContext.Provider value={profile}>
        <Switch>
          <RouteMe path="/">
            <FeedsPage />
          </RouteMe>

          <RouteMe path="/feed/:id">
            {params => <FeedPage id={params.id} />}
          </RouteMe>

          <RouteMe path="/writing">
            <WritingPage />
          </RouteMe>
          <RouteMe path="/friends">
            <FriendsPage />
          </RouteMe>

          <RouteMe path="/writing/:id">
            {({ id }) => {
              const id_num = parseInt(id)
              return (
                <WritingPage id={id_num} />
              )
            }
            }
          </RouteMe>

          <RouteMe path="/callback" >
            <CallbackPage />
          </RouteMe>

          <RouteMe path="/:alias">
            {params => <FeedPage id={params.alias} />}
          </RouteMe>

          {/* Default route in a switch */}
          <Route>404: No such page!</Route>
        </Switch>
      </ProfileContext.Provider>
    </>
  )
}

function RouteMe<
  T extends DefaultParams | undefined = undefined,
  RoutePath extends PathPattern = PathPattern
>(props: RouteProps<T, RoutePath>) {
  const { children, ...rest } = props
  return (
    <Route {...rest} >
      {params => {
        return (<>
          <Header />
          <Padding>
            {typeof children === 'function' ? children(params) : children}
          </Padding>
          <Footer />
        </>)
      }}
    </Route>
  )
}

export default App
