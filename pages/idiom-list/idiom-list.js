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
    hasUserInfo: false,
    isCreater: false,
    showInput: false,
    inputIdiom: "",
    inputIdiomPinyin: []
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.data.id = options.id
    var app = getApp()
    this.setData({
      hasUserInfo: app.globalData.hasUserInfo
    })
    if (!app.globalData.hasLogin) {
      app.login(this.loginSuccess, this.updateUserSuccess)
    } else {
      this.getSequence()
      this.getIdioms()
    }
    //转发可获取转发目标信息
    wx.showShareMenu({
      withShareTicket: true
    })
  },

  loginSuccess: function () {

  },

  updateUserSuccess: function () {
    this.getSequence()
    this.getIdioms()
    this.setData({
      hasUserInfo: true
    })
  },

  getSequence() {
    var that = this
    var sequence = AV.Object.createWithoutData('Sequence', this.data.id)
    var app = getApp()
    var user = app.globalData.user

    sequence.fetch().then(function () {
      console.log("获取接龙实例")
      console.log(sequence)
      that.data.sequence = sequence
      var userId = user.get("authData").lc_weapp.openid
      var isCreater = sequence.get("creater").id == userId
      var isChallenger = sequence.get("challenger").id == userId
      var showInput = (isCreater || isChallenger) && sequence.get("lastIdiomCreater").id != userId

      that.setData({
        isCreater: isCreater,
        showInput: showInput
      })

      if (!isCreater &&
        sequence.get("challenger").id.length == 0 &&
        that.data.hasUserInfo) {
        that.setChallenger()
      } else {
        that.setData({
          sequence: sequence
        })
      }
    }, function (error) {
      console.log("获取接龙实例失败")
      console.log(error)
    })
  },

  getIdioms() {
    var that = this
    var sequence = AV.Object.createWithoutData('Sequence', this.data.id)

    var query = new AV.Query('Idiom')
    query.equalTo('sequence', sequence)
    query.find().then(function (idiomList) {
      console.log("获取成语")
      console.log(idiomList)
      that.setData({
        idiomList: idiomList
      })
    })
  },

  setChallenger: function () {
    var that = this
    var sequence = this.data.sequence
    if (sequence.get("challenger").id.length == "") {
      var app = getApp()
      var user = app.globalData.user
      var challenger = {
        id: user.get("authData").lc_weapp.openid,
        name: user.get("nickName"),
        img: user.get("avatarUrl")
      }
      sequence.set('challenger', challenger)
      sequence.save().then(function (res) {
        console.log("保存挑战者")
        console.log(res)
        that.getIdioms()
      }, function (error) {
        console.log("保存挑战者失败")
        console.log(error)
      }).catch(console.error)
    }
    this.setData({
      sequence: sequence
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
      app.updateUserInfo(res.detail.userInfo, this.getPremissionSuccess)
    }
  },

  getPremissionSuccess: function () {
    this.setChallenger()
    this.setData({
      hasUserInfo: true
    })
  },

  onInput: function (e) {
    this.data.inputIdiom = e.detail.value
  },

  onSubmit: function () {
    var that = this
    var idiom = this.data.inputIdiom
    var idiomList = this.data.idiomList
    var lastIdiom = idiomList[idiomList.length - 1]
    if (idiom.length == 4 && util.isChinese(idiom)) {
      AV.Cloud.run('pinyin', { hanzi: idiom }).then(function (pinyin) {
        that.data.inputIdiomPinyin = pinyin
        console.log("转换拼音")
        console.log(pinyin)
        if (that.checkPinyin(pinyin[0], lastIdiom.get("pinyin")[3])) {
          that.saveIdiom()
        } else {
          wx.showModal({
            content: "这个成语接不上哦",
          })
        }
      })
    } else {
      wx.showModal({
        content: "请输入四字成语",
      })
    }
  },

  checkPinyin(pinyin1, pinyin2) {
    var canConnect = false
    pinyin1.forEach(function (value1) {
      pinyin2.forEach(function (value2) {
        if (value1 == value2) {
          canConnect = true
        }
      })
    })
    return canConnect
  },

  saveIdiom: function () {
    util.showLoading()
    var that = this
    var user = getApp().globalData.user
    var sequence = this.data.sequence
    var idiomList = this.data.idiomList

    var creater = {
      id: user.get("authData").lc_weapp.openid,
      name: user.get("nickName"),
      img: user.get("avatarUrl")
    }

    var userQuery = new AV.Query('UserSequenceMap')
    userQuery.equalTo('user', user)
    var sequenceQuery = new AV.Query('UserSequenceMap')
    sequenceQuery.equalTo('sequence', sequence)
    // 组合查询
    var mapQuery = AV.Query.and(userQuery, sequenceQuery)
    mapQuery.first().then(function (userSequenceMap) {
      if (userSequenceMap == null) {
        //没有则建立联系
        var userSequenceMap = new AV.Object('UserSequenceMap')
        userSequenceMap.set('user', user)
        userSequenceMap.set('sequence', sequence)
        userSequenceMap.save().then(function (res) {
          // 成功保存
          console.log("建立用户和接龙的关系")
          console.log(res)
        }, function (error) {
          util.hideLoading()
          // 异常处理
          console.log("建立用户和接龙的关系失败")
          console.error(error.message)
        })
      } else {
        util.hideLoading()
      }
    }, function (err) {
      // 处理调用失败
      console.log("查找用户、群关系失败")
      console.log(err)
    })

    sequence.set("lastIdiom", this.data.inputIdiom)
    sequence.set("lastIdiomCreater", creater)
    sequence.set("idiomCount", idiomList.length + 1)

    var idiom = new AV.Object("Idiom")
    idiom.set("value", this.data.inputIdiom)
    idiom.set("creater", creater)
    idiom.set("sequenceName", sequence.get("sequenceName"))
    idiom.set("pinyin", that.data.inputIdiomPinyin)
    idiom.set("idiomNum", that.data.idiomList.length + 1)
    idiom.set("sequence", sequence)

    idiom.save().then(function (res) {
      util.hideLoading()
      //成功保存记录
      console.log("保存成语")
      console.log(res)
      getApp().globalData.refreshSequenceList = true
      wx.showToast({
        title: '创建成功'
      })
      that.getIdioms()
    }, function (error) {
      util.hideLoading()
      console.log("保存成语失败")
      console.log(error)
    }).catch(console.error)
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