<template>
  <div>
    <button @click="play">播放</button>
    <div class="c-AttachmentPreview-audio">
      <div class="audio-icon">
        <i
          v-if="!playingAudio"
          class="icon-zxzy icon-bofang1"
          @click="play"
        >暂停</i>
        <i
          v-else
          class="icon-zxzy icon-zantingtingzhi"
          @click="pause" >播放</i>
        <audio
          ref="audioRefs"
          :src="audioUrl"
          style="display: none;"
          controls="controls"
          preload="auto"
          @pause="handleAudioPauseStatus"
          @playing="handleAudioPlayingStatus"
          @canplay="handleAudioCanPlay"
        />
      </div>
      <div
        :class="{'active': playingAudio}"
        class="time-box progress-num">
        {{ timeFormater(audioObj.playTime) || '00:00' }}
      </div>

      <div class="time-box">/{{ timeFormater(audioObj.duration) }}</div>
      <div class="progress-box">
        <el-slider
          :show-tooltip="false"
          v-model="audioObj.progressV"
          :show-text="false"
          @change="handleProgressChange"
        />
      </div>
      <div class="audio-volume-box">
        <i class="volume-icon" ></i>
        <el-slider
          v-model="audioObj.volume"
          class="audio-volume-slider"
          vertical
          height="80px"/>
      </div>
      <a :href="audioUrl" download="1111">下载</a>
      <i class="down-icon" @click="downLoadFile(audioUrl)" ></i>

    </div>
  </div>
</template>
<script >

// import axios from 'axios'

export default {
  data() {
    return {
      playSetInterval: null,
      playingAudio: false,
      audioObj: {
        playTime: 0,
        duration: 0,
        progressV: 0
      }
    }
  },
  props: {
    audioUrl: {
      type: String,
      required: true
    }
  },
  components:{
    // Slider
  },
  methods: {
    /**
     * 处理迷你模式下停止播放问题
     */
    handleMiniEnded() {
      this.playingAudio = false
    },
    /**
     * 處理多audio暫停情況
     */
    handleAudioPauseStatus() {
      if (this.playSetInterval) {
        clearInterval(this.playSetInterval)
      }
      if (this.playingAudio) {
        this.$nextTick(() => {
          this.playingAudio = false
        })
      }
    },
    /**
     * 處理多audio播放情況
     */
    handleAudioPlayingStatus() {
      if (!this.playingAudio) {
        this.$nextTick(() => {
          this.playingAudio = true
        })
      }
    },
    /**
     * 检测是否有其他audio video, 有的话暂停播放
     */
    closeOtherMedia() {
      let audios = document.getElementsByTagName('audio')

      let videos = document.getElementsByTagName('video')

      let medias = [...audios, ...videos]

      medias &&
        medias.forEach((media) => {
          media.pause()
        })
    },
    /**
     * 拖动条变化事件
     */
    handleProgressChange() {
      this.pause()
      this.$refs['audioRefs'].currentTime =
        (this.audioObj.progressV / 100) * this.audioObj.duration
      this.play()
    },
    /**
     * 时间格式化
     */
    timeFormater(value, mini = false) {
      if (!value) return
      let src = ''
      // bug fix 此处时长不同于教师评论
      // if (value > 60) {
      //   value = 60
      // }
      if (mini) {
        src =
        value >= 60
          ? (Math.floor(value / 60) > 9
            ? Math.floor(value / 60)
            : '0' + Math.floor(value / 60)) +
          "'" +
          (Math.ceil(value % 60) > 9
            ? Math.ceil(value % 60)
            : '0' + Math.floor(value % 60)) +
          "''" : (Math.ceil(value % 60) > 9
            ? Math.ceil(value % 60)
            : '0' + Math.floor(value % 60)) +
          "''"
      } else {
        src =
          (Math.floor(value / 60) > 9
            ? Math.floor(value / 60)
            : '0' + Math.floor(value / 60)) +
          ':' +
          (Math.ceil(value % 60) > 9
            ? Math.ceil(value % 60)
            : '0' + Math.floor(value % 60))
      }
      return src
    },
    /**
     * 获取录音的相关信息
     */
    handleAudioCanPlay() {
     
      let duration = this.$refs['audioRefs'] && this.$refs['audioRefs'].duration
      this.audioObj.duration = duration
    },
    /**
     * 播放录音
     */
    play() {
      this.closeOtherMedia()
      this.$refs['audioRefs'].play()
      this.playingAudio = true
      const duration = this.$refs['audioRefs'].duration

      let curTime = 0
      this.playSetInterval = setInterval(() => {
        try {
          curTime = Math.ceil(this.$refs['audioRefs'].currentTime)
          curTime = curTime.toFixed(4)
          this.audioObj.progressV = (curTime / duration) * 100
          this.audioObj.playTime = Math.ceil(curTime)
          if (this.audioObj.progressV >= 100) {
            this.audioObj.progressV = 100
            clearInterval(this.playSetInterval)
            setTimeout(() => {
              this.audioObj.playTime = 0
              this.audioObj.progressV = 0
              this.$refs['audioRefs'].currentTime = 0
              this.$refs['audioRefs'].pause()
              this.playingAudio = false
            }, 100)
          }
        } catch (e) {
          this.playSetInterval && clearInterval(this.playSetInterval)
        }
      }, 100)
    },
    /**
     * 暂停播放
     */
    pause() {
      this.playingAudio = false

      this.$refs['audioRefs'].pause()
    }
  }
}
</script>


<style  scoped>

.volume-icon,
.down-icon{
  display: inline-block;
  width: 16px;
  height: 16px;
}

.volume-icon{
  /* background: url('~@/assets/images/topic-lib/volume.png') no-repeat; */
  /* background-size: 100%; */
}

.down-icon{
  
  background-size: 100%;
  cursor: pointer;

 
}

.down-btn{
  color: #F4F5F7;

  cursor: pointer;

  
  
}



.c-AttachmentPreview-audio {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  width: 484px;
  height: 48px;
  margin-top: 22px;
  margin-left: 16px;
  padding: 8px 12px;
  border: 1px solid#f0f0f0;
  border-radius: 4px;

  

  

  

  
}
.c-AttachmentPreview-audio /deep/ .el-progress-bar__inner {
    background-color: green;

    transition: none;
    animation: none;
  }
.audio-icon {
    width: 32px;
    margin-right: 12px;

    
  }
 .audio-icon i {
      color: green;
      font-size: 32px;

      cursor: pointer;
    }
.time-box {
    width: 38px;

    color: #8c8c8c;
    font-size: 14px;
    line-height: 20px;
    text-align: center;
  }
.progress-num .active{
        color: green;
      }
.progress-box {
    flex: 1;
    margin: 0 8px 0 20px;
  }

/deep/ .el-slider__button-wrapper {
  z-index: 1 !important;
}

/deep/ .el-slider__button {
  background-color: green;
  border-color: green;
}

/deep/ .el-slider__bar {
  background-color: green;
}

</style>
