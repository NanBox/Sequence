const AV = require('./utils/av-weapp-min.js')

AV.init({
  appId: 'MArHq4pqWa8HeVXdUge3o98t-gzGzoHsz',
  appKey: 'cpbz3mExGhEvTJ3HMMKj6lBf',
});

App({
  onLaunch: function () {

  },

  globalData: {
    user: null,
    shareTicket: "",
    updateUserSuccess: false,
    refreshSequenceList: false
  }
})
