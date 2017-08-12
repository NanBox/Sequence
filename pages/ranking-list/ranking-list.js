const AV = require('../../libs/av-weapp-min')
const util = require('../../utils/util.js')

Page({

  /**
   * 页面的初始数据
   */
  data: {
    sequenceList: [],
    selectSequence: true,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.getAllSequenceList()
  },

  getAllSequenceList: function () {
    util.showLoading()
    var that = this
    var query = new AV.Query('Sequence')
    query.descending('idiomCount')
    query.limit(10)
    query.find().then(function (sequenceList) {
      util.hideLoading()
      if (sequenceList.length > 0) {
        that.setData({
          sequenceList: sequenceList
        })
      }
    }, err => {
      util.hideLoading()
      console.log("获取接龙总榜失败", err)
    })
  }
})