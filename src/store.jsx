import React,{createContext,useContext,useEffect,useRef,useState} from 'react';

const DataContext=createContext(null);
const resources={clients:'clients',jobs:'jobs',offers:'offers',invoices:'invoices',stock:'stock',maintenance:'maintenance'};
const empty={clients:[],jobs:[],offers:[],invoices:[],stock:[],maintenance:[]};

async function request(path,options={}){
 const r=await fetch(`/api/${path}`,{credentials:'include',headers:options.body?{'Content-Type':'application/json'}:undefined,...options});
 const data=await r.json().catch(()=>({}));
 if(!r.ok)throw new Error(data.error||`Zahtjev nije uspio (HTTP ${r.status}).`);
 return data;
}

export function DataProvider({children}){
 const[data,setData]=useState(empty),[loading,setLoading]=useState(true),[backendOnline,setBackendOnline]=useState(true),[error,setError]=useState('');
 const dataRef=useRef(data);useEffect(()=>{dataRef.current=data},[data]);
 const load=async()=>{setLoading(true);setError('');try{const values=await Promise.all(Object.values(resources).map(x=>request(x)));const next={};Object.keys(resources).forEach((k,i)=>next[k]=Array.isArray(values[i])?values[i]:[]);setData(next);setBackendOnline(true)}catch(e){setData(empty);setBackendOnline(false);setError(e.message)}finally{setLoading(false)}};
 useEffect(()=>{load()},[]);
 const setter=key=>async updater=>{
  const previous=dataRef.current[key];
  const next=typeof updater==='function'?updater(previous):updater;
  setData(d=>({...d,[key]:next}));
  try{
   const prevById=new Map(previous.map(x=>[String(x.id),x]));
   const nextById=new Map(next.map(x=>[String(x.id),x]));
   for(const old of previous)if(!nextById.has(String(old.id)))await request(`${resources[key]}/${old.id}`,{method:'DELETE'});
   const saved=[];
   for(const item of next){
    const old=prevById.get(String(item.id));
    if(!old||String(item.id).startsWith('tmp-')||Number(item.id)>1e11){saved.push(await request(resources[key],{method:'POST',body:JSON.stringify(item)}))}
    else if(JSON.stringify(old)!==JSON.stringify(item)){saved.push(await request(`${resources[key]}/${item.id}`,{method:'PUT',body:JSON.stringify(item)}))}
   }
   if(saved.length)await load();
   setBackendOnline(true);setError('');
   return saved;
  }catch(e){setData(d=>({...d,[key]:previous}));setBackendOnline(false);setError(e.message);throw e}
 };
 const documentRequest=async(kind,method,payload,id)=>{
  const resource=kind==='offer'?'offers':'invoices';
  const saved=await request(`${resource}${id?`/${id}`:''}`,{method,body:payload?JSON.stringify(payload):undefined});
  setData(d=>({...d,[resource]:method==='POST'?[saved,...d[resource]]:method==='PUT'?d[resource].map(x=>String(x.id)===String(id)?saved:x):d[resource].filter(x=>String(x.id)!==String(id))}));
  setBackendOnline(true);setError('');return saved;
 };
 const createDocument=(kind,payload)=>documentRequest(kind,'POST',payload);
 const updateDocument=(kind,id,payload)=>documentRequest(kind,'PUT',payload,id);
 const deleteDocument=(kind,id)=>documentRequest(kind,'DELETE',null,id);
 const value={...data,setClients:setter('clients'),setJobs:setter('jobs'),setOffers:setter('offers'),setInvoices:setter('invoices'),setStock:setter('stock'),setMaintenance:setter('maintenance'),createDocument,updateDocument,deleteDocument,loading,backendOnline,error,reload:load};
 return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}
export function useData(){return useContext(DataContext)}
