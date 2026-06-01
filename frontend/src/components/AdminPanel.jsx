import React,{useState,useEffect}from'react';
import{format,addMonths}from'date-fns';
import{ru}from'date-fns/locale';
import{motion,AnimatePresence}from'framer-motion';
import{Shield,ChevronLeft,ChevronRight,Plus,RotateCcw,Home,Flame,Droplets,Loader2,Users,Calendar,CreditCard,Search,X,Edit3,Save,Trash2,User,Phone}from'lucide-react';
import{fetchAdminBookings,createManualBooking,updateItem,fetchItems,fetchAllBookings,fetchAllCustomers,adminCancelBooking,adminUpdateBooking}from'../api';
import{GlassCard}from'./GlassCard';

const typeIcons={house:Home,sauna:Flame,tub:Droplets};
const statusColors={confirmed:'bg-emerald-50 text-emerald-700 border-emerald-200',pending:'bg-amber-50 text-amber-700 border-amber-200',cancelled:'bg-red-50 text-red-700 border-red-200'};
const statusLabels={confirmed:'Подтверждено',pending:'Ожидает',cancelled:'Отменено'};
const TABS=[{id:'chess',label:'Шахматка',icon:Calendar},{id:'bookings',label:'Брони',icon:CreditCard},{id:'customers',label:'Клиенты',icon:Users},{id:'items',label:'Объекты',icon:Home}];

