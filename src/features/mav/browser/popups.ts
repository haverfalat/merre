import { MAV_WEB_ORIGIN } from 'mav-mobile-api';

const marker = 'merre-mav-popup';

export function popupOrigin(url: string): string | null {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && !parsed.username && !parsed.password
      ? parsed.origin : null;
  } catch {
    return null;
  }
}

export interface PopupPacket {
  kind: 'open' | 'navigate' | 'close' | 'message' | 'port-message' | 'ack';
  id: string;
  url?: string;
  name?: string;
  targetOrigin?: string;
  data?: unknown;
  port?: string;
  ports?: string[];
}

export function parsePopupPacket(message: string): PopupPacket | null {
  if (message.length > 150_000) return null;
  try {
    const value: unknown = JSON.parse(message);
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    const packet = value as Record<string, unknown>;
    if (packet.marker !== marker || typeof packet.id !== 'string' || packet.id.length > 128)
      return null;
    if (packet.kind === 'open' || packet.kind === 'navigate') {
      if (typeof packet.url !== 'string' || packet.url.length > 16_000) return null;
      if (packet.kind === 'open' &&
        (typeof packet.name !== 'string' || packet.name.length > 256)) return null;
    } else if (packet.kind === 'message' || packet.kind === 'port-message') {
      if (typeof packet.targetOrigin !== 'string' || packet.targetOrigin.length > 256) return null;
      if (packet.kind === 'port-message' &&
        (typeof packet.port !== 'string' || packet.port.length > 128)) return null;
      if (packet.ports !== undefined && (!Array.isArray(packet.ports) || packet.ports.length > 8 ||
        packet.ports.some(port => typeof port !== 'string' || port.length > 128))) return null;
    } else if (packet.kind !== 'close' && packet.kind !== 'ack') return null;
    return packet as unknown as PopupPacket;
  } catch {
    return null;
  }
}

export function popupDelivery(
  id: string,
  origin: string,
  data: unknown,
  targetOrigin: string,
  port?: string,
  ports?: string[],
): string {
  return `window.__merreAuthPopup?.receive(${JSON.stringify({
    kind: port ? 'port-message' : 'message', id, origin, data, targetOrigin, port, ports,
  })});true;`;
}

export function popupClosed(id: string): string {
  return `window.__merreAuthPopup?.closed(${JSON.stringify(id)});true;`;
}

const PORT_RELAY = `function(id,side,send){
  var ports=Object.create(null),sequence=0;
  function register(port,key,origin,front){
    var entry={port:port,origin:origin,front:front,flush:null};
    ports[key]=entry;
    port.addEventListener('message',function(event){
      if(event.data&&event.data.__merrePortFlush===key){
        if(entry.flush){entry.flush();entry.flush=null;}
        return;
      }
      send({kind:'port-message',id:id,port:key,targetOrigin:entry.origin,
        data:event.data,ports:outgoing(event.ports,entry.origin)});
    });
    port.start();
  }
  function outgoing(transfer,origin){
    if(!transfer)return [];
    if(transfer.length>8)throw new DOMException('Too many message ports','DataCloneError');
    return Array.from(transfer,function(port){
      if(!(port instanceof MessagePort))throw new DOMException('Unsupported transferable','DataCloneError');
      var key=side+'-'+String(++sequence);
      register(port,key,origin,null);
      return key;
    });
  }
  function incoming(keys,origin){
    return (keys||[]).map(function(key){
      if(ports[key])throw new DOMException('Duplicate message port','DataCloneError');
      var channel=new MessageChannel();
      register(channel.port2,key,origin,channel.port1);
      return channel.port1;
    });
  }
  return {
    postMessage:function(data,target,transfer){
      var origin=typeof target==='string'?target:target&&target.targetOrigin||location.origin;
      transfer=transfer||target&&target.transfer;
      send({kind:'message',id:id,data:data,targetOrigin:origin,ports:outgoing(transfer,origin)});
    },
    receive:function(packet,source){
      if(packet.kind==='port-message'){
        var entry=ports[packet.port];
        if(!entry||!(entry.origin==='*'||entry.origin===packet.origin))return;
        entry.port.postMessage(packet.data,incoming(packet.ports,packet.origin));
      }else{
        var event=new MessageEvent('message',{
          data:packet.data,origin:packet.origin,ports:incoming(packet.ports,packet.origin)
        });
        Object.defineProperty(event,'source',{value:source});
        window.dispatchEvent(event);
      }
    },
    close:function(done){
      var entries=Object.keys(ports).map(function(key){return {key:key,entry:ports[key]};})
        .filter(function(item){return !!item.entry.front;});
      if(!entries.length){done();return;}
      var remaining=entries.length,closed=false;
      function finish(){if(!closed){closed=true;done();}}
      function flushed(){if(--remaining===0)finish();}
      setTimeout(finish,500);
      entries.forEach(function(item){
        item.entry.flush=flushed;
        try{item.entry.front.postMessage({__merrePortFlush:item.key});}
        catch(error){flushed();}
      });
    }
  };
}`;

export const POPUP_PARENT_SCRIPT = `
(function(){
  if(location.origin!==${JSON.stringify(MAV_WEB_ORIGIN)}||window.__merreAuthPopup)return;
  var windows=Object.create(null),sequence=0;
  var createRelay=${PORT_RELAY};
  function send(packet){
    packet.marker=${JSON.stringify(marker)};
    window.ReactNativeWebView.postMessage(JSON.stringify(packet));
  }
  function receive(packet){
    var popup=windows[packet.id];
    if(!popup||popup.closed||!(packet.targetOrigin==='*'||packet.targetOrigin===location.origin))return;
    popup.relay.receive(packet,popup);
    send({kind:'ack',id:packet.id});
  }
  window.__merreAuthPopup={
    receive:receive,
    closed:function(id){if(windows[id])windows[id].closed=true;}
  };
  window.open=function(url,name){
    name=String(name||'_blank');
    var id,popup;
    if(name!=='_blank'){
      for(var key in windows){
        if(windows[key].name===name&&!windows[key].closed){id=key;popup=windows[key];break;}
      }
    }
    if(popup){if(url)popup.location.href=String(url);return popup;}
    id=String(++sequence)+'-'+String(Date.now());
    var currentUrl=String(url||'about:blank');
    var address={
      assign:function(value){address.href=value;},
      replace:function(value){address.href=value;},
      toString:function(){return currentUrl;}
    };
    Object.defineProperty(address,'href',{
      get:function(){return currentUrl;},
      set:function(value){
        currentUrl=new URL(String(value),location.href).href;
        send({kind:'navigate',id:id,url:currentUrl});
      }
    });
    popup={
      name:name,closed:false,
      focus:function(){},blur:function(){},
      close:function(){
        if(!popup.closed){popup.closed=true;send({kind:'close',id:id});}
      },
      relay:createRelay(id,'main',send)
    };
    popup.postMessage=function(data,target,transfer){popup.relay.postMessage(data,target,transfer);};
    Object.defineProperty(popup,'location',{
      get:function(){return address;},set:function(value){address.href=value;}
    });
    popup.window=popup;popup.self=popup;popup.top=popup;popup.parent=popup;
    windows[id]=popup;
    send({kind:'open',id:id,name:name,url:currentUrl});
    return popup;
  };
})();true;`;

export function popupChildScript(id: string, name: string): string {
  return `
(function(){
  if(window.__merreAuthPopup)return;
  var id=${JSON.stringify(id)};
  function send(packet){
    packet.marker=${JSON.stringify(marker)};packet.id=id;
    window.ReactNativeWebView.postMessage(JSON.stringify(packet));
  }
  var relay=(${PORT_RELAY})(id,'popup',send);
  var opener={
    closed:false,
    postMessage:relay.postMessage,
    focus:function(){}
  };
  opener.window=opener;opener.self=opener;opener.top=opener;opener.parent=opener;
  Object.defineProperty(window,'opener',{configurable:true,get:function(){return opener;}});
  if(!window.name)window.name=${JSON.stringify(name)};
  function preserveFormTarget(form,submitter){
    var override=submitter&&submitter.getAttribute('formtarget');
    var target=override!=null?override:form.getAttribute('target');
    if(target===null){
      var base=document.querySelector('base[target]');
      target=base?base.getAttribute('target'):'';
    }
    if(!target||['_self','_parent','_top'].includes(target.toLowerCase())||target===window.name)return;
    if(target.toLowerCase()!=='_blank'){
      var frames=document.querySelectorAll('iframe[name],frame[name]');
      for(var index=0;index<frames.length;index++){
        if(frames[index].getAttribute('name')===target)return;
      }
    }
    if(override!=null)submitter.setAttribute('formtarget','_self');
    else form.setAttribute('target','_self');
  }
  document.addEventListener('submit',function(event){
    if(event.target instanceof HTMLFormElement)preserveFormTarget(event.target,event.submitter);
  },true);
  var submit=HTMLFormElement.prototype.submit;
  HTMLFormElement.prototype.submit=function(){
    preserveFormTarget(this,null);return submit.apply(this,arguments);
  };
  window.close=function(){relay.close(function(){send({kind:'close'});});};
  window.__merreAuthPopup={
    receive:function(packet){
      if(packet.id!==id||!(packet.targetOrigin==='*'||packet.targetOrigin===location.origin))return;
      relay.receive(packet,opener);
    }
  };
})();true;`;
}
