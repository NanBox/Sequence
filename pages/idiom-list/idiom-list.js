const AV = require('../../utils/av-weapp-min')
var util = require('../../utils/util.js')

Page({

  /**
   * 页面的初始数据
   */
  data: {
    id: "",
    sequence: null,
    idiomList: [],
    hasUserInfo: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.data.id = options.id
    var app = getApp()
    if (!app.globalData.hasLogin) {
      app.login(this.loginSuccess, this.updateUserSuccess)
    } else {
      this.getIdioms()
    }
    //转发可获取转发目标信息
    wx.showShareMenu({
      withShareTicket: true
    })
  },

  loginSuccess: function () {
    this.getIdioms()
  },

  updateUserSuccess: function () {
    this.setData({
      hasUserInfo: true
    })
  },

  getIdioms() {
    var that = this
    var sequence = AV.Object.createWithoutData('Sequence', this.data.id)

    sequence.fetch().then(function () {
      console.log("获取接龙实例")
      console.log(sequence)
      that.setData({
        sequence: sequence
      })
    }, function (error) {
      console.log("获取接龙实例失败")
      console.log(error)
    })

    var query = new AV.Query('Idiom')
    query.equalTo('sequence', sequence)
    query.find().then(function (idiomList) {
      console.log(idiomList)
      that.setData({
        idiomList: idiomList
      })
    })
  },

  /**
  * 用户点击右上角分享
  */
  onShareAppMessage: function () {
    var that = this
    return {
      title: "到你接龙了！",
      path: 'pages/idiom-list/idiom-list?id=' + this.data.id,
      // success(res) {
      //   that.getShareInfo(res.shareTickets[0])
      // }
    }
  },

  /**
   * 获取并处理分享信息
   */
  // getShareInfo: function (shareTicket) {
  //   util.showLoading()
  //   var that = this
  //   wx.getShareInfo({
  //     shareTicket: shareTicket,
  //     success(res) {
  //       var user = that.data.user
  //       AV.Cloud.run('decryptData', paramsJson).then(function (data) {
  //         console.log(data)
  //         //检查数据库中是否存在该群
  //         var query = new AV.Query('Group')
  //         query.equalTo('groupId', data.openGId)
  //         // 执行查询
  //         query.first().then(function (group) {
  //         }, function (err) {
  //           util.hideLoading()
  //           // 处理调用失败
  //           console.log("群查询失败")
  //           console.log(err)
  //         })
  //       })
  //     },
  //     fail(err) {
  //       util.hideLoading()
  //       // 处理调用失败
  //       console.log("获取分享信息失败")
  //       console.log(err)
  //       wx.showModal({
  //         title: '要转发到群哟~',
  //         showCancel: false
  //       })
  //     }
  //   })
  // },

})