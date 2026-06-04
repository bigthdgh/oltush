import React,{useState,useEffect,useMemo}from'react';
import{format}from'date-fns';
import{motion,AnimatePresence}from'framer-motion';
import{useNavigate}from'react-router-dom';
import{Home,Flame,Droplets,Trees,Car,Tent}from'lucide-react';
import{fetchBusyDates}from'../api';
import{getItemCoverPhoto}from'../utils/photos';
import{springSoft,EASE_OUT_QUINT}from'../animations';

const typeConfig={house:{color:'#3d5a36',icon:Home,label:'Домик',bg:'#e3ebe0'},sauna:{color:'#5c4a32',icon:Flame,label:'Баня',bg:'#f0e6d6'},tub:{color:'#0369a1',icon:Droplets,label:'Купель',bg:'#e0f2fe'}};

// Layout: viewBox 0 0 500 400
const BASE_LAYOUT={
river:[{x:0,y:340},{x:100,y:330},{x:200,y:345},{x:300,y:335},{x:400,y:350},{x:500,y:340}],
lake:[{cx:420,cy:360,rx:70,ry:30}],
forest:[{cx:60,cy:60,r:55},{cx:440,cy:80,r:50},{cx:80,cy:280,r:45}],
paths:[{d:'M 160 240 L 260 240 L 260 160 L 340 160'},{d:'M 260 240 L 260 320 L 180 320'},{d:'M 260 160 L 260 100 L 200 100'},{d:'M 160 240 L 100 240'}],
parking:{x:60,y:180,w:50,h:30},
 gazebo:{x:340,y:100,w:40,h:30},
};

const positions=[
{x:180,y:100},{x:220,y:100},{x:180,y:140},{x:220,y:140},{x:180,y:180},{x:220,y:180}, // houses 1-6 (2 rows x 3)
{x:340,y:140},{x:380,y:140}, // houses 7-8
{x:340,y:240}, // sauna
{x:380,y:240}, // tub
];

function isTodayBusy(busyDates){
const today=format(new Date(),'yyyy-MM-dd');
return busyDates.some(d=>d===today);
}

export default function BaseMap({items}){
const navigate=useNavigate();
const[hovered,setHovered]=useState(null);
const[busyMap,setBusyMap]=useState({});

useEffect(()=>{
if(!items.length)return;
const month=format(new Date(),'yyyy-MM');
Promise.all(items.map(i=>fetchBusyDates(i.id,month).then(r=>({id:i.id,dates:r.data?.dates||[]})).catch(()=>({id:i.id,dates:[]}))))
.then(res=>{const m={};res.forEach(r=>m[r.id]=r.dates);setBusyMap(m);});
},[items]);

const placedItems=useMemo(()=>items.slice(0,positions.length).map((item,i)=>({...item,...positions[i]})),[items]);

const handleEnter=(item)=>{
setHovered(item);
};

return(
<motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.3,duration:0.6,ease:EASE_OUT_QUINT}} className="mb-8 relative">
<div className="flex items-center gap-2 mb-3"><Trees size={18} className="text-forest-500"/><h2 className="text-lg font-bold text-forest-900 tracking-tight">План территории</h2></div>
<div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-emerald-50 to-forest-50 border border-forest-100 shadow-lg">
<svg viewBox="0 0 500 400" className="w-full h-auto" style={{aspectRatio:'5/4'}}>
<defs>
<pattern id="grass" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse"><rect width="20" height="20" fill="#f1f8f4"/><circle cx="10" cy="10" r="1" fill="#d4edda"/></pattern>
<linearGradient id="riverGrad" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#bfdbfe"/><stop offset="50%" stopColor="#93c5fd"/><stop offset="100%" stopColor="#bfdbfe"/></linearGradient>
<filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="#0d2b1e" floodOpacity="0.08"/></filter>
</defs>
<rect width="500" height="400" fill="url(#grass)"/>

{/* Lake */}
{BASE_LAYOUT.lake.map((l,i)=>(<ellipse key={i} cx={l.cx} cy={l.cy} rx={l.rx} ry={l.ry} fill="#dbeafe" opacity="0.8" stroke="#bfdbfe" strokeWidth="2"/>))}
<text x="420" y="370" textAnchor="middle" fill="#60a5fa" style={{fontSize:'9px',fontWeight:700}}>Олтушское озеро</text>

{/* River */}
<path d={`M ${BASE_LAYOUT.river.map(p=>`${p.x} ${p.y}`).join(' L ')}`} fill="none" stroke="url(#riverGrad)" strokeWidth="14" strokeLinecap="round" opacity="0.7"/>
<path d={`M ${BASE_LAYOUT.river.map(p=>`${p.x} ${p.y}`).join(' L ')}`} fill="none" stroke="#e0f2fe" strokeWidth="5" strokeLinecap="round" strokeDasharray="8 12" opacity="0.8"><animate attributeName="stroke-dashoffset" from="0" to="20" dur="2s" repeatCount="indefinite"/></path>

{/* Forests */}
{BASE_LAYOUT.forest.map((f,i)=>(<g key={i} filter="url(#softShadow)"><circle cx={f.cx} cy={f.cy} r={f.r} fill="#bbf7d0" opacity="0.5"/><circle cx={f.cx} cy={f.cy} r={f.r*0.7} fill="#86efac" opacity="0.3"/></g>))}

{/* Paths */}
{BASE_LAYOUT.paths.map((p,i)=>(<path key={i} d={p.d} fill="none" stroke="#cbd5e1" strokeWidth="5" strokeLinecap="round" strokeDasharray="4 4" filter="url(#softShadow)"/>))}

