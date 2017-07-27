const AV = require('../../utils/av-weapp-min')
var util = require('../../utils/util.js')

Page({

  /**
   * 页面的初始数据
   */
  data: {
    sequenceName: "",
    firstIdiom: "",
    isTitleLegal: false,
    isIdiomLegal: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {

  },

  onTitleInput: function (event) {
    var value = event.detail.value
    this.setData({
      title: value,
      isTitleLegal: value.length > 0 ? true : false
    })
  },

  onIdiomInput: function (event) {
    var value = event.detail.value
    this.setData({
      firstIdiom: value,
      isIdiomLegal: value.length == 4 && util.isChinese(value) ? true : false
    })
  },

  submit: function () {
    var user = AV.User.current()

    var sequence = new AV.Object('Sequence')
    sequence.set('sequenceName', this.data.sequenceName)
    sequence.set('createUserId', user.get("authData").lc_weapp.openid)
    sequence.set('createUserName', user.get("nickName"))
    sequence.set('createUserImg', user.get("avatarUrl"))
    sequence.set('lastIdiom', this.data.firstIdiom)
    sequence.set('idiomCount', 1)

    var idiom = new AV.Object('Idiom')
    idiom.set('value', this.data.firstIdiom)
    idiom.set('createUserId', user.get("authData").lc_weapp.openid)
    idiom.set('createUserName', user.get("nickName"))
    idiom.set('createUserImg', user.get("avatarUrl"))
    idiom.set('sequenceName', this.data.sequenceName)
    idiom.set('dependent', sequence)

    //检查是否已建立联系
    // var userQuery = new AV.Query('UserSequenceMap')
    // userQuery.equalTo('user', user)
    // var sequenceQuery = new AV.Query('UserSequenceMap')
    // sequenceQuery.equalTo('sequence', sequence)
    // // 组合查询
    // var mapQuery = AV.Query.and(userQuery, sequenceQuery)
    // mapQuery.first().then(function (userSequenceMap) {
    //   if (userSequenceMap == null) {
    //     //没有则建立联系
    //     that.saveUserSequenceMap(user, sequence)
    //   } else {
    //     util.hideLoading()
    //   }
    // }, function (err) {
    //   util.hideLoading()
    //   // 处理调用失败
    //   console.log("查找用户、接龙关系失败")
    //   console.log(err)
    // })
    

    idiom.save().then(function (res) {
      util.hideLoading()
      //成功保存记录
      console.log("成功创建接龙")
      console.log(res)
      getApp().globalData.refreshSequenceList = true
      wx.showToast({
        title: '创建成功'
      })
      setTimeout(function () {
        wx.navigateBack({
          delta: 1
        })
      }, 1000)
    }, function (error) {
      util.hideLoading()
      console.log("创建接龙失败")
      console.log(error)
    }).catch(console.error)
  },

  /**
 * 建立用户和群之间的关系
 */
  // saveUserSequenceMap: function (user, sequence) {
  //   var that = this
  //   var userSequenceMap = new AV.Object('UserSequenceMap')
  //   userSequenceMap.set('user', user)
  //   userSequenceMap.set('sequence', sequence)
  //   userSequenceMap.save().then(function (res) {
  //     util.hideLoading()
  //     // 成功保存
  //     console.log("成功建立用户和接龙的关系")
  //     console.log(res)
  //     that.getMyGroups()
  //   }, function (error) {
  //     util.hideLoading()
  //     // 异常处理
  //     console.log("建立用户和接龙的关系失败")
  //     console.error(error.message)
  //   })
  // }
})