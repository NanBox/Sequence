const AV = require('../../utils/av-weapp-min')
var util = require('../../utils/util.js')

//获取应用实例
var app = getApp()
Page({
  data: {
    sequenceList: [],
    canShowEmpty: false
  },

  /**
    * 生命周期函数--监听页面加载
    */
  onLoad: function () {
    var that = this
    var app = getApp()
    // 登录
    util.showLoading()
    AV.User.loginWithWeapp().then(user => {
      app.globalData.user = AV.User.current()
      console.log("登录成功")
      console.log(app.globalData.user)
      // 判断用户信息是否已授权
      wx.getSetting({
        success: res => {
          if (!res.authSetting['scope.userInfo']) {
            return
          }
          // 已经授权，可以直接调用 getUserInfo 获取头像昵称
          wx.getUserInfo({
            success: res => {
              // 更新用户信息
              that.updateUserInfo(res.userInfo)
            }
          })
        }
      })
      that.getMySequences()
      var shareTicket = app.globalData.shareTicket
      if (shareTicket.length > 0) {
        // that.getShareInfo(shareTicket)
      }
    }, err => {
      util.hideLoading()
      console.log("登录失败")
      console.log(error)
    }).catch(console.error)

    //可获取转发目标信息
    wx.showShareMenu({
      withShareTicket: true
    })

    // AV.Cloud.run('pinyin', { hanzi: "成语接龙" }).then(function (data) {
    //   console.log(data)
    // })

  },

  onShow: function (options) {
    var app = getApp()
    var refreshSequenceList = app.globalData.refreshSequenceList
    if (refreshSequenceList) {
      app.globalData.refreshSequenceList = false
      this.getMySequences()
    }
  },

  /**
  * 更新用户信息
  */
  updateUserInfo: function (userInfo) {
    var app = getApp()
    var user = AV.User.current()
    user.set(userInfo).save().then(user => {
      util.hideLoading()
      app.globalData.user = AV.User.current()
      app.globalData.updateUserSuccess = true
      console.log("更新用户信息成功")
      console.log(app.globalData.user)
    }, error => {
      util.hideLoading()
      console.log("更新用户信息失败")
      console.log(error)
    }).catch(console.error)
  },

  getMySequences: function () {
    util.showLoading()
    var that = this
    var user = getApp().globalData.user
    var userId = user.get("authData").lc_weapp.openid
    // 构建 Sequence 的查询
    var cql = "select * from Sequence where createUserId = '" + userId + "' order by updatedAt desc";
    AV.Query.doCloudQuery(cql).then(data => {
      util.hideLoading()
      that.setData({
        canShowEmpty: true,
        sequenceList: data.results
      })
      console.log("更新接龙列表")
      console.log(data.results)
    }, err => {
      util.hideLoading()
      console.log("更新接龙失败")
      console.log(err)
    });

    // var query = new AV.Query('Sequence')
    // query.equalTo('createUserId', user.get("authData").lc_weapp.openid)
    // query.descending('updatedAt')
    // // 执行查询
    // query.find().then(sequenceList => {
    //   util.hideLoading()
    //   var that = this
    //   this.setData({
    //     canShowEmpty: true,
    //     sequenceList: sequenceList
    //   })
    //   console.log("更新接龙列表")
    //   console.log(sequenceList)
    // }, err => {
    //   util.hideLoading()
    //   console.log("更新接龙失败")
    //   console.log(err)
    // })
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
  checkUpdateUserInfo: function () {
    var updateUserSuccess = getApp().globalData.updateUserSuccess
    if (updateUserSuccess) {
      this.navigateToCreate()
    } else {
      this.getUserInfo()
    }
  },

  navigateToCreate: function () {
    var groupId = this.data.groupId
    wx.navigateTo({
      url: '/pages/create-idiom/create-idiom'
    })
  },

  /**
    * 获取用户信息
    */
  getUserInfo: function () {
    util.showLoading()
    var that = this
    wx.getUserInfo({
      success: (res) => {
        that.updateUserInfo(res.userInfo)
        that.navigateToCreate()
      },
      fail: (res) => {
        util.hideLoading()
        console.log("获取用户信息失败")
        console.log(res)
        wx.showModal({
          title: '需要您的授权才能创建接龙',
          showCancel: false,
          success: function (res) {
            wx.openSetting({
              success(res) {
                if (!res.authSetting['scope.userInfo']) {
                  return
                }
                that.getUserInfo()
              }
            })
          }
        })
      }
    })
  }

})
