<template>
  <div id="app">
    <h2 v-bind="object">***{{ myData.name }}---&&&</h2>
    <test />
    <img alt="Vue logo" src="./assets/logo.png" />
    <HelloWorld msg="Welcome to Your Vue.js App" />

    <div class="deal-box">
      <div @click="select">选择</div>
      <div @click="draw">绘制</div>
      <div @click="eraser">橡皮擦</div>
      <div @click="getStrokes">获取数据</div>
      <div @click="scaleSize('big')">放大</div>
      <div @click="scaleSize('small')">缩小</div>
      <div @click="undo">撤回</div>
      <div @click="clear">清除</div>
    </div>
    <myaudio
      audioUrl="https://epditembank.download.cycore.cn/question/cf75e7ad-c660-452b-b780-c72bf181d492.mp3"
    />
    <div id="huabi2">
      <img
        src="https://gimg2.baidu.com/image_search/src=http%3A%2F%2Fb-ssl.duitang.com%2Fuploads%2Fitem%2F201801%2F12%2F20180112125422_jVaAF.jpeg&refer=http%3A%2F%2Fb-ssl.duitang.com&app=2002&size=f9999,10000&q=a80&n=0&g=0n&fmt=auto?sec=1721383453&t=09097a00b991afa4536d752b2a93d4de"
        alt=""
      />
    </div>
    <div class="box1">
      <div id="huabi">
        <img
          src="https://img2.baidu.com/it/u=4284680107,1075571090&fm=253&fmt=auto&app=120&f=JPEG?w=1422&h=800"
          alt=""
        />
      </div>
    </div>
  </div>
</template>

<script>
import HelloWorld from "./components/HelloWorld.vue";
import myaudio from "./components/audio.vue";
import data1 from "../static/data.json";
import test from "./components/test.vue";
//import HandWriting from 'fly-writing-zhkt'
import HandWritingSDK from "./hand-writing/hand-writing-sdk.js";
export default {
  name: "App",
  components: {
    HelloWorld,
    myaudio,
    test,
  },
  created() {
    console.log(import.meta.env,7777777,process.env);
  },
  mounted() {
    const dom1 = document.getElementById("huabi");
    const dom = this.createDom(dom1);
    const vdom1 = document.getElementById("huabi2");
    const vdom = this.createDom(vdom1);
    console.log(HandWritingSDK, "ppppppp", dom);
    const img = new Image();
    const that = this;
    img.onload = function () {
      dom1.style.width = img.width + "px";
      dom1.style.height = img.height + "px";
      that.penRender = new HandWritingSDK({
        dom,
        groupIdd: "ss",
      });
    };
    img.src =
      "https://img2.baidu.com/it/u=4284680107,1075571090&fm=253&fmt=auto&app=120&f=JPEG?w=1422&h=800";
    const img2 = new Image();
    img2.onload = function () {
      vdom1.style.width = img2.width + "px";
      vdom1.style.height = img2.height + "px";
      that.penRender2 = new HandWritingSDK({
        dom: vdom,
        groupIdd: "ss",
      });
    };
    img2.src =
      "https://gimg2.baidu.com/image_search/src=http%3A%2F%2Fb-ssl.duitang.com%2Fuploads%2Fitem%2F201801%2F12%2F20180112125422_jVaAF.jpeg&refer=http%3A%2F%2Fb-ssl.duitang.com&app=2002&size=f9999,10000&q=a80&n=0&g=0n&fmt=auto?sec=1721383453&t=09097a00b991afa4536d752b2a93d4de";
  },
  data() {
    return {
      myData: data1,
      penRender: null,
      penRender2: null,
      scale: 1,
      object: {
        id: "001",
        class: "abc",
      },
    };
  },
  methods: {
    draw() {
      this.penRender.setHandWritingBehave("pen", {
        ink: {
          color: "#ffff00",
          penWidth: 3,
          penWidthScaleVal: 1,
        },
      });
      this.penRender2.setHandWritingBehave("pen", {
        ink: {
          color: "#ff00ff",
          penWidth: 4,
          penWidthScaleVal: 1,
        },
      });
    },
    createDom(dom) {
      if (!dom) return;
      const canvasWrapDom = document.createElement("div");
      canvasWrapDom.setAttribute(
        "style",
        `position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 100;
      `
      );

      this.isRelative && (dom.style.position = "relative");

      dom.appendChild(canvasWrapDom);

      this.canvasWrapDom = canvasWrapDom;

      return canvasWrapDom;
    },
    select() {
      this.penRender.setHandWritingBehave("select");
    },
    eraser() {
      this.penRender.setHandWritingBehave("eraser");
    },
    undo() {
      this.penRender.undo();
    },
    clear() {
      this.penRender.clear();
    },
    getStrokes() {
      const data = this.penRender.getModelRawStrokes();
      console.log(data);
    },
    scaleSize(type) {
      type === "big" ? (this.scale += 0.1) : (this.scale -= 0.1);
      // let drawStrokes= this.penRender.getModelRawStrokes()
      // const penWidthScaleVal = 1 / this.scale
      const penWidthScaleVal = this.scale;
      // document.querySelector('#huabi img').style.transform=`scale(${this.scale})`
      document.querySelector("#huabi").style.transform = `scale(${this.scale})`;
      this.setTransformScale(penWidthScaleVal);
      // if (this.penRender && this.penRender.reDraw) {
      //   drawStrokes = drawStrokes.map(stroke => {
      //     // 只有pen类型的笔迹要重绘，板擦类型不能重绘，会导致擦除区域也跟着缩放
      //     if (stroke.type === 'pen') {
      //       stroke.penWidthScaleVal = penWidthScaleVal
      //     }
      //     return stroke
      //   })
      // }
      // console.log(drawStrokes);
      //   this.penRender.reDraw(drawStrokes)
      //   this.penRender.setHandWritingBehave('pen', { ink: {
      //       penWidthScaleVal
      //     } })
    },
    setTransformScale(value) {
      // this.penRender.setTransformScale(value)
      console.log(this.penRender, "000000", this.penRender.editor);
      if (this.penRender && this.penRender.editor) {
        this.penRender.editor.transformScale = value;
        // 下面这个也可以
        // this.penRender.editor.setTransformScale(value)
      }
    },
  },
};
</script>

<style lang="scss">
h2{
  color:$color1;
};
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
#huabi,
#huabi2 {
  width: 700px;
  height: 900px;
  background: #f3f7e2;
  position: relative;
  margin-bottom: 30px;
}
.box1 {
  width: 1000px;
  height: 1200px;
  border: 1px solid green;
}
</style>
