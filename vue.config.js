


const path = require('path')

function resolve(dir) {
	return path.join(__dirname, dir)
}

module.exports = {
	// publicPath: process.env.NODE_ENV === 'production' ? '/yyj/' : '/',
	parallel: false,
	// publicPath: 'http://localhost:5500',
	publicPath: './',
	outputDir: 'dist',
	// 放置静态资源的地方 (js/css/img/font/...)
	assetsDir: 'static',
	//配置路径别名
	configureWebpack: {
		resolve: {
			alias: {
				'@': resolve('src'),
				'@a': resolve('src/assets'),
				'@c': resolve('src/components'),
			},
		},
	},


	devServer: {
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
			'/connect':{
        target:'http://127.0.0.1:8010',
        changeOrigin:true,
        pathRewrite:{
          '^/connect':'/connect'
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
}
