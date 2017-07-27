//app.js
const AV = require('./utils/av-weapp-min.js');

AV.init({
  appId: 'MArHq4pqWa8HeVXdUge3o98t-gzGzoHsz',
  appKey: 'cpbz3mExGhEvTJ3HMMKj6lBf',
});

App({
  onLaunch: function () {
    //调用API从本地缓存中获取数据
    var logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)
  },

  getUserInfo: function (cb) {
    var that = this
    if (this.globalData.userInfo) {
      typeof cb == "function" && cb(this.globalData.userInfo)
    } else {
      //调用登录接口
      wx.getUserInfo({
        withCredentials: false,
        success: function (res) {
          that.globalData.userInfo = res.userInfo
          typeof cb == "function" && cb(that.globalData.userInfo)
        }
      })
    }
  },

  globalData: {
    shareTicket: "",
    updateUserSuccess: false,
    refreshMainPage: false
  }
})
