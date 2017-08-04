const AV = require('../../libs/av-weapp-min')
const TextMessage = require('../../libs/realtime.weapp.min.js').TextMessage
const util = require('../../utils/util.js')
var mClient = null
var mConversation = null

Page({

  /**
   * 页面的初始数据
   */
  data: {
    id: "",
    sequence: null,
    idiomList: [],
    hasUserInfo: false,
    // isCreator: false,
    showInput: false,
    inputIdiom: "",
    inputIdiomPinyin: [],

    userSequenceMap: null,
    isJoin: false,
    canInput: false,
    toView: ""

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
      this.setData({
        hasUserInfo: app.globalData.hasUserInfo
      })
      this.getSequence()
      this.getIdioms()
    }
    //转发可获取转发目标信息
    wx.showShareMenu({
      withShareTicket: true
    })
  },

  /**
   * 登录成功
   */
  loginSuccess: function () {
    this.getSequence()
    this.getIdioms()
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
   * 获取用户信息
   */
  getUserInfo: function (res) {
    var app = getApp()
    if (res.detail.userInfo) {
      app.updateUserInfo(res.detail.userInfo, this.updateUserSuccess)
    }
  },

  /**
   * 获取接龙
   */
  getSequence: function () {
    var that = this
    var sequence = AV.Object.createWithoutData('Sequence', this.data.id)
    sequence.fetch().then(function () {
      that.data.sequence = sequence
      that.checkRelation()
      that.getConversation()
      wx.setNavigationBarTitle({
        title: sequence.get("title"),
      })
    }, function (error) {
      console.log("获取接龙失败", error)
    })
  },

  /**
   * 检查用户、接龙关系
   */
  checkRelation: function () {
    var that = this
    var user = getApp().globalData.user
    var sequence = this.data.sequence
    var query = new AV.Query('UserSequenceMap')
    query.equalTo('user', user)
    query.equalTo('sequence', sequence)
    query.first().then(function (userSequenceMap) {
      if (userSequenceMap != null) {
        that.data.userSequenceMap = userSequenceMap
        that.data.isJoin = userSequenceMap.get("join")
        if (!that.data.isJoin && sequence.get("type") == "group") {
          that.setGroupTypeRelation()
        }
        if (that.data.isJoin || sequence.get("type") == "all") {
          this.setData({
            canInput: true
          })
        }
      } else {
        if (sequence.get("type") == "all") {
          that.setAllTypeRelation()
        } else if (sequence.get("type") == "group") {
          that.setGroupTypeRelation()
        } else if (sequence.get("type") == "two") {
          that.setTwoTypeRelation()
        }
      }
    }, function (err) {
      console.log("查找用户、群关系失败", err)
    })
  },

  /**
   * 建立和全平台类型接龙的关系
   */
  setAllTypeRelation: function (join) {
    this.setData({
      canInput: true
    })
    if (join) {
      this.setJoinRelation()
    } else {
      this.setFollowRelation()
    }
  },

  /**
   * 建立和群类型接龙的关系
   */
  setGroupTypeRelation: function () {
    var that = this
    var shareTicket = getApp().globalData.shareTicket
    if (shareTicket != null) {
      var user = getApp().globalData.user
      var sequence = this.data.sequence
      wx.getShareInfo({
        shareTicket: shareTicket,
        success(res) {
          var paramsJson = {
            sessionKey: user.attributes.authData.lc_weapp.session_key,
            encryptedData: res.encryptedData,
            iv: res.iv
          }
          AV.Cloud.run('decryptData', paramsJson).then(function (data) {
            if (sequence.get("groupId") == data.openGId) {
              that.setData({
                isJoin: true,
                canInput: true
              })
              that.setJoinRelation()
            } else {
              that.setFollowRelation()
            }
          })
        },
        fail(err) {
          util.hideLoading()
          console.log("获取分享信息失败", err)
        }
      })
    } else {
      this.setFollowRelation()
    }
  },

  /**
   * 建立和两人类型接龙的关系
   */
  setTwoTypeRelation: function () {
    var sequence = this.data.sequence
    if (sequence.get("imgList").length < 2) {
      var user = getApp().globalData.user
      var imgList = sequence.get("imgList")
      if (imgList == null) {
        imgList = []
      }
      sequence.set("imgList", imgList.push(user.get("avatarUrl")))
      sequence.save()
      this.setData({
        isJoin: true,
        canInput: true,
        sequence: sequence
      })
      this.setJoinRelation()
    } else {
      this.setFollowRelation()
    }
  },

  /**
   * 建立接龙的参与关系
   */
  setJoinRelation: function () {
    var that = this
    var user = getApp().globalData.user
    var sequence = this.data.sequence
    var userSequenceMap = new AV.Object('UserSequenceMap')
    userSequenceMap.set('user', user)
    userSequenceMap.set('sequence', sequence)
    userSequenceMap.set('join', true)
    userSequenceMap.save(userSequenceMap => {
      that.data.userSequenceMap = userSequenceMap
    })
    var joinCount = sequence.get("joinCount")
    if (joinCount == null) {
      joinCount = 0
    }
    sequence.set("joinCount", joinCount + 1)
    sequence.save()
  },

  /**
   * 建立接龙的围观关系
   */
  setFollowRelation: function () {
    var that = this
    var user = getApp().globalData.user
    var sequence = this.data.sequence
    var userSequenceMap = new AV.Object('UserSequenceMap')
    userSequenceMap.set('user', user)
    userSequenceMap.set('sequence', sequence)
    userSequenceMap.set('join', false)
    userSequenceMap.save(userSequenceMap => {
      that.data.userSequenceMap = userSequenceMap
    })
  },

  /**
   * 建立实时通信对话
   */
  getConversation: function () {
    var that = this
    var user = getApp().globalData.user
    var realtime = getApp().globalData.realtime
    var sequence = this.data.sequence
    realtime.createIMClient(user.id).then(function (client) {
      mClient = client
      if (sequence.get("conversationId") != null &&
        sequence.get("conversationId").length > 0) {
        client.getConversation(sequence.get("conversationId"))
          .then(function (conversation) {
            mConversation = conversation
            mConversation.join()
            that.receiveMessage()
          }, function (error) {
            console.log("查询对话失败", error)
          })
      } else {
        client.createConversation({
          transient: true,
        }).then(function (conversation) {
          mConversation = conversation
          sequence.set("conversationId", conversation.id)
          sequence.save()
          mConversation.join()
          that.receiveMessage()
        }, function (error) {
          console.log("创建对话失败", error)
        })
      }
    })
  },

  /**
   * 接收消息
   */
  receiveMessage: function () {
    var that = this
    var sequence = this.data.sequence
    mClient.on('message', function (message, conversation) {
      if (sequence.get("type") == "all" ||
        (sequence.get("type") == "two" && sequence.get("imgList").length < 2)) {
        that.getSequence()
      }
      that.getIdioms()
    })
  },

  /**
   * 获取成语列表
   */
  getIdioms: function () {
    util.showLoading()
    var that = this
    var sequence = AV.Object.createWithoutData('Sequence', this.data.id)
    var query = new AV.Query('Idiom')
    query.equalTo('sequence', sequence)
    query.ascending('createdAt')
    query.find().then(idiomList => {
      util.hideLoading()
      idiomList.forEach(function (idiom) {
        var date = new Date(idiom.createdAt)
        var year = date.getFullYear()
        var month = date.getMonth() + 1
        var day = date.getDate()
        var hour = date.getHours()
        var minute = date.getMinutes()
        idiom.set("date", year + "-" + month + "-" + day + " " + that.pad(hour) + ":" + that.pad(minute))
        idiom.set("id", idiom.id)
      })
      that.setData({
        idiomList: idiomList
      })
      setTimeout(function () {
        that.setData({
          toView: idiomList[idiomList.length - 1].id
        })
      }, 100)
    }, err => {
      console.log("获取成语列表失败", error)
    })
  },

  /**
   * 两位数补零
   */
  pad: function (num) {
    return (Array(2).join(0) + num).slice(-2)
  },

  /**
   * 输入成语
   */
  onInput: function (e) {
    this.data.inputIdiom = e.detail.value
  },

  /**
   * 提交成语
   */
  onSubmit: function () {
    var that = this
    var inputIdiom = this.data.inputIdiom
    var idiomList = this.data.idiomList
    var lastIdiom = idiomList[idiomList.length - 1]
    if (inputIdiom.length == 4 && util.isChinese(inputIdiom)) {
      // 判断是否已有这个成语
      var hasThisIdiom = false
      for (var i = 0; i < idiomList.length; i++) {
        var idiom = idiomList[i]
        if (inputIdiom == idiom.get("value")) {
          hasThisIdiom = true
          break
        }
      }
      if (hasThisIdiom) {
        wx.showModal({
          showCancel: false,
          content: "已经有这个成语了哦",
        })
        return
      }
      util.showLoading()
      AV.Cloud.run('pinyin', { hanzi: inputIdiom }).then(function (pinyin) {
        util.hideLoading()
        that.data.inputIdiomPinyin = pinyin
        if (that.checkPinyin(pinyin[0], lastIdiom.get("pinyin")[3])) {
          that.saveIdiom()
        } else {
          wx.showModal({
            showCancel: false,
            content: "这个成语接不上哦",
          })
        }
      }, function (err) {
        console.log("转换拼音失败", err)
      })
    } else {
      wx.showModal({
        showCancel: false,
        content: "请输入四字成语",
      })
    }
  },

  /**
   * 检查拼音是否能接上
   */
  checkPinyin: function (pinyin1, pinyin2) {
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

  /**
   * 保存接龙成语
   */
  saveIdiom: function () {
    util.showLoading()
    var that = this
    var user = getApp().globalData.user
    var sequence = this.data.sequence
    var idiomList = this.data.idiomList

    var creator = {
      id: user.id,
      name: user.get("nickName"),
      img: user.get("avatarUrl")
    }

    sequence.set("lastIdiom", this.data.inputIdiom)
    sequence.set("idiomCount", idiomList.length + 1)
    if (sequence.get("type") == "all") {
      //保存最近的五个接龙用户头像
      var imgList = sequence.get("imgList")
      if (imgList == null) {
        imgList = []
      }
      if (!imgList.includes(user.get("avatarUrl"))) {
        imgList.push(user.get("avatarUrl"))
        if (imgList.length > 5) {
          imgList.splice(0, 1)
        }
        sequence.set("imgList", imgList)
      }
    }

    var idiom = new AV.Object("Idiom")
    idiom.set("value", this.data.inputIdiom)
    idiom.set("creator", creator)
    idiom.set("sequenceTitle", sequence.get("title"))
    idiom.set("pinyin", that.data.inputIdiomPinyin)
    idiom.set("idiomNum", that.data.idiomList.length + 1)
    idiom.set("sequence", sequence)

    idiom.save().then(function (res) {
      util.hideLoading()
      //成功保存记录
      getApp().globalData.refreshSequenceList = true
      wx.showToast({
        title: '创建成功'
      })
      that.setData({
        showInput: false
      })
      // 刷新列表
      that.getIdioms()
      console.log(new TextMessage(that.data.inputIdiom))
      // 发送消息
      mConversation.send(new TextMessage(that.data.inputIdiom))
    }, function (err) {
      util.hideLoading()
      console.log("保存成语失败", err)
    })

    if (sequence.get("type") == "all" && !this.data.isJoin) {
      var userSequenceMap = this.data.userSequenceMap
      userSequenceMap.set("join", true)
      userSequenceMap.save()
    }
  },

  /**
  * 分享
  */
  onShareAppMessage: function () {
    var that = this
    return {
      title: "一起来玩成语接龙！",
      path: 'pages/idiom-list/idiom-list?id=' + this.data.id,
      success(res) {
        that.getShareInfo(res.shareTickets[0])
      }
    }
  },

  /**
    * 生命周期函数--监听页面卸载
    */
  onUnload: function () {
    if (mClient != null && mConversation != null) {
      mClient.close()
    }
  },

  /**
   * 获取分享信息
   */
  getShareInfo: function (shareTicket) {
    var sequence = this.data.sequence
    if (sequence.get("type") != "group" || sequence.get("groupId").length > 0) {
      return
    }
    var user = getApp().globalData.user
    wx.getShareInfo({
      shareTicket: shareTicket,
      success(res) {
        var paramsJson = {
          sessionKey: user.attributes.authData.lc_weapp.session_key,
          encryptedData: res.encryptedData,
          iv: res.iv
        }
        AV.Cloud.run('decryptData', paramsJson).then(function (data) {
          //保存群id
          sequence.set("groupId", data.openGId)
          sequence.save()
        })
      }
    })
  }
})