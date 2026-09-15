import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { visualizer } from "rollup-plugin-visualizer";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const siteName = env.NAME || 'Rin';
  return {
    define: {
      'process.env': JSON.stringify(env)
    },
    plugins: [
      react(),
      {
        // 把 index.html 里写死的 <title> 换成构建变量 NAME，
        // 这样改站点名字只需要改 CI 变量，不用动代码。
        name: 'inject-site-title',
        transformIndexHtml(html: string) {
          return html.replace(/<title>[\s\S]*?<\/title>/, `<title>${siteName}</title>`)
        }
      },
      visualizer({ open: true }) // 自动开启分析页面
    ],
  }
})
