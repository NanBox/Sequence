const AV = require('../../libs/av-weapp-min')
const util = require('../../utils/util.js')

Page({

  /**
   * 页面的初始数据
   */
  data: {
    sequenceList: [],
    userList: [],
    isToday: true,
    selectSequence: true,
    getSequenceComplete: false,
    getUserComplete: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.getAllSequenceList()
  },

  /**
   * 切换标签
   */
  switchTab: function (event) {
    var selectSequence = event.currentTarget.id == "sequence"
    if (selectSequence && !this.data.getSequenceComplete) {
      this.getAllSequenceList()
    } else if (!selectSequence && !this.data.getUserComplete) {
      this.getAllUserList()
    }
    this.setData({
      selectSequence: selectSequence
    })
  },

  /**
   * 获取接龙总排行榜
   */
  getAllSequenceList: function () {
    util.showLoading()
    var that = this
    var query = new AV.Query('Sequence')
    query.descending('idiomCount')
    query.limit(10)
    query.find().then(function (sequenceList) {
      util.hideLoading()
      wx.stopPullDownRefresh()
      if (sequenceList.length > 0) {
        that.setData({
          getSequenceComplete: true,
          sequenceList: sequenceList
        })
      }
    }, err => {
      util.hideLoading()
      wx.stopPullDownRefresh()
      console.log("获取接龙总榜失败", err)
    })
  },

  /**
   * 获取用户总排行榜
   */
  getAllUserList: function () {
    util.showLoading()
    var that = this
    var query = new AV.Query('User')
    query.greaterThanOrEqualTo("idiomCount", 0)
    query.descending('idiomCount')
    query.limit(10)
    query.find().then(function (userList) {
      util.hideLoading()
      wx.stopPullDownRefresh()
      if (userList.length > 0) {
        that.setData({
          getUserComplete: true,
          userList: userList
        })
      }
    }, err => {
      util.hideLoading()
      wx.stopPullDownRefresh()
      console.log("获取用户总榜失败", err)
    })
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh: function () {
    if (this.data.selectSequence) {
      this.getAllSequenceList()
    } else {
      this.getAllUserList()
    }
  }
})