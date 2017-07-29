const AV = require('../../utils/av-weapp-min')
var util = require('../../utils/util.js')

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
    var app = getApp()
    var refreshSequenceList = app.globalData.refreshSequenceList
    if (refreshSequenceList) {
      app.globalData.refreshSequenceList = false
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
    var user = getApp().globalData.user
    var userId = user.get("authData").lc_weapp.openid
    // 构建 Sequence 的查询
    var query = new AV.Query('Sequence')
    query.equalTo('createrId', user.get("authData").lc_weapp.openid)
    query.descending('updatedAt')
    // 执行查询
    query.find().then(sequenceList => {
      util.hideLoading()
      var that = this
      this.setData({
        canShowEmpty: true,
        sequenceList: sequenceList
      })
      console.log("更新接龙列表")
      console.log(sequenceList)
    }, err => {
      util.hideLoading()
      console.log("更新接龙失败")
      console.log(err)
    })
  },

  /**
    * 跳转接龙详情页面
    */
  navigateToIdiomList: function (event) {
    var index = event.currentTarget.id
    var id = this.data.sequenceList[index].id
    wx.navigateTo({
      url: '/pages/idiom-list/idiom-list?id=' + id
    })
  },

  /**
    * 跳转创建接龙页面
    */
  navigateToCreate: function () {
    var groupId = this.data.groupId
    wx.navigateTo({
      url: '/pages/create-idiom/create-idiom'
    })
  },

  /**
    * 获取用户信息
    */
  getUserInfo: function (res) {
    var app = getApp()
    if (res.detail.userInfo) {
      console.log("成功获取用户信息")
      console.log(res)
      app.updateUserInfo(res.detail.userInfo, this.updateUserSuccess)
      this.navigateToCreate()
    }
  }

})