export default function AdminPanel(){
const[activeTab,setActiveTab]=useState('chess');
const[month,setMonth]=useState(format(new Date(),'yyyy-MM'));
const[bookings,setBookings]=useState([]);
const[allBookings,setAllBookings]=useState([]);
const[customers,setCustomers]=useState([]);
const[items,setItems]=useState([]);
const[loading,setLoading]=useState(true);
const[showManualForm,setShowManualForm]=useState(false);
const[manualForm,setManualForm]=useState({item_id:'',start_date:'',end_date:'',guest_name:'',guest_phone:''});
const[actionLoading,setActionLoading]=useState(false);
const[editingItem,setEditingItem]=useState(null);
const[editingBooking,setEditingBooking]=useState(null);
const[searchQuery,setSearchQuery]=useState('');

useEffect(()=>{loadAllData();},[month]);

const loadAllData=async()=>{
setLoading(true);
try{
const[bookingsRes,allRes,itemsRes,custRes]=await Promise.all([fetchAdminBookings(month),fetchAllBookings().catch(()=>({data:[]})),fetchItems(),fetchAllCustomers().catch(()=>({data:[]}))]);
setBookings(bookingsRes.data||[]);
setAllBookings(allRes.data||[]);
setItems(itemsRes.data||[]);
setCustomers(custRes.data||[]);
}catch(err){console.error(err);}
finally{setLoading(false);}
};

const handleManualSubmit=async()=>{
if(!manualForm.item_id||!manualForm.start_date||!manualForm.end_date)return;
setActionLoading(true);
try{await createManualBooking(manualForm);setShowManualForm(false);setManualForm({item_id:'',start_date:'',end_date:'',guest_name:'',guest_phone:''});loadAllData();}
catch(err){console.error(err);}
finally{setActionLoading(false);}
};

const toggleItemActive=async(item)=>{
setActionLoading(true);
try{await updateItem(item.id,{is_active:!item.is_active});loadAllData();}catch{}
finally{setActionLoading(false);}
};

const saveItemEdit=async()=>{
if(!editingItem)return;
setActionLoading(true);
try{
await updateItem(editingItem.id,{name:editingItem.name,type:editingItem.type,price_per_night:parseFloat(editingItem.price_per_night),max_guests:parseInt(editingItem.max_guests),description:editingItem.description,photo_url:editingItem.photo_url});
setEditingItem(null);loadAllData();
}catch(err){console.error(err);}
finally{setActionLoading(false);}
};

const handleCancelBooking=async(id)=>{
if(!confirm('Отменить бронь #'+id+'?'))return;
setActionLoading(true);
try{await adminCancelBooking(id);loadAllData();}catch(err){console.error(err);}
finally{setActionLoading(false);}
};

const handleUpdateBooking=async()=>{
if(!editingBooking)return;
setActionLoading(true);
try{
await adminUpdateBooking(editingBooking.id,{status:editingBooking.status,guest_name:editingBooking.guest_name,guest_phone:editingBooking.guest_phone,total_price:parseFloat(editingBooking.total_price)});
setEditingBooking(null);loadAllData();
}catch(err){console.error(err);}
finally{setActionLoading(false);}
};

const generateChessboard=()=>{
const date=new Date(month+'-01');
const daysInMonth=new Date(date.getFullYear(),date.getMonth()+1,0).getDate();
const days=[];
for(let i=1;i<=daysInMonth;i++)days.push(format(new Date(date.getFullYear(),date.getMonth(),i),'yyyy-MM-dd'));
return days;
};

const days=generateChessboard();
const monthLabel=format(new Date(month+'-01'),'LLLL yyyy',{locale:ru});

const getBookingForCell=(itemId,day)=>bookings.find(b=>{
if(b.item_id!==itemId)return false;
const start=new Date(b.start_date),end=new Date(b.end_date),current=new Date(day);
return current>=start&&current<end;
});

const filteredBookings=allBookings.filter(b=>(b.guest_name&&b.guest_name.toLowerCase().includes(searchQuery.toLowerCase()))||(b.item_name&&b.item_name.toLowerCase().includes(searchQuery.toLowerCase()))||String(b.id).includes(searchQuery));
const filteredCustomers=customers.filter(c=>(c.first_name&&c.first_name.toLowerCase().includes(searchQuery.toLowerCase()))||(c.last_name&&c.last_name.toLowerCase().includes(searchQuery.toLowerCase()))||(c.phone&&c.phone.includes(searchQuery))||String(c.telegram_id).includes(searchQuery));

if(loading){return(<div className={'flex flex-col items-center justify-center py-20'}><Loader2 size={32} className={'text-forest-600 animate-spin mb-4'}/><p className={'text-forest-600 font-medium'}>Загрузка...</p></div>);}

return(
<div className={'animate-fade-in pb-8'}>
<GlassCard strong className={'mb-4 overflow-hidden relative'}>
<div className={'relative flex items-center gap-3'}>
<div className={'w-10 h-10 rounded-xl gradient-forest flex items-center justify-center shadow-md'}><Shield size={20} className={'text-white'}/></div>
<div><h2 className={'text-lg font-extrabold text-forest-900 tracking-tight'}>Админ-панель</h2><p className={'text-xs text-forest-500'}>Брони, клиенты, объекты</p></div>
</div>
</GlassCard>

<div className={'flex gap-1 mb-4 overflow-x-auto pb-1 -mx-1 px-1'}>
{TABS.map(tab=>{const Icon=tab.icon;const isActive=activeTab===tab.id;
return(<button key={tab.id} onClick={()=>setActiveTab(tab.id)} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${isActive?'bg-forest-600 text-white shadow-md':'bg-white/60 text-forest-600 hover:bg-white/80 border border-forest-100'}`}><Icon size={14}/>{tab.label}</button>);
})}
</div>

{activeTab==='chess'&&(
<div>
<GlassCard className={'flex items-center justify-between mb-4'}>
<button onClick={()=>setMonth(format(addMonths(new Date(month+'-01'),-1),'yyyy-MM'))} className={'w-10 h-10 rounded-xl bg-forest-50 flex items-center justify-center text-forest-700 hover:bg-forest-100 active:scale-95'}><ChevronLeft size={20}/></button>
<span className={'font-bold text-forest-900 capitalize'}>{monthLabel}</span>
<button onClick={()=>setMonth(format(addMonths(new Date(month+'-01'),1),'yyyy-MM'))} className={'w-10 h-10 rounded-xl bg-forest-50 flex items-center justify-center text-forest-700 hover:bg-forest-100 active:scale-95'}><ChevronRight size={20}/></button>
</GlassCard>
<div className={'grid grid-cols-3 gap-3 mb-4'}>
<GlassCard className={'text-center !p-4'}><div className={'text-2xl font-extrabold text-forest-700'}>{bookings.length}</div><div className={'text-[10px] font-semibold uppercase text-forest-400 mt-1'}>Броней</div></GlassCard>
<GlassCard className={'text-center !p-4'}><div className={'text-2xl font-extrabold text-emerald-600'}>{bookings.filter(b=>b.status==='confirmed').length}</div><div className={'text-[10px] font-semibold uppercase text-forest-400 mt-1'}>Оплачено</div></GlassCard>
<GlassCard className={'text-center !p-4'}><div className={'text-2xl font-extrabold text-amber-600'}>{bookings.filter(b=>b.status==='pending').length}</div><div className={'text-[10px] font-semibold uppercase text-forest-400 mt-1'}>Ожидает</div></GlassCard>
</div>
<div className={'flex gap-3 mb-4'}>
<button onClick={()=>setShowManualForm(!showManualForm)} className={'btn-primary flex-1'}><Plus size={18}/>{showManualForm?'Отмена':'Ручное бронирование'}</button>
<button onClick={loadAllData} className={'btn-secondary !w-auto !px-4'}><RotateCcw size={18}/></button>
</div>
<AnimatePresence>
{showManualForm&&(
<motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:'auto'}} exit={{opacity:0,height:0}} className={'overflow-hidden mb-4'}>
<GlassCard strong className={'!bg-gradient-to-br !from-forest-50 !to-wood-50'}>
<h3 className={'font-bold text-forest-900 mb-3 flex items-center gap-2'}><Plus size={18} className={'text-forest-500'}/>Новое бронирование</h3>
<div className={'space-y-2.5'}>
<select value={manualForm.item_id} onChange={e=>setManualForm({...manualForm,item_id:e.target.value})} className={'input-field !pl-4'}><option value={''}>Выберите объект</option>{items.map(i=>(<option key={i.id} value={i.id}>{i.name}</option>))}</select>
<div className={'grid grid-cols-2 gap-2'}><input type={'date'} value={manualForm.start_date} onChange={e=>setManualForm({...manualForm,start_date:e.target.value})} className={'input-field !pl-4'}/><input type={'date'} value={manualForm.end_date} onChange={e=>setManualForm({...manualForm,end_date:e.target.value})} className={'input-field !pl-4'}/></div>
<input type={'text'} placeholder={'Имя гостя'} value={manualForm.guest_name} onChange={e=>setManualForm({...manualForm,guest_name:e.target.value})} className={'input-field !pl-4'}/>
<input type={'tel'} placeholder={'Телефон'} value={manualForm.guest_phone} onChange={e=>setManualForm({...manualForm,guest_phone:e.target.value})} className={'input-field !pl-4'}/>
<button onClick={handleManualSubmit} disabled={actionLoading} className={'btn-primary'}>{actionLoading?<Loader2 size={18} className={'animate-spin'}/>:'Создать бронь'}</button>
</div>
</GlassCard>
</motion.div>
)}
</AnimatePresence>
<GlassCard strong className={'mb-6 overflow-hidden'}>
<h3 className={'font-bold text-forest-900 mb-4'}>Шахматка</h3>
<div className={'overflow-x-auto custom-scrollbar -mx-5 px-5'}><div className={'min-w-max'}>
<div className={'flex items-center sticky left-0'}><div className={'w-32 shrink-0 py-1 px-2 text-[10px] font-semibold uppercase text-forest-400'}>Объект</div>{days.map(d=>(<div key={d} className={'w-8 shrink-0 text-center text-[10px] text-forest-500 py-1'}>{parseInt(d.split('-')[2])}</div>))}</div>
{items.map(item=>{const TypeIcon=typeIcons[item.type]||Home;return(
<div key={item.id} className={'flex items-center'}>
<div className={'w-32 shrink-0 py-2 px-2 flex items-center gap-1.5'}><TypeIcon size={14} className={'text-forest-500 shrink-0'}/><span className={'text-xs font-medium text-forest-800 truncate'}>{item.name}</span></div>
{days.map(d=>{const booking=getBookingForCell(item.id,d);return(<div key={d} className={'w-8 shrink-0'}><div className={`h-6 rounded-md mx-0.5 ${booking?(booking.status==='confirmed'?'bg-emerald-400':'bg-amber-400'):'bg-forest-100'}`}/></div>);})}
</div>);})}
</div></div>
</GlassCard>
</div>
)}

{activeTab==='bookings'&&(
<div>
<div className={'relative mb-4'}><Search size={16} className={'absolute left-3.5 top-1/2 -translate-y-1/2 text-forest-400'}/><input type={'text'} placeholder={'Поиск по имени, объекту, ID...'} value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} className={'input-field !pl-10'}/></div>
<div className={'space-y-3'}>
{filteredBookings.map(b=>(
<GlassCard key={b.id}>
{editingBooking?.id===b.id?(
<div className={'space-y-2'}>
<div className={'flex items-center justify-between'}><span className={'text-xs font-bold text-forest-400'}>#{b.id}</span><button onClick={()=>setEditingBooking(null)}><X size={14} className={'text-forest-400'}/></button></div>
<select value={editingBooking.status} onChange={e=>setEditingBooking({...editingBooking,status:e.target.value})} className={'input-field !pl-3 !py-2'}><option value={'pending'}>Ожидает</option><option value={'confirmed'}>Подтверждено</option><option value={'cancelled'}>Отменено</option></select>
<input type={'text'} value={editingBooking.guest_name||''} onChange={e=>setEditingBooking({...editingBooking,guest_name:e.target.value})} className={'input-field !pl-3'} placeholder={'Имя гостя'}/>
<input type={'tel'} value={editingBooking.guest_phone||''} onChange={e=>setEditingBooking({...editingBooking,guest_phone:e.target.value})} className={'input-field !pl-3'} placeholder={'Телефон'}/>
<input type={'number'} value={editingBooking.total_price||0} onChange={e=>setEditingBooking({...editingBooking,total_price:e.target.value})} className={'input-field !pl-3'} placeholder={'Сумма'}/>
<button onClick={handleUpdateBooking} disabled={actionLoading} className={'btn-primary !py-2'}><Save size={16}/>Сохранить</button>
</div>
):(
<div>
<div className={'flex items-center justify-between mb-2'}>
<div className={'flex items-center gap-2'}>
<span className={'text-xs font-mono font-bold text-forest-500'}>#{b.id}</span>
<span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${statusColors[b.status]||'bg-gray-50 text-gray-600'}`}>{statusLabels[b.status]||b.status}</span>
</div>
<div className={'flex items-center gap-1'}>
<button onClick={()=>setEditingBooking({...b})} className={'w-7 h-7 rounded-lg flex items-center justify-center hover:bg-forest-50'}><Edit3 size={14} className={'text-forest-500'}/></button>
{b.status!=='cancelled'&&<button onClick={()=>handleCancelBooking(b.id)} className={'w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50'}><Trash2 size={14} className={'text-red-400'}/></button>}
</div>
</div>
<p className={'font-bold text-sm text-forest-900'}>{b.item_name||'Объект'}</p>
<p className={'text-xs text-forest-500'}>{b.start_date} — {b.end_date}</p>
<div className={'flex items-center justify-between mt-2'}>
<p className={'text-xs text-forest-500'}>{b.guest_name||'—'} · {b.guest_phone||'—'}</p>
<p className={'text-sm font-bold text-forest-700'}>{b.total_price} BYN</p>
</div>
</div>
)}
</GlassCard>
))}
{filteredBookings.length===0&&<p className={'text-center text-sm text-forest-400 py-8'}>Ничего не найдено</p>}
</div>
</div>
)}

{activeTab==='customers'&&(
<div>
<div className={'relative mb-4'}><Search size={16} className={'absolute left-3.5 top-1/2 -translate-y-1/2 text-forest-400'}/><input type={'text'} placeholder={'Поиск по имени, телефону, ID...'} value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} className={'input-field !pl-10'}/></div>
<div className={'space-y-3'}>
{filteredCustomers.map(c=>{const name=[c.first_name,c.last_name].filter(Boolean).join(' ')||'Гость';return(
<GlassCard key={c.id}>
<div className={'flex items-center gap-3'}>
<div className={'w-10 h-10 rounded-xl bg-forest-100 flex items-center justify-center'}><User size={18} className={'text-forest-500'}/></div>
<div className={'flex-1 min-w-0'}>
<p className={'font-bold text-sm text-forest-900 truncate'}>{name}</p>
<p className={'text-xs text-forest-500'}>ID: {c.telegram_id}</p>
<div className={'flex items-center gap-3 mt-1'}>
{c.phone&&<span className={'text-xs text-forest-600 flex items-center gap-1'}><Phone size={10}/>{c.phone}</span>}
{c.username&&<span className={'text-xs text-forest-500'}>@{c.username}</span>}
</div>
</div>
<div className={'text-right'}><p className={'text-[10px] text-forest-400'}>{format(new Date(c.created_at),'dd.MM.yyyy')}</p></div>
</div>
</GlassCard>
);})}
{filteredCustomers.length===0&&<p className={'text-center text-sm text-forest-400 py-8'}>Ничего не найдено</p>}
</div>
</div>
)}

