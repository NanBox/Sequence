const AV = require('../../utils/av-weapp-min')
var util = require('../../utils/util.js')

Page({

  /**
   * 页面的初始数据
   */
  data: {
    sequenceName: "",
    firstIdiom: "",
    isTitleLegal: false,
    isIdiomLegal: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {

  },

  onTitleInput: function (event) {
    var value = event.detail.value
    this.setData({
      sequenceName: value,
      isTitleLegal: value.length > 0 ? true : false
    })
  },

  onIdiomInput: function (event) {
    var value = event.detail.value
    this.setData({
      firstIdiom: value,
      isIdiomLegal: value.length == 4 && util.isChinese(value) ? true : false
    })
  },

  submit: function () {
    var that = this
    var user = AV.User.current()

    AV.Cloud.run('pinyin', { hanzi: this.data.firstIdiom }).then(function (pinyin) {
      console.log("转换拼音")
      console.log(pinyin)
      var sequence = new AV.Object("Sequence")
      sequence.set("sequenceName", that.data.sequenceName)
      sequence.set("type", "two")
      sequence.set("createrId", user.get("authData").lc_weapp.openid)
      sequence.set("createrName", user.get("nickName"))
      sequence.set("createrImg", user.get("avatarUrl"))
      sequence.set("challengerId", "")
      sequence.set("challengerName", "")
      sequence.set("challengerImg", "")
      sequence.set("lastIdiom", that.data.firstIdiom)
      sequence.set("idiomCount", 1)

      var idiom = new AV.Object("Idiom")
      idiom.set("value", that.data.firstIdiom)
      idiom.set("createrId", user.get("authData").lc_weapp.openid)
      idiom.set("createrName", user.get("nickName"))
      idiom.set("createrImg", user.get("avatarUrl"))
      idiom.set("sequenceName", that.data.sequenceName)
      idiom.set("pinyin", pinyin)
      idiom.set("idiomNum", 1)
      idiom.set("sequence", sequence)

      idiom.save().then(function (res) {
        util.hideLoading()
        //成功保存记录
        console.log("成功创建接龙")
        console.log(res)
        getApp().globalData.refreshSequenceList = true
        wx.showToast({
          title: '创建成功'
        })
        // 保存我参与的接龙
        var mySequenceMap = user.get("mySequenceMap")
        if (mySequenceMap == null) {
          mySequenceMap = new Map()
        } else {
          mySequenceMap = new Map(mySequenceMap)
        }
        mySequenceMap.set(res.get("sequence").id, that.data.sequenceName)
        user.set("mySequenceMap", [...mySequenceMap]).save().then(user => {
          util.hideLoading()
          getApp().globalData.user = AV.User.current()
          console.log("保存我参与的接龙")
          console.log(getApp().globalData.user)
        }, error => {
          util.hideLoading()
          console.log("保存我参与的接龙失败")
          console.log(error)
        }).catch(console.error)

        setTimeout(function () {
          wx.navigateBack({
            delta: 1
          })
        }, 1000)
      }, function (error) {
        util.hideLoading()
        console.log("创建接龙失败")
        console.log(error)
      }).catch(console.error)
    
    }, function (error) {
      util.hideLoading()
      console.log("转换拼音失败")
      console.log(error)
    }).catch(console.error)
  },

  /**
 * 建立用户和群之间的关系
 */
  // saveUserSequenceMap: function (user, sequence) {
  //   var that = this
  //   var userSequenceMap = new AV.Object('UserSequenceMap')
  //   userSequenceMap.set('user', user)
  //   userSequenceMap.set('sequence', sequence)
  //   userSequenceMap.save().then(function (res) {
  //     util.hideLoading()
  //     // 成功保存
  //     console.log("成功建立用户和接龙的关系")
  //     console.log(res)
  //     that.getMyGroups()
  //   }, function (error) {
  //     util.hideLoading()
  //     // 异常处理
  //     console.log("建立用户和接龙的关系失败")
  //     console.error(error.message)
  //   })
  // }
})