const AV = require('../../libs/av-weapp-min')
const util = require('../../utils/util.js')

//获取应用实例
var app = getApp()
Page({
  data: {
    joinList: [],
    followList: [],
    getJoinComplete: false,
    getFollowComplete: false,
    hasUserInfo: false,
    selectJoin: true
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

  /**
   * 页面显示
   */
  onShow: function () {
    if (getApp().globalData.refreshSequenceList) {
      getApp().globalData.refreshSequenceList = false
      this.data.getJoinComplete = false
      this.data.getFollowComplete = false
      this.getSequences()
    }
  },

  /**
   * 登录成功
   */
  loginSuccess: function () {
    this.getSequences()
  },

  /**
   * 更新用户信息成功
   */
  updateUserSuccess: function () {
    this.setData({
      hasUserInfo: true
    })
  },

  /**
   * 获取接龙
   */
  getSequences: function () {
    if (this.data.selectJoin) {
      this.getJoinSequences()
    } else {
      this.getFollowSequences()
    }
  },

  /**
   * 获取参与的接龙
   */
  getJoinSequences: function () {
    util.showLoading()
    var that = this
    var userId = getApp().globalData.user.id
    AV.Cloud
      .run('getJoinSequences', { userId: userId })
      .then(joinList => {
        util.hideLoading()
        wx.stopPullDownRefresh()
        that.setData({
          getJoinComplete: true,
          joinList: joinList
        })
      }, err => {
        util.hideLoading()
        console.log("获取参与的接龙失败", err)
      })
  },

  /**
   * 获取围观的接龙
   */
  getFollowSequences: function () {
    util.showLoading()
    var that = this
    var userId = getApp().globalData.user.id
    AV.Cloud
      .run('getFollowSequences', { userId: userId })
      .then(followList => {
        util.hideLoading()
        wx.stopPullDownRefresh()
        that.setData({
          getFollowComplete: true,
          followList: followList
        })
      }, err => {
        util.hideLoading()
        console.log("获取围观的接龙失败", err)
      })
  },

  /**
   * 切换标签
   */
  switchTab: function (event) {
    var selectJoin = event.currentTarget.id == "join"
    if (selectJoin && !this.data.getJoinComplete) {
      this.getJoinSequences()
    } else if (!selectJoin && !this.data.getFollowComplete) {
      this.getFollowSequences()
    }
    this.setData({
      selectJoin: selectJoin
    })
  },

  /**
   * 跳转接龙详情页面
   */
  navigateToIdiomList: function (event) {
    var index = event.currentTarget.id
    var id
    if (this.data.selectJoin) {
      id = this.data.joinList[index].objectId
    } else {
      id = this.data.followList[index].objectId
    }
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
    this.getSequences()
  }

})
