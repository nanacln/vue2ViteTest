// import { fileURLToPath,URL } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import path from 'path';
import { createVuePlugin } from 'vite-plugin-vue2';
// import envCompatible from 'vite-plugin-env-compatible';
import { createHtmlPlugin } from 'vite-plugin-html';
import { viteCommonjs } from '@originjs/vite-plugin-commonjs';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())
  console.log(loadEnv,mode,env, 111122, process.cwd())
  return {

    resolve: {
      alias: [
        {
          find: '@',
          replacement: path.resolve(__dirname, 'src')
        },
        {
          find: '@a',
          replacement: path.resolve(__dirname, 'src/assets')
        },
        {
          find: '@c',
          replacement: path.resolve(__dirname, 'src/components')
        }
      ],
      extensions: [
        '.mjs',
        '.js',
        '.ts',
        '.jsx',
        '.tsx',
        '.json',
        '.vue'
      ]
    },
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: "@import '@/variable.scss';"
        }
      }
    },
    plugins: [
      createVuePlugin(),
      viteCommonjs(),
      // envCompatible(),
      createHtmlPlugin({
        inject: {
          data: {
            title: 'test',
            BASE_URL: '/public/'
          }
        }
      })
    ],
    // base: env.BASE_URL,
    base: './',
    server: {
      open: true, //自动打开浏览器
      port: 8086,
      proxy: {
        '/api': {
          // target: 'http://192.168.16.82:8078',
          // target: 'http://wenyangnana.com/',
          target: 'http://10.40.162.231:8666/',
          // ws: true,
          changeOrigin: true,
          pathRewrite: {
            '^/api': '/api',
          },
        },
        '/connect': {
          target: 'http://127.0.0.1:8010',
          changeOrigin: true,
          pathRewrite: {
            '^/connect': '/connect'
          }
        }
        // '/pcCourse': {
        // 	target: 'http://wh.xhd.cn/',
        // 	ws: true,
        // 	changeOrigin: true,
        // 	pathRewrite: {
        // 		'^/pcCourse': 'http://wh.xhd.cn/pcCourse',
        // 	},
        // },
      }, // 配置多个代理
    },
    build: {
      outDir: 'dist',
    },
    define: {
      'process.env': {},
      exports: {}
    },
    // envPrefix:'ENV_'
    optimizeDeps: {
      exclude:[]
    }
  }
})
