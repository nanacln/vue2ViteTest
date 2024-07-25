<template>
  <div id="test"></div>
</template>

<script>
export default {
  data(){
    return{
      imgUrl:'https://test.zhixue.com/filecloud/crop/scanPicture/scDV2dv_hanzhang_test/marking/scanFile/2024/06/19/2000000001000591248/studentScan/AfterCorrect_2aaed256-dd30-468a-931a-15c1026af6850.jpg'
    }
  },
  mounted(){
    const arr=["https://test.zhixue.com/filecloud/crop/scanPicture/scDV2dv_hanzhang_test/marking/scanFile/2024/06/19/2000000001000591248/studentScan/AfterCorrect_2aaed256-dd30-468a-931a-15c1026af6850.jpg","https://test.zhixue.com/filecloud/crop/scanPicture/scDV2dv_hanzhang_test/marking/scanFile/2024/06/19/2000000001000591248/studentScan/AfterCorrect_f06fee6b-c038-41e5-be8c-38963ed210b91.jpg"]
    for(let i=0;i<arr.length;i++){
      const canvasItem=document.createElement('div')
      canvasItem.className="canvasItem"+i
      document.querySelector('#test').appendChild(canvasItem)
    draw(arr,i)
    }
    function draw(arr,i){
      const canvas =document.createElement('canvas')
    canvas.className="mainCanvas"+i
    // const img = new Image()
    // img.onload=function(){
    //   canvas.width = img.width;
    //   canvas.height = img.height;
    // }
    // img.src=arr[i]
    
    const backgroundImage= new Image()
    
    backgroundImage.onload=function(){
      
      canvas.width = backgroundImage.width;
      canvas.height = backgroundImage.height;
      document.querySelector('.canvasItem'+i).appendChild(canvas)
      const ctx = canvas.getContext('2d')
      ctx.drawImage(backgroundImage,0,0,canvas.width,canvas.height)
      const homeImage= new Image()
      
      homeImage.onload=function(){
        ctx.drawImage(homeImage,300,400,homeImage.width,homeImage.height)
        ctx.drawImage(homeImage,600,200,homeImage.width,homeImage.height)
      }
      homeImage.src='data:image/png;base64,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'
      const img2=  new Image()
      
      img2.onload=function(){
        ctx.drawImage(img2,500,100,homeImage.width,homeImage.height)
        ctx.drawImage(img2,800,600,homeImage.width,homeImage.height)
      }
      img2.src='http://10.40.164.160:8080/src/assets/nav/nav-icon-third.png'
      
    }
    backgroundImage.src=arr[i]
    }
    // const homeImage= new Image()
    // homeImage.onload=function(){
    //   ctx.drawImage(homeImage,300,400,homeImage.width,homeImage.height)
    // }
    // homeImage.src='http://10.40.164.160:8080/src/assets/nav/home.png'
  }
}
</script>

<style>

</style>