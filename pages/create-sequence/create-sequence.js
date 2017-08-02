const AV = require('../../libs/av-weapp-min')
const util = require('../../utils/util.js')

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
    this.data.sequenceName = value
    this.setData({
      isTitleLegal: value.length > 0 ? true : false
    })
  },

  onIdiomInput: function (event) {
    var value = event.detail.value
    this.data.firstIdiom = value
    this.setData({
      isIdiomLegal: value.length == 4 && util.isChinese(value) ? true : false
    })
  },

  submit: function () {
    if (!(this.data.isTitleLegal && this.data.isIdiomLegal)) {
      return
    }
    var that = this
    var user = getApp().globalData.user
    var creator = {
      id: user.id,
      name: user.get("nickName"),
      img: user.get("avatarUrl")
    }
    var params = {
      sequenceName: this.data.sequenceName,
      firstIdiom: this.data.firstIdiom,
      type: "two",
      creator: creator
    }
    util.showLoading()
    AV.Cloud
      .run('createSequence', params)
      .then(sequence => {
        util.hideLoading()
        getApp().globalData.refreshSequenceList = true
        wx.showToast({
          title: '创建成功'
        })
        setTimeout(function () {
          wx.navigateBack({
            delta: 1
          })
        }, 1000)
        console.log("创建接龙")
        console.log(sequence)
      }, err => {
        util.hideLoading()
        console.log("创建接龙失败")
        console.log(err)
      })
  }
})