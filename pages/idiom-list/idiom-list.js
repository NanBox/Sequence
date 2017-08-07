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
    inputIdiom: "",
    inputIdiomPinyin: [],
    userSequenceMap: null,
    isJoin: false,
    canInput: false,
    isLastCreator: false,
    canSend: false,
    toView: "",
    inputValue: "",
    currentPage: 0,
    hasNextPage: true,
    loadingNextPage: false
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
      util.showLoading()
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
    util.showLoading()
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
      that.setData({
        sequence: sequence
      })
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
          that.setData({
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
  setAllTypeRelation: function () {
    this.setData({
      canInput: true
    })
    this.setFollowRelation()
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
      imgList.push(user.get("avatarUrl"))
      sequence.set("imgList", imgList)
      sequence.save()
      getApp().globalData.refreshSequenceList = true
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
    var sequence = this.data.sequence
    var userSequenceMap
    if (this.data.userSequenceMap != null) {
      userSequenceMap = this.data.userSequenceMap
      userSequenceMap.set("join", true)
    } else {
      var user = getApp().globalData.user
      var userSequenceMap = new AV.Object('UserSequenceMap')
      userSequenceMap.set('user', user)
      userSequenceMap.set('sequence', sequence)
      userSequenceMap.set('join', true)
    }
    userSequenceMap.save().then(userSequenceMap => {
      that.data.userSequenceMap = userSequenceMap
      // 更新参与人数
      var query = new AV.Query('UserSequenceMap')
      query.equalTo('sequence', sequence)
      query.equalTo('join', true)
      query.count().then(count => {
        sequence.set("joinCount", count)
        sequence.save()
        if (sequence.get("type") == "all") {
          that.setData({
            sequence: sequence
          })
        }
      }, error => {
        util.hideLoading()
        throw new AV.Cloud.Error('查询参与人数失败')
      })
    })
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
    userSequenceMap.save().then(userSequenceMap => {
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
            util.hideLoading()
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
          util.hideLoading()
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
    this.setData({
      loadingNextPage: true
    })
    var pageSize = 10
    var that = this
    var user = getApp().globalData.user
    var currentPage = this.data.currentPage
    var params = {
      userId: user.id,
      sequenceId: this.data.id,
      page: currentPage + 1
    }
    AV.Cloud
      .run('getIdioms', params)
      .then(idiomList => {
        util.hideLoading()
        that.data.currentPage = currentPage + 1
        var hasNextPage
        if (idiomList != null && idiomList.length == pageSize) {
          hasNextPage = true
        } else {
          hasNextPage = false
        }
        var allIdiomList
        if (that.data.currentPage == 1) {
          allIdiomList = idiomList
        } else {
          allIdiomList = idiomList.concat(that.data.idiomList)
        }
        var isLastCreator = false
        if (allIdiomList[allIdiomList.length - 1].creator.id == user.id) {
          isLastCreator = true
        }
        that.setData({
          idiomList: allIdiomList,
          isLastCreator: isLastCreator,
          hasNextPage: hasNextPage,
          loadingNextPage: false
        })
        if (that.data.currentPage == 1) {
          setTimeout(function () {
            that.setData({
              toView: idiomList[idiomList.length - 1].objectId
            })
          }, 500)
        } else {
          setTimeout(function () {
            that.setData({
              toView: idiomList[idiomList.length - 1].objectId
            })
          }, 50)
        }
      }, err => {
        util.hideLoading()
        console.log("获取成语列表失败", err)
        that.setData({
          hasNextPage: true,
          loadingNextPage: false
        })
      })
  },

  /**
   * 两位数补零
   */
  pad: function (num) {
    return (Array(2).join(0) + num).slice(-2)
  },

  /**
   * 列表滚动到顶部
   */
  scrollToTop: function () {
    if (!this.data.hasNextPage || this.data.loadingNextPage) {
      return
    }
    this.getIdioms()
  },

  /**
   * 点赞
   */
  onLike: function (e) {
    var idiomList = this.data.idiomList
    var index = e.currentTarget.id
    var idiom = idiomList[index]
    var isLikeChange = false
    if (idiom.likeStatus == 1) {
      return
    }
    // 更新赞、踩页面数据
    if (idiom.likeStatus == 2) {
      isLikeChange = true
      var unLikeCount = 0
      if (idiom.unLikeCount != null && idiom.unLikeCount > 0) {
        likeCount = idiom.unLikeCount - 1
      }
      idiom.unLikeCount = unLikeCount
    }
    idiom.likeStatus = 1
    var likeCount = 1
    if (idiom.likeCount != null && idiom.likeCount > 0) {
      likeCount = idiom.likeCount + 1
    }
    idiom.likeCount = likeCount
    this.setData({
      idiomList: idiomList
    })
    // 更新数据库
    var user = getApp().globalData.user
    var params = {
      userId: user.id,
      idiomId: idiom.objectId
    }
    AV.Cloud.run('like', params)
  },

  /**
   * 点踩
   */
  onUnLike: function (e) {
    var idiomList = this.data.idiomList
    var index = e.currentTarget.id
    var idiom = idiomList[index]
    var isLikeChange = false
    if (idiom.likeStatus == 2) {
      return
    }
    // 更新赞、踩页面数据
    if (idiom.likeCount == 1) {
      isLikeChange = true
      var likeCount = 0
      if (idiom.likeCount != null && idiom.likeCount > 0) {
        likeCount = idiom.likeCount - 1
      }
      idiom.likeCount = likeCount
    }
    idiom.likeStatus = 2
    var unLikeCount = 1
    if (idiom.unLikeCount != null && idiom.unLikeCount > 0) {
      unLikeCount = idiom.unLikeCount + 1
    }
    idiom.unLikeCount = unLikeCount
    this.setData({
      idiomList: idiomList
    })
    // 更新数据库
    var user = getApp().globalData.user
    var params = {
      userId: user.id,
      idiomId: idiom.objectId
    }
    AV.Cloud.run('unlike', params)
  },

  /**
   * 输入成语
   */
  onInput: function (e) {
    var inputIdiom = e.detail.value
    this.data.inputIdiom = e.detail.value
    var canSend = false
    if (inputIdiom.length == 4 &&
      util.isChinese(inputIdiom) &&
      !this.data.isLastCreator &&
      this.data.canInput) {
      this.data.inputIdiom = e.detail.value
      canSend = true
    }
    if (this.data.canSend != canSend) {
      this.setData({
        canSend: canSend
      })
    }
  },

  /**
   * 提交成语
   */
  onSubmit: function () {
    if (!this.data.canSend) {
      return
    }
    util.showLoading()
    var that = this
    var sequence = this.data.sequence
    var inputIdiom = this.data.inputIdiom
    var idiomList = this.data.idiomList
    var lastIdiom = idiomList[idiomList.length - 1]
    // 判断是否已有这个成语
    var query = new AV.Query('Idiom')
    query.equalTo("value", inputIdiom)
    query.equalTo('sequence', sequence)
    query.descending('createdAt')
    query.count().then(count => {
      if (count > 0) {
        util.hideLoading()
        wx.showModal({
          showCancel: false,
          content: "已经有这条成语了哦",
        })
      } else {
        AV.Cloud.run('pinyin', { hanzi: inputIdiom }).then(function (pinyin) {
          util.hideLoading()
          that.data.inputIdiomPinyin = pinyin
          if (that.checkPinyin(pinyin[0], lastIdiom.pinyin[3])) {
            that.saveIdiom()
          } else {
            wx.showModal({
              showCancel: false,
              content: "这个成语接不上哦",
            })
          }
        }, function (err) {
          util.hideLoading()
          console.log("转换拼音失败", err)
        })
      }
    })
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

    //检查最后一条成语是否和当前一致
    var query = new AV.Query('Idiom')
    query.equalTo('sequence', sequence)
    query.descending('createdAt')
    query.first().then(idiom => {
      if (idiom.objectId != idiomList[idiomList.length - 1].objectId) {
        wx.showModal({
          showCancel: false,
          content: "列表有更新"
        })
        that.getIdioms()
      } else {
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
            that.setData({
              sequence: sequence
            })
          }
        }

        var idiom = new AV.Object("Idiom")
        idiom.set("value", this.data.inputIdiom)
        idiom.set("creator", creator)
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
          that.data.InputIdiom = ""
          that.setData({
            isLastCreator: true,
            canSend: false,
            inputValue: ""
          })
          // 刷新列表
          that.getIdioms()
          // 发送消息
          mConversation.send(new TextMessage(that.data.inputIdiom))
        }, function (err) {
          util.hideLoading()
          console.log("保存成语失败", err)
        })

        if (sequence.get("type") == "all" && !this.data.isJoin) {
          that.setJoinRelation()
        }
      }
    }, err => {
      util.hideLoading()
      console.log("查询最后一条成语失败", err)
    })
  },

  /**
   * 点击右上角刷新
   */
  onRefresh: function () {
    var sequence = this.data.sequence
    if (sequence.get("type") == "all" ||
      (sequence.get("type") == "two" && sequence.get("imgList").length < 2)) {
      this.getSequence()
    }
    this.data.currentPage = 0
    this.data.hasNextPage = true
    util.showLoading()
    this.getIdioms()
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
   * 获取分享信息
   */
  getShareInfo: function (shareTicket) {
    var sequence = this.data.sequence
    if (sequence.get("type") != "group" ||
      sequence.get("groupId").length > 0) {
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
  },

  /**
  * 生命周期函数--监听页面卸载
  */
  onUnload: function () {
    if (mClient != null) {
      mClient.close()
    }
  },
})