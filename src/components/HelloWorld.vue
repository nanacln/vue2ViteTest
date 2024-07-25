<template>
  <div class="hello">
    <h1>{{ msg }}</h1>
    <div class="block">
      <button @click="sendMsg">跨域名发送消息</button>
      <span class="demonstration">{{ txt }}</span>
      <el-slider
        v-model="value1"
        @change="changeSlider"
        @input="inputSlider"
      ></el-slider>
    </div>
    <img src="../../static/teacher.png" alt="" />
    <p>
      For a guide and recipes on how to configure / customize this project,<br />
      check out the
      <a href="https://cli.vuejs.org" target="_blank" rel="noopener"
        >vue-cli documentation</a
      >.
    </p>
    <div id="main" :style="{ width: '300px', height: '300px' }"></div>
    <div id="myChart" :style="{ width: '400px', height: '400px' }"></div>
    <div
      @click="
        loadAudio(
          'https://epditembank.download.cycore.cn/question/cf75e7ad-c660-452b-b780-c72bf181d492.mp3'
        )
      "
    >
      xiazai
    </div>
    <a href="https://m.xhd.cn/u/cms/group/202202/10171406x0j0.jpg" download=""
      >下载图片</a
    >
    <a
      href="https://test.download.cycore.cn/middle-homework/1500000200053365330_2c7d1f732fe7c62249db69ba2c581ef6.mp3"
      download=""
      >下载音频</a
    >
    <br />
    <a
      href="https://epditembank.download.cycore.cn/question/cf75e7ad-c660-452b-b780-c72bf181d492.mp3"
      download=""
      >下载音频2</a
    >
    <div
      @click="
        downloadAudio(
          'https://epditembank.download.cycore.cn/question/cf75e7ad-c660-452b-b780-c72bf181d492.mp3'
        )
      "
    >
      下载音频
    </div>
    <br />
    <br />
    <br />
    <br />
    <button @click="exportExcel">下载表格</button>
    <br />
    <br />
    <br />
    <button @click="mylog(), print()">去打印</button>
    <br />
    <br />

    <swiper ref="mySwiper" :options="swiperOptions">
      <swiper-slide v-for="item in 5" :key="item">
        <div>{{ item }}ppppppp</div>
      </swiper-slide>
      <div class="swiper-pagination" slot="pagination"></div>
    </swiper>
    <br />
  </div>
</template>

