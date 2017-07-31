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
    if (!(this.data.isTitleLegal && this.data.isIdiomLegal)) {
      return
    }
    var that = this
    var user = AV.User.current()

    AV.Cloud.run('pinyin', { hanzi: this.data.firstIdiom }).then(function (pinyin) {
      console.log("转换拼音")
      console.log(pinyin)
      var creater = {
        id: user.get("authData").lc_weapp.openid,
        name: user.get("nickName"),
        img: user.get("avatarUrl")
      }
      var challenger = {
        id: "",
        name: "",
        img: ""
      }
      var sequence = new AV.Object("Sequence")
      sequence.set("sequenceName", that.data.sequenceName)
      sequence.set("type", "two")
      sequence.set("creater", creater)
      sequence.set("challenger", challenger)
      sequence.set("lastIdiom", that.data.firstIdiom)
      sequence.set("lastIdiomCreater", creater)
      sequence.set("idiomCount", 1)

      var idiom = new AV.Object("Idiom")
      idiom.set("value", that.data.firstIdiom)
      idiom.set("creater", creater)
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

        var userSequenceMap = new AV.Object('UserSequenceMap')
        userSequenceMap.set('user', user)
        userSequenceMap.set('sequence', sequence)
        userSequenceMap.save().then(function (res) {
          // 成功保存
          console.log("建立用户和接龙的关系")
          console.log(res)
        }, function (error) {
          util.hideLoading()
          // 异常处理
          console.log("建立用户和接龙的关系失败")
          console.error(error.message)
        })

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
  }
})