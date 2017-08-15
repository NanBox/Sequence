const AV = require('./libs/av-weapp-min.js')
const Realtime = require('./libs/realtime.weapp.min.js').Realtime
const util = require('./utils/util.js')

AV.init({
  appId: 'MArHq4pqWa8HeVXdUge3o98t-gzGzoHsz',
  appKey: 'cpbz3mExGhEvTJ3HMMKj6lBf',
});

App({
  onLaunch: function (ops) {
    //当情景值为 1044，即通过带 shareTicket 的微信群分享卡片进入小程序
    if (ops != null && ops.scene == 1044) {
      this.globalData.shareTicket = ops.shareTicket
    }
    // 初始化 Realtime
    this.globalData.realtime = new Realtime({
      appId: 'MArHq4pqWa8HeVXdUge3o98t-gzGzoHsz',
      noBinary: true,
    })
  },

  login: function (loginSuccess, updateUserSuccess) {
    var that = this
    // 登录
    util.showLoading()
    AV.User.loginWithWeapp().then(user => {
      that.globalData.user = AV.User.current()
      that.globalData.hasLogin = true
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
              that.updateUserInfo(res.userInfo, updateUserSuccess)
            }, fail: res => {
              util.hideLoading()
            }
          })
        }
      })
      typeof loginSuccess == "function" && loginSuccess()
    }, err => {
      util.hideLoading()
      console.log("登录失败", err)
      if (err.code == 140) {
        console.log("API 调用总次数已超过限制")
      }
    })
  },

  /**
    * 更新用户信息
    */
  updateUserInfo: function (userInfo, updateUserSuccess) {
    var that = this
    var user = AV.User.current()
    user.set(userInfo).save().then(user => {
      util.hideLoading()
      that.globalData.user = AV.User.current()
      that.globalData.hasUserInfo = true
      typeof updateUserSuccess == "function" && updateUserSuccess()
    }, error => {
      util.hideLoading()
      console.log("更新用户信息失败", error)
    })
  },

  globalData: {
    user: null,
    hasLogin: false,
    hasUserInfo: false,
    shareTicket: "",
    refreshSequenceList: false,
    realtime: null,
    client: null
  }
})
