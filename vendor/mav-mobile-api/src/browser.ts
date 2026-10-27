export const MAV_LOGIN_URL = 'https://jegy.mav.hu/bejelentkezes';
export const MAV_WEB_ORIGIN = 'https://jegy.mav.hu';

export const MAV_SESSION_BRIDGE = `
(function(){
  if(window.location.origin!=='https://jegy.mav.hu'||window.__mavMobileSessionBridge)return true;
  window.__mavMobileSessionBridge=true;
  var timer=setInterval(function(){
    try{
      var raw=sessionStorage.getItem('userData')||localStorage.getItem('userData');
      if(!raw)return;
      var user=JSON.parse(raw);
      if(typeof user.userEmail!=='string'||typeof user.userTokenXml!=='string'||!user.userTokenXml)return;
      if(!window.ReactNativeWebView)return;
      clearInterval(timer);
      window.ReactNativeWebView.postMessage(JSON.stringify({provider:'mav-web',email:user.userEmail,userTokenXml:user.userTokenXml}));
    }catch(error){}
  },500);
  return true;
})();true;`;
