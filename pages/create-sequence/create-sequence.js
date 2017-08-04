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
    isIdiomLegal: false,
    sequenceType: ""
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {

  },

  /**
   * 标题输入
   */
  onTitleInput: function (event) {
    var value = event.detail.value
    this.data.sequenceName = value
    this.setData({
      isTitleLegal: value.length > 0 ? true : false
    })
  },

  /**
   * 成语输入
   */
  onIdiomInput: function (event) {
    var value = event.detail.value
    this.data.firstIdiom = value
    this.setData({
      isIdiomLegal: value.length == 4 && util.isChinese(value) ? true : false
    })
  },

  /**
   * 选择类型
   */
  selectType: function (event) {
    this.setData({
      sequenceType: event.currentTarget.id
    })
  },

  /**
   * 提交
   */
  submit: function () {
    if (!(this.data.isTitleLegal && this.data.isIdiomLegal && this.data.sequenceType.length > 0)) {
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
      type: this.data.sequenceType,
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
      }, err => {
        util.hideLoading()
        console.log("创建接龙失败")
        console.log(err)
      })
  }
})