const API = (() => {
  const getToken=()=>localStorage.getItem('sim_sppd_token')||'';
  async function request(action,{method='GET',data=null,params={}}={}){
    if(!CONFIG.GAS_URL || CONFIG.GAS_URL.includes('PASTE_URL')) throw new Error('GAS_URL belum diisi di js/config.js');
    const ctrl=new AbortController(), timer=setTimeout(()=>ctrl.abort(),CONFIG.API_TIMEOUT_MS);
    try{
      let res;
      if(method==='GET'){
        const q=new URLSearchParams({action,token:getToken(),...params});
        res=await fetch(`${CONFIG.GAS_URL}?${q}`,{signal:ctrl.signal,redirect:'follow'});
      }else{
        res=await fetch(CONFIG.GAS_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({action,token:getToken(),data}),signal:ctrl.signal,redirect:'follow'});
      }
      const json=await res.json();
      if(!json.success) throw new Error(json.message||'Permintaan gagal.');
      return json;
    } finally {clearTimeout(timer);}
  }
  return {
    login:(email,password)=>request('auth.login',{method:'POST',data:{email,password}}),
    logout:()=>request('auth.logout',{method:'POST'}),
    bootstrap:()=>request('bootstrap'),
    dashboard:()=>request('dashboard'),
    pengajuanList:()=>request('pengajuan.list'),
    saveDraft:data=>request('pengajuan.saveDraft',{method:'POST',data}),
    submitPengajuan:data=>request('pengajuan.submit',{method:'POST',data}),
    verify:data=>request('pengajuan.verify',{method:'POST',data})
  };
})();