const listEl=document.getElementById('list');
const statusEl=document.getElementById('status');
const refreshEl=document.getElementById('refresh');

function render(msg){
  const card=document.createElement('div');
  card.className='mail-card';
  card.innerHTML=`<strong>${msg.subject || '(no subject)'}</strong><br>
    <small>from: ${msg.from || '…'} • ${msg.date}</small>
    <hr style="margin:4px 0;border-color:#444;">
    <p>${msg.snippets||''}</p>`;
  const act=document.createElement('div'); act.className='card-actions';
  const otp = (msg.body.match(/\d{4,8}/)||[])[0];
  if(otp){
    act.innerHTML=`<button data-otp="${otp}" class="copy-btn">Copy OTP</button>
                    <button data-otp="${otp}" class="fill-btn">Fill OTP</button>`;
  }
  act.innerHTML+=`<button data-id="${msg.id}" class="view-btn">View Email</button>
                    <button data-id="${msg.id}" class="open-btn">Open Gmail</button>`;
  card.appendChild(act);
  listEl.appendChild(card);
}

function refresh(){
  statusEl.textContent='Loading…';
  listEl.innerHTML='';
  chrome.runtime.sendMessage({type:'fetch-otp'},res=>{
    if(!res || res.length===0){
      statusEl.textContent='No OTPs found.';
      return;
    }
    statusEl.textContent='';
    res.forEach(render);
  });
}

listEl.addEventListener('click',e=>{
  const target=e.target;
  if(target.matches('.copy-btn')){
    chrome.runtime.sendMessage({type:'copy-otp', otp:target.dataset.otp},r=>{});
    alert('OTP copied to clipboard');
  }
  if(target.matches('.fill-btn')){
    chrome.tabs.query({active:true,lastFocusedWindow:true},tabs=>{
      chrome.runtime.sendMessage({type:'fill-otp', otp:target.dataset.otp, tabId:tabs[0].id},r=>{});
      alert('OTP filled on current page');
    });
  }
  if(target.matches('.view-btn')){
    const win=window.open('','OTP '+target.dataset.id,'width=600,height=400');
    win.document.write(`<pre>${JSON.stringify(JSON.parse(atob(`placeholder`)),null,2)}</pre>`);
  }
  if(target.matches('.open-btn')){
    const url=`https://mail.google.com/mail/u/0/#inbox/${target.dataset.id}`;
    chrome.tabs.create({url});
  }
});

refreshEl.onclick=refresh;
refresh();
