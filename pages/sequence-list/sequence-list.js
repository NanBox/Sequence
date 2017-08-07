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
    selectJoin: true,
    currentJoinPage: 0,
    hasNextJoinPage: true,
    loadingNextJoinPage: false,
    currentFollowPage: 0,
    hasNextFollowPage: true,
    loadingNextFollowPage: false
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
      this.getSequencesFirstPage()
    }
  },

  /**
   * 登录成功
   */
  loginSuccess: function () {
    this.getSequencesFirstPage()
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
   * 首次接龙首页
   */
  getSequencesFirstPage: function () {
    util.showLoading()
    if (this.data.selectJoin) {
      this.data.currentJoinPage = 0
      this.data.hasNextJoinPage = true
      this.getJoinSequences()
    } else {
      this.data.currentFollowPage = 0
      this.data.hasNextFollowPage = true
      this.getFollowSequences()
    }
  },

  /**
   * 首次接龙下一页
   */
  getSequencesNextPage: function () {
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
    if (!this.data.hasNextJoinPage || this.data.loadingNextJoinPage) {
      return
    }
    this.setData({
      loadingNextJoinPage: true
    })
    var that = this
    var userId = getApp().globalData.user.id
    var currentJoinPage = this.data.currentJoinPage
    AV.Cloud
      .run('getJoinSequences', { userId: userId, page: currentJoinPage + 1 })
      .then(joinList => {
        util.hideLoading()
        wx.stopPullDownRefresh()
        that.data.currentJoinPage = currentJoinPage + 1
        var hasNextJoinPage
        if (joinList != null && joinList.length == 10) {
          hasNextJoinPage = true
        } else {
          hasNextJoinPage = false
        }
        var allJoinList
        if (that.data.currentJoinPage == 1) {
          allJoinList = joinList
        } else {
          allJoinList = that.data.joinList.concat(joinList)
        }
        that.setData({
          getJoinComplete: true,
          joinList: allJoinList,
          hasNextJoinPage: hasNextJoinPage,
          loadingNextJoinPage: false
        })
      }, err => {
        util.hideLoading()
        console.log("获取参与的接龙失败", err)
        that.setData({
          hasNextJoinPage: true,
          loadingNextJoinPage: false
        })
      })
  },

  /**
   * 获取围观的接龙
   */
  getFollowSequences: function () {
    if (!this.data.hasNextFollowPage || this.data.loadingNextFollowPage) {
      return
    }
    this.setData({
      loadingNextFollowPage: true
    })
    var that = this
    var userId = getApp().globalData.user.id
    var currentFollowPage = this.data.currentFollowPage
    AV.Cloud
      .run('getFollowSequences', { userId: userId, page: currentFollowPage + 1 })
      .then(followList => {
        util.hideLoading()
        wx.stopPullDownRefresh()
        that.data.currentFollowPage = currentFollowPage + 1
        var hasNextFollowPage
        if (followList != null && followList.length == 10) {
          hasNextFollowPage = true
        } else {
          hasNextFollowPage = false
        }
        var allFollowList
        if (that.data.currentFollowPage == 1) {
          allFollowList = followList
        } else {
          allFollowList = that.data.followList.concat(followList)
        }
        that.setData({
          getFollowComplete: true,
          followList: allFollowList,
          hasNextFollowPage: hasNextFollowPage,
          loadingNextFollowPage: false
        })
      }, err => {
        util.hideLoading()
        console.log("获取围观的接龙失败", err)
        that.setData({
          hasNextFollowPage: true,
          loadingNextFollowPage: false
        })
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
    this.getSequencesFirstPage()
  },

  /**
   * 上拉加载
   */
  onReachBottom: function () {
    this.getSequencesNextPage()
  }

})
