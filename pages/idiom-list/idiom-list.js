const AV = require('../../utils/av-weapp-min')
var util = require('../../utils/util.js')

Page({

  /**
   * 页面的初始数据
   */
  data: {
    id: "",
    idiomList: []
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    console.log(options)
    this.data.id = options.id
    this.getIdioms()
  },

  getIdioms() {
    var that = this
    var Sequence = AV.Object.createWithoutData('Sequence', this.data.id)
    console.log(Sequence)
    var query = new AV.Query('Idiom');
    query.equalTo('dependent', Sequence);
    query.find().then(function (idiomList) {
      console.log(idiomList)
      that.setData({
        idiomList: idiomList
      })
    })
  }

})