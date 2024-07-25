import Vue from 'vue'
import App from './App.vue'
import ElementUI from 'element-ui';
import 'element-ui/lib/theme-chalk/index.css';
import './variable.scss'
// import dotenv from ''
import uploader from 'vue-simple-uploader'
// require('dotenv').config()
// const { MODE } = import.meta.env
// switch (MODE){
//   case 'development':
//     require('dotenv').config({ path: '.env.development' });
//     break;
//   case 'devTest':
//     require('dotenv').config({ path: '.env.devtest' });
//     break;
//   case 'production':
//     require('dotenv').config({ path: '.env.production' });
//     break;
//   default:
//     require('dotenv').config({ path: '.env.production' });
//     break;
// }
Vue.config.productionTip = false
Vue.use(ElementUI)
Vue.use(uploader)
new Vue({
  render: h => h(App),
}).$mount('#app')
// import VConsole from 'vconsole/dist/vconsole.min.js'
// new VConsole()