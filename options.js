const auto=document.getElementById('autoRefresh');
chrome.storage.local.get(['autoRefresh'],data=>{auto.checked=data.autoRefresh||false;});
auto.onchange=()=>chrome.storage.local.set({autoRefresh:auto.checked});
