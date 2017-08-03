const AV = require('../../libs/av-weapp-min')
const util = require('../../utils/util.js')

//获取应用实例
var app = getApp()
Page({
  data: {
    sequenceList: [],
    canShowEmpty: false,
    hasUserInfo: false
  },

  /**
    * 生命周期函数--监听页面加载
    */
  onLoad: function () {
    var app = getApp()
    app.login(this.loginSuccess, this.updateUserSuccess)
    //可获取转发目标信息
    wx.showShareMenu({
      withShareTicket: true
    })
  },

  onShow: function (options) {
    if (getApp().globalData.refreshSequenceList) {
      getApp().globalData.refreshSequenceList = false
      this.getMySequences()
    }
  },

  loginSuccess: function () {
    this.getMySequences()
  },

  updateUserSuccess: function () {
    this.setData({
      hasUserInfo: true
    })
  },

  getMySequences: function () {
    util.showLoading()
    var that = this
    var userId = getApp().globalData.user.id
    AV.Cloud
      .run('getMySequences', { userId: userId })
      .then(sequenceList => {
        util.hideLoading()
        wx.stopPullDownRefresh()
        that.setData({
          canShowEmpty: true,
          sequenceList: sequenceList
        })
      }, err => {
        util.hideLoading()
        console.log("获取接龙失败", err)
      })
  },

  /**
    * 跳转接龙详情页面
    */
  navigateToIdiomList: function (event) {
    var index = event.currentTarget.id
    var id = this.data.sequenceList[index].objectId
    wx.navigateTo({
      url: '/pages/idiom-list/idiom-list?id=' + id
    })
  },

  /**
    * 跳转创建接龙页面
    */
  navigateToCreate: function () {
    wx.navigateTo({
      url: '/pages/create-sequence/create-sequence'
    })
  },

  /**
    * 获取用户信息
    */
  getUserInfo: function (res) {
    var app = getApp()
    if (res.detail.userInfo) {
      app.updateUserInfo(res.detail.userInfo, this.updateUserSuccess)
      this.navigateToCreate()
    }
  },

  /**
    * 下拉刷新
    */
  onPullDownRefresh: function () {
    this.getMySequences()
  }

})