{activeTab==='items'&&(
<div className={'space-y-3'}>
{items.map(item=>{const TypeIcon=typeIcons[item.type]||Home;return(
<GlassCard key={item.id}>
{editingItem?.id===item.id?(
<div className={'space-y-2'}>
<div className={'flex items-center justify-between'}><span className={'text-xs font-bold text-forest-400'}>Редактирование</span><button onClick={()=>setEditingItem(null)}><X size={14} className={'text-forest-400'}/></button></div>
<input type={'text'} value={editingItem.name} onChange={e=>setEditingItem({...editingItem,name:e.target.value})} className={'input-field !pl-3'} placeholder={'Название'}/>
<select value={editingItem.type} onChange={e=>setEditingItem({...editingItem,type:e.target.value})} className={'input-field !pl-3'}><option value={'house'}>Дом</option><option value={'sauna'}>Баня</option><option value={'tub'}>Купель</option></select>
<input type={'number'} value={editingItem.price_per_night} onChange={e=>setEditingItem({...editingItem,price_per_night:e.target.value})} className={'input-field !pl-3'} placeholder={'Цена за ночь'}/>
<input type={'number'} value={editingItem.max_guests} onChange={e=>setEditingItem({...editingItem,max_guests:e.target.value})} className={'input-field !pl-3'} placeholder={'Макс. гостей'}/>
<textarea value={editingItem.description||''} onChange={e=>setEditingItem({...editingItem,description:e.target.value})} className={'input-field !pl-3 !py-2'} placeholder={'Описание'} rows={2}/>
<input type={'text'} value={editingItem.photo_url||''} onChange={e=>setEditingItem({...editingItem,photo_url:e.target.value})} className={'input-field !pl-3'} placeholder={'URL фото'}/>
<button onClick={saveItemEdit} disabled={actionLoading} className={'btn-primary !py-2'}><Save size={16}/>Сохранить</button>
</div>
):(
<div className={'flex items-center justify-between'}>
<div className={'flex items-center gap-3'}>
<div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.is_active?'bg-forest-100':'bg-forest-50'}`}><TypeIcon size={18} className={item.is_active?'text-forest-600':'text-forest-300'}/></div>
<div><p className={'font-semibold text-sm text-forest-900'}>{item.name}</p><p className={'text-xs text-forest-500'}>{item.price_per_night} BYN / ночь · до {item.max_guests} гостей</p></div>
</div>
<div className={'flex items-center gap-2'}>
<button onClick={()=>setEditingItem({...item})} className={'w-7 h-7 rounded-lg flex items-center justify-center hover:bg-forest-50'}><Edit3 size={14} className={'text-forest-500'}/></button>
<button onClick={()=>toggleItemActive(item)} disabled={actionLoading} className={`relative w-12 h-7 rounded-full transition-colors ${item.is_active?'bg-emerald-500':'bg-forest-200'}`}><div className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${item.is_active?'translate-x-5':'translate-x-0.5'}`}/></button>
</div>
</div>
)}
</GlassCard>
);})}
</div>
)}
</div>
);
}