<script>
import * as echarts from "echarts";
import axios from "axios";
import XLSX from "xlsx/dist/xlsx.full.min";
import { swiper, swiperSlide } from "vue-awesome-swiper";
import "swiper/dist/css/swiper.css";
// import axios from 'axios'
export default {
  name: "HelloWorld",
  components: {
    swiper,
    swiperSlide,
  },
  data() {
    return {
      value1: 20,
      name: "nana",
      txt: "hello",
      swiperOptions: {
        pagination: {
          el: ".swiper-pagination",
          clickable: true,
          type: "bullets",
          bulletClass: "common-bullet",
          bulletActiveClass: "common-bullet-active",
        },
      },
    };
  },
  props: {
    msg: String,
  },
  mounted() {
    // 基于准备好的dom，初始化echarts实例
    var myChart = echarts.init(document.getElementById("main"));

    // 绘制图表
    myChart.setOption({
      title: {
        text: "ECharts 入门示例",
      },
      tooltip: {},
      xAxis: {
        data: ["衬衫", "羊毛衫", "雪纺衫", "裤子", "高跟鞋", "袜子"],
      },
      yAxis: {},
      series: [
        {
          name: "销量",
          type: "bar",
          data: [
            { value: 5, itemStyle: { borderRadius: [6, 6, 0, 0] } },
            { value: 20, itemStyle: { borderRadius: [6, 6, 0, 0] } },
            { value: 24, itemStyle: { borderRadius: [6, 6, 0, 0] } },
            { value: 16, itemStyle: { borderRadius: [6, 6, 0, 0] } },
            { value: 8, itemStyle: { borderRadius: [6, 6, 0, 0] } },
          ],
          // showBackground: true,

          // backgroundStyle:{
          //   color:'#ff0000',
          //   borderRadius:[5,5 ,0,0]
          // }
        },
      ],
    });

    var mychart2 = echarts.init(document.getElementById("myChart"));
    mychart2.setOption({
      xAxis: [{ gridIndex: 0, min: 0, max: 20 }],
      yAxis: [{ gridIndex: 0, min: 0, max: 15 }],
      series: [
        {
          symbolSize: 20,
          data: [
            [10.0, 8.04],
            [8.07, 6.95],
            [13.0, 7.58],
            [9.05, 8.81],
            [11.0, 8.33],
            [14.0, 7.66],
            [13.4, 6.81],
            [10.0, 6.33],
            [14.0, 8.96],
            [12.5, 6.82],
            [9.15, 7.2],
            [11.5, 7.2],
            [3.03, 4.23],
            [12.2, 7.83],
            [2.02, 4.47],
            [1.05, 3.33],
            [4.05, 4.96],
            [6.03, 7.24],
            [12.0, 6.26],
            [12.0, 8.84],
            [7.08, 5.82],
            [5.02, 5.68],
          ],
          type: "scatter",
          markLine: {
            animation: false,
            label: {
              formatter: "y = 0.5 * x + 3",
              align: "right",
            },
            // lineStyle: {
            //   type: "dashed",
            //   color: "#05C1AE",
            // },
            tooltip: {
              formatter: "y = 0.5 * x + 3",
            },
            data: [
              [
                {
                  coord: [0, 3],
                  symbol: "none",
                  lineStyle: {
                    color: "#05C1AE",
                  },
                },
                {
                  coord: [20, 3],
                  symbol: "none",
                },
              ],
              [
                {
                  coord: [0, 8],
                  symbol: "none",
                  lineStyle: {
                    color: "#FF543A",
                  },
                },
                {
                  coord: [20, 8],
                  symbol: "none",
                },
              ],
            ],
          },
        },
      ],
    });
  },
  methods: {
    sendMsg() {
      const newWin = window.open("http://localhost:5501/index.html", "_blank");
      setTimeout(() => {
        newWin.postMessage(
          {
            type: "123",
            message: `MyLib_MyLibHwRecord`,
          },
          "http://localhost:5501"
        );
      }, 500);
      window.addEventListener("message", ({ data }) => {
        if (data.type === "changeName") {
          this.txt = data.name;
        }
      });
    },
    print() {
      axios.get("http://wenyangnana.top/api/recordList?pageSize=6&pageNo=1");
      axios.get(
        "https://wh.xhd.cn/api/content/list.jspx?channelIds=18285&first=0&count=3&orderBy=4&format=1"
      );
      axios
        .post("/connect", {})
        // .post('/print', {})
        .then(() => {
          alert(111);
          // this.sendTask()
        })
        .catch(() => {
          alert(222);
          // if (this.connectCount <= 0 || !this.visible) {
          //   this.status = connectStatus.failed
          // } else {
          //   setTimeout(() => {
          //     this.tryConnect()
          //   }, 1000)
          // }
        });
    },
    mylog() {
      console.log("print my log");
    },
    changeSlider() {
      this.name = "sasa";
      console.log(this.value1, "ccccccccc", this.name);
    },
    inputSlider(e) {
      console.log(e, "iiiiiii", this.name);
      if (this.name) {
        this.name = "";
      }
    },
    downloadAudio(filePath) {
      // fetch(filePath).then(res => res.blob()).then(blob => {
      //   const a = document.createElement('a');
      //   document.body.appendChild(a)
      //   a.style.display = 'none'
      //   // 使用获取到的blob对象创建的url
      //   const url = window.URL.createObjectURL(blob);
      //   a.href = url;
      //   // 指定下载的文件名
      //   a.download = '语音音频.mp3';
      //   a.click();
      //   document.body.removeChild(a)
      //   // 移除blob对象的url
      //   window.URL.revokeObjectURL(url);
      // });

      // axios({
      //   method: 'get',
      //   url: filePath,
      //   // 必须显式指明响应类型是一个Blob对象，这样生成二进制的数据，才能通过window.URL.createObjectURL进行创建成功
      //   responseType: 'blob',
      // }).then((res) => {
      //   console.log(res,6666666,res.data.size);
      //   if (!res) {
      //       return
      //   }
      //   // 将lob对象转换为域名结合式的url
      //   let blobUrl = window.URL.createObjectURL(res.data)
      //   let link = document.createElement('a')
      //   document.body.appendChild(link)
      //   link.style.display = 'none'
      //   link.href = blobUrl
      //   // 设置a标签的下载属性，设置文件名及格式，后缀名最好让后端在数据格式中返回
      //   link.download = 'aaa.mp3'
      //   // 自触发click事件
      //   link.click()
      //   document.body.removeChild(link)
      //   window.URL.revokeObjectURL(blobUrl);
      // })
      console.log(1111111);
      downloadUrlFile(filePath);
      function downloadUrlFile(url) {
        url = url.replace(/\\/g, "/");
        const xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);
        xhr.responseType = "blob";
        xhr.onload = () => {
          if (xhr.status === 200) {
            const fileName = getFileName(url);
            saveAs(xhr.response, fileName);
          }
        };
        xhr.send();
      }
      function saveAs(data, name) {
        var urlObj = window.URL || window.webkitURL || window;
        var export_blob = new Blob([data]);
        var save_link = document.createElementNS(
          "http://www.w3.org/1999/xhtml",
          "a"
        );
        save_link.href = urlObj.createObjectURL(export_blob);
        save_link.download = name;
        save_link.click();
      }
      function getFileName(url) {
        var num = url.lastIndexOf("/") + 1;
        var fileName = url.substring(num);
        fileName = decodeURI(fileName.split("?")[0]);
        return fileName;
      }
    },
    loadAudio(path) {
      let audio = new Audio();
      audio.addEventListener("load", (res) => {
        console.log(res);
      });
      audio.src = path;
    },
    exportExcel() {
      let sheet1data = [
        { 大区: "东北区", 人数: 222 },
        { 大区: "西北区", 人数: 2223 },
      ];
      let sheet2data = [
        { 科目: "语文", 分数: 82 },
        { 科目: "数学", 分数: 82 },
      ];
      var sheet1 = XLSX.utils.json_to_sheet(sheet1data);
      var sheet2 = XLSX.utils.json_to_sheet(sheet2data);
      //创建一个新的空的workbook
      var wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, sheet1, "人数统计");
      XLSX.utils.book_append_sheet(wb, sheet2, "成绩统计");
      const workBookBlob = this.workbook2bolb(wb);
      this.openDownloadDialog(workBookBlob, "Download.xlsx");
    },
    //将blob对象 创建bloburl,然后用a标签实现下载
    workbook2bolb(workbook) {
      //生成excel的配置项
      var wopts = {
        bookType: "xlsx",
        //是否生产shared string table ,官方解释是如果开启生成速度会下降，但在低版本IOS设备上有更好的兼容性
        bookSST: false,
        type: "binary",
      };
      var wbout = XLSX.write(workbook, wopts);
      function s2ab(s) {
        var buf = new ArrayBuffer(s.length);
        var view = new Uint8Array(buf);
        for (var i = 0; i !== s.length; i++) view[i] = s.charCodeAt(i) & 0xff;
        return buf;
      }
      let buf = s2ab(wbout);
      var blob = new Blob([buf], {
        type: "application/octet-stream",
      });
      return blob;
    },
    openDownloadDialog(blob, fileName) {
      if (typeof blob === "object" && blob instanceof Blob) {
        blob = URL.createObjectURL(blob);
      }
      let link = document.createElement("a");
      link.style.display = "none";
      link.href = blob;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      // 释放URL 对象
      window.URL.revokeObjectURL(link.href);
      // var aLink=document.createElement('a')
      // aLink.href=blob
      // aLink.download=fileName||''
      // var event
      // if(window.MouseEvent) {
      //   event=new MouseEvent('click')
      // }else{
      //   //移动端
      //   event=document.createEvent('MouseEvents')
      //   event.initMouseEvent('click',true,false,window,0,0,0,0,0,false,false,false,false,0,null)
      // }
      // aLink.dispatchEvent(event)
    },
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss" scoped>
$green:#42b983;
h3 {
  margin: 40px 0 0;
}
ul {
  list-style-type: none;
  padding: 0;
  color:$color1;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: $green;
}
</style>