{/* Parking */}
<g transform={`translate(${BASE_LAYOUT.parking.x},${BASE_LAYOUT.parking.y})`}><rect width={BASE_LAYOUT.parking.w} height={BASE_LAYOUT.parking.h} rx="6" fill="#e5e7eb" stroke="#d1d5db" strokeWidth="1"/><text x={BASE_LAYOUT.parking.w/2} y={BASE_LAYOUT.parking.h/2+3} textAnchor="middle" fill="#6b7280" style={{fontSize:'8px',fontWeight:700}}><tspan dy="-4">P</tspan></text><g transform={`translate(${BASE_LAYOUT.parking.w/2-5},${BASE_LAYOUT.parking.h/2+2})`}><Car size={10} color="#9ca3af"/></g></g>
<text x={BASE_LAYOUT.parking.x+BASE_LAYOUT.parking.w/2} y={BASE_LAYOUT.parking.y-4} textAnchor="middle" fill="#9ca3af" style={{fontSize:'8px',fontWeight:600}}>Парковка</text>

{/* Gazebo */}
<g transform={`translate(${BASE_LAYOUT.gazebo.x},${BASE_LAYOUT.gazebo.y})`}><rect width={BASE_LAYOUT.gazebo.w} height={BASE_LAYOUT.gazebo.h} rx="6" fill="#fef3c7" stroke="#fde68a" strokeWidth="1"/><g transform={`translate(${BASE_LAYOUT.gazebo.w/2-6},${BASE_LAYOUT.gazebo.h/2-6})`}><Tent size={12} color="#d97706"/></g></g>
<text x={BASE_LAYOUT.gazebo.x+BASE_LAYOUT.gazebo.w/2} y={BASE_LAYOUT.gazebo.y-4} textAnchor="middle" fill="#d97706" style={{fontSize:'8px',fontWeight:600}}>Беседка</text>

{/* Items */}
{placedItems.map((item,i)=>{
const cfg=typeConfig[item.type]||typeConfig.house;
const isHouse=item.type==='house';
const size=isHouse?32:26;
const cover=getItemCoverPhoto(item);
const busy=busyMap[item.id]||[];
const isBusy=isTodayBusy(busy);
return(
<motion.g key={item.id} className="cursor-pointer" onClick={()=>navigate(`/item/${item.id}`)} transform={`translate(${item.x},${item.y})`}
onMouseEnter={()=>setHovered(item)} onMouseLeave={()=>setHovered(null)}
whileHover={{scale:1.25}} transition={springSoft} style={{transformOrigin:'center'}}>
<title>{item.name}</title>
<motion.circle cx={0} cy={0} r={size+6} fill={cfg.color} opacity={0.15} animate={{r:[size+6,size+14,size+6],opacity:[0.15,0.05,0.15]}} transition={{duration:2.5,repeat:Infinity,ease:'easeInOut',delay:i*0.2}}/>
<defs><clipPath id={`clip-${item.id}`}><circle cx={0} cy={0} r={size/2}/></clipPath></defs>
<image href={cover} x={-size/2} y={-size/2} width={size} height={size} clipPath={`url(#clip-${item.id})`} preserveAspectRatio="xMidYMid slice"/>
<circle cx={0} cy={0} r={size/2} fill="none" stroke={cfg.color} strokeWidth="3"/>
{/* Status dot */}
<circle cx={size/2-2} cy={-size/2+2} r={4} fill={isBusy?'#ef4444':'#22c55e'} stroke="white" strokeWidth="1.5"/>
<text x={0} y={size/2+14} textAnchor="middle" fill="#0d2b1e" style={{fontSize:'8px',fontFamily:'Inter,sans-serif',fontWeight:700}}>{item.name}</text>
</motion.g>
);})}

{/* Entrance */}
<g transform="translate(250, 390)" filter="url(#softShadow)"><rect x="-20" y="-8" width="40" height="16" rx="4" fill="#d1d5db"/><text x="0" y="3" textAnchor="middle" fill="#4b5563" style={{fontSize:'7px',fontWeight:700}}>Въезд</text></g>
</svg>

{/* Detail card */}
<AnimatePresence>
{hovered&&(
<motion.div initial={{opacity:0,y:8,scale:0.97}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:8,scale:0.97}} transition={{duration:0.35,ease:EASE_OUT_QUINT}} className="mt-3">
<div className="glass rounded-2xl p-3 flex items-center gap-3">
<div className="w-12 h-12 rounded-xl overflow-hidden shrink-0"><img src={getItemCoverPhoto(hovered)} className="w-full h-full object-cover"/></div>
<div className="flex-1 min-w-0">
<p className="font-bold text-sm text-forest-900">{hovered.name}</p>
<p className="text-xs text-forest-500">{hovered.price_per_night} BYN · до {hovered.max_guests} гостей</p>
</div>
<div className="text-right shrink-0">
{isTodayBusy(busyMap[hovered.id]||[])?<span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-1 rounded-full">Занято</span>:<span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">Свободно</span>}
</div>
</div>
</motion.div>
)}
</AnimatePresence>
</div>

{/* Legend */}
<div className="flex gap-4 mt-3 flex-wrap">
{Object.entries(typeConfig).map(([key,cfg])=>(<div key={key} className="flex items-center gap-1.5 text-xs font-medium text-forest-600"><span className="w-2.5 h-2.5 rounded-full" style={{backgroundColor:cfg.color}}/>{cfg.label}</div>))}
<div className="flex items-center gap-1.5 text-xs font-medium text-forest-600"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"/>Свободно</div>
<div className="flex items-center gap-1.5 text-xs font-medium text-forest-600"><span className="w-2.5 h-2.5 rounded-full bg-red-500"/>Занято</div>
</div>
</motion.div>
);
}
