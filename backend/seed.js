export const DEFAULT_FILESYSTEM = [
  {id:"root-1",name:"documents",type:"directory",path:"/documents",isOpen:true,children:[
    {id:"file-1",name:"system_architecture.log",type:"file",path:"/documents/system_architecture.log",size:12,blocks:[4,5,6],permissions:"rw-r--r--",owner:"root",content:"[VFS INITIALIZED] Kernel micro-engine loaded.\nBlock allocation strategy: Indexed Contiguous Hybrid.\nSystem Status: Nominal.",tracks:[25,42,88],createdAt:"2026-01-01T00:00:00.000Z"},
    {id:"file-2",name:"kernel_config.json",type:"file",path:"/documents/kernel_config.json",size:8,blocks:[10,11],permissions:"rwxr-xr-x",owner:"admin",content:"{\n  \"max_threads\": 16,\n  \"scheduling_algorithm\": \"SCAN\",\n  \"block_size\": 4096,\n  \"mutex_mode\": \"fair\"\n}",tracks:[12,105],createdAt:"2026-01-01T00:00:00.000Z"}]},
  {id:"root-2",name:"projects",type:"directory",path:"/projects",isOpen:true,children:[
    {id:"file-3",name:"os_demo.cpp",type:"file",path:"/projects/os_demo.cpp",size:16,blocks:[18,19,20,21],permissions:"rw-rw-r--",owner:"developer",content:"#include <iostream>\n#include <thread>\n#include <mutex>\n\nstd::mutex reader_writer_mutex;\nvoid read_data() {\n  std::lock_guard<std::mutex> lock(reader_writer_mutex);\n  std::cout << \"Reading sector data safely...\\n\";\n}",tracks:[140,155,162,180],createdAt:"2026-01-01T00:00:00.000Z"}]},
  {id:"root-3",name:"system",type:"directory",path:"/system",isOpen:false,children:[
    {id:"file-4",name:"page_table.sys",type:"file",path:"/system/page_table.sys",size:4,blocks:[0],permissions:"r--------",owner:"kernel",content:"BOOT_PAGE_0: ALLOCATED_RESERVED",tracks:[0],createdAt:"2026-01-01T00:00:00.000Z"}]}
];
export const DEFAULT_LOGS = [
 {id:"boot-1",timestamp:"00:00:00.100",module:"KERNEL",level:"INFO",message:"VFS Nexus Micro-Kernel v3.8 initialized."},
 {id:"boot-2",timestamp:"00:00:00.200",module:"VFS",level:"SUCCESS",message:"Mounted Virtual Storage Device (64 Blocks, 256KB Total)."},
 {id:"boot-3",timestamp:"00:00:00.300",module:"MUTEX",level:"INFO",message:"Loaded Readers-Writers Concurrency Manager."},
 {id:"boot-4",timestamp:"00:00:00.400",module:"DISK",level:"INFO",message:"Disk Track Scheduler Ready (Tracks 0-199)."}
];
export const DEFAULT_STATE = {
 activeTab:"overview",threads:[],activeReadersCount:0,activeWriter:null,isMutexLocked:false,
 concurrencyTargetFile:"/documents/system_architecture.log",requestQueue:[82,170,43,140,24,16,190],
 initialHead:50,algorithm:"SCAN",animatedHead:50,totalSeekDistance:0,seekSequence:[],pipelineStep:0
};