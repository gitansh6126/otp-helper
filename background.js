const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://mail.google.com'
];
const QUERY_KEYWORDS = ['OTP','verification','verify','confirm','activation',
  'security code','one-time code']; // case-insensitive

async function getAccessToken(){
  return chrome.identity.getAuthToken({interactive:true});
}

function buildGmailQuery(domain){
  const keywordPart = QUERY_KEYWORDS.map(k => `"${k}"`).join(' ');
  const domainPart = domain ? `to:${domain} OR from:${domain}` : '';
  return `${keywordPart} ${domainPart} is:unread`.trim();
}

async function fetchOtpMessages(){
  const token = await getAccessToken();
  const currentTab = await chrome.tabs.query({active:true, lastFocusedWindow:true});
  const domain = (new URL(currentTab[0].url)).hostname;

  const query = buildGmailQuery(domain);
  const res = await fetch(`https://www.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}`,{
    headers:{Authorization:`Bearer ${token}`}
  });

  const data = await res.json();
  if(!data.messages) return [];

  const detailed = await Promise.all(data.messages.slice(0,20).map(async msg=>{
    const m = await fetch(`https://www.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`,{
      headers:{Authorization:`Bearer ${token}`}}
    ).then(r=>r.json());
    const headers = {};
    m.payload.headers.forEach(h=>headers[h.name.toLowerCase()]=h.value);
    const body = getPlainBody(m.payload);
    return {
      id:msg.id,
      from:headers['from']||'',
      subject:headers['subject']||'',
      date:new Date(headers['date']||0).toLocaleString(),
      body,
      snippets:m.snippet||''
    };
  }));
  return detailed;
}

function getPlainBody(payload){
  if(payload.parts){
    const p = payload.parts.find(x=>x.mimeType==='text/plain');
    if(p&&p.body.data) return atob(p.body.data.replace(/-/g,'+').replace(/_/g,'/'));
    return payload.parts.map(getPlainBody).find(Boolean) || '';
  }
  if(payload.body.data){
    return atob(payload.body.data.replace(/-/g,'+').replace(/_/g,'/'));
  }
  return '';
}

function extractOtp(text){
  const patterns = [
    /\b(\d{4,8})\b/g,
    /(?<=\bcode is\b\s)\d{4,8}\b/g,
    /(?<=\bverification code\b\s*)\d{4,8}\b/g,
  ];
  const matches = patterns.flatMap(p=>{
    const r=[];
    let m;
    while((m=p.exec(text))!==null) r.push(m[1]);
    return r;
  });
  return [...new Set(matches)];
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse)=>{
  if(!msg.type) return false;
  switch(msg.type){
    case 'fetch-otp':
      fetchOtpMessages().then(sendResponse);
      break;
    case 'extract-otp':
      sendResponse(extractOtp(msg.body));
      break;
    case 'fill-otp':
      chrome.scripting.executeScript({
        target:{tabId:msg.tabId, allFrames:true},
        func: (otp)=>{
          const inputs = Array.from(document.querySelectorAll('input')).filter(i=>i.type==='text'&&i.value.length<5);
          if(inputs.length===0){
            alert('No suitable OTP fields found');
            return;
          }
          if(inputs.length===1 || otp.length===inputs.length){
            otp.split('').forEach((d,idx)=>inputs[idx++].value=d);
          }else{
            let idx=0;
            otp.split('').forEach(d=>{if(idx<inputs.length) inputs[idx++].value=d;});
          }
          const ev=new Event('change',{bubbles:true});
          inputs.forEach(i=>i.dispatchEvent(ev));
        },
        args:[msg.otp]
      }).then(()=>sendResponse({ok:true}));
      break;
    case 'copy-otp':
      navigator.clipboard.writeText(msg.otp).then(()=>sendResponse({ok:true}));
      break;
  }
  return true;
});
