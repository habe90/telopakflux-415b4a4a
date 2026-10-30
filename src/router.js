export const PAGE_ROUTES={
 'Početna':'/','Klijenti':'/clients','Poslovi':'/jobs','Raspored':'/schedule','Ponude':'/offers','Računi':'/invoices','Materijal':'/stock','Održavanje':'/maintenance','AI pomoćnik':'/assistant','Izvještaji':'/reports','Korisnici':'/users','Postavke':'/settings',
 'Owner pregled':'/owner','Firme':'/owner/companies','Svi korisnici':'/owner/users','Pretplate':'/owner/subscriptions','Sistem':'/owner/system','Audit zapis':'/owner/audit','Postavke aplikacije':'/owner/settings'
};
const ROUTE_PAGES=Object.fromEntries(Object.entries(PAGE_ROUTES).map(([k,v])=>[v,k]));
const DETAIL_BASE={clients:'Klijenti',jobs:'Poslovi',offers:'Ponude',invoices:'Računi',stock:'Materijal',maintenance:'Održavanje',users:'Korisnici'};
export function parseAppLocation(location=window.location){
 const path=(location.pathname||'/').replace(/\/+$/,'')||'/';
 const detail=path.match(/^\/(clients|jobs|offers|invoices|stock|maintenance|users)\/([^/]+)$/);
 if(detail)return {page:DETAIL_BASE[detail[1]],id:decodeURIComponent(detail[2]),path,params:new URLSearchParams(location.search)};
 return {page:ROUTE_PAGES[path]||'Početna',id:null,path:PAGE_ROUTES[ROUTE_PAGES[path]]?path:'/',params:new URLSearchParams(location.search)};
}
export function pageUrl(page,id=null,params=null){
 let base=PAGE_ROUTES[page]||'/';
 if(id&&['Klijenti','Poslovi','Ponude','Računi','Materijal','Održavanje','Korisnici'].includes(page))base+=`/${encodeURIComponent(id)}`;
 const query=params instanceof URLSearchParams?params.toString():params?new URLSearchParams(params).toString():'';
 return base+(query?`?${query}`:'');
}
export function navigateApp(page,{id=null,params=null,replace=false}={}){
 const url=pageUrl(page,id,params);window.history[replace?'replaceState':'pushState']({page,id},'',url);window.dispatchEvent(new PopStateEvent('popstate',{state:{page,id}}));return url;
}
export function replaceQuery(patch={}){
 const url=new URL(window.location.href);Object.entries(patch).forEach(([k,v])=>{if(v===undefined||v===null||v===''||v===false)url.searchParams.delete(k);else url.searchParams.set(k,String(v))});window.history.replaceState(window.history.state,'',url.pathname+(url.search?url.search:''));
}
export const requestedInternalUrl=()=>window.location.pathname+window.location.search;
