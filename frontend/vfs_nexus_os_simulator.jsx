import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Folder, FolderOpen, File, FileCode, Terminal, HardDrive, Cpu, Disc, Plus,
  Lock, Unlock, Play, Pause, RotateCcw, Trash2, Edit3, Info, 
  Activity, Grid, CheckCircle, Download, Copy, 
  ChevronRight, ChevronDown, Zap, Users 
} from 'lucide-react';

// INITIAL CONSTANTS
const TOTAL_BLOCKS = 64; // 64 blocks of 4KB - 256KB total virtual disk space
const BLOCK_SIZE_KB = 4;
const DISK_TRACK_SIZE = 200; // Tracks 0 to 199
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// CLEAN ICON COMPONENT WRAPPER (JSX)
const Icon = ({ name, className = "w-4 h-4", onClick }) => {
  const iconMap = {
    folder: <Folder className={className} onClick={onClick} />,
    folderOpen: <FolderOpen className={className} onClick={onClick} />,
    file: <File className={className} onClick={onClick} />,
    fileCode: <FileCode className={className} onClick={onClick} />,
    terminal: <Terminal className={className} onClick={onClick} />,
    hardDrive: <HardDrive className={className} onClick={onClick} />,
    cpu: <Cpu className={className} onClick={onClick} />,
    lock: <Lock className={className} onClick={onClick} />,
    unlock: <Unlock className={className} onClick={onClick} />,
    play: <Play className={className} onClick={onClick} />,
    pause: <Pause className={className} onClick={onClick} />,
    rotateCcw: <RotateCcw className={className} onClick={onClick} />,
    trash: <Trash2 className={className} onClick={onClick} />,
    edit: <Edit3 className={className} onClick={onClick} />,
    info: <Info className={className} onClick={onClick} />,
    activity: <Activity className={className} onClick={onClick} />,
    grid: <Grid className={className} onClick={onClick} />,
    checkCircle: <CheckCircle className={className} onClick={onClick} />,
    download: <Download className={className} onClick={onClick} />,
    copy: <Copy className={className} onClick={onClick} />,
    chevronRight: <ChevronRight className={className} onClick={onClick} />,
    chevronDown: <ChevronDown className={className} onClick={onClick} />,
    zap: <Zap className={className} onClick={onClick} />,
    users: <Users className={className} onClick={onClick} />,
    disc: <Disc className={className} onClick={onClick} />,
    plus: <Plus className={className} onClick={onClick} />
  };

  return iconMap[name] || <Info className={className} onClick={onClick} />;
};

const INITIAL_FILESYSTEM = [
  {
    id: "root-1",
    name: "documents",
    type: "directory",
    path: "/documents",
    isOpen: true,
    children: [
      {
        id: "file-1",
        name: "system_architecture.log",
        type: "file",
        path: "/documents/system_architecture.log",
        size: 12, // KB (3 blocks)
        blocks: [4, 5, 6],
        permissions: "rw-r--r--",
        owner: "root",
        content: "[VFS INITIALIZED] Kernel micro-engine loaded.\nBlock allocation strategy: Indexed Contiguous Hybrid.\nSystem Status: Nominal.",
        tracks: [25, 42, 88],
        createdAt: new Date().toLocaleTimeString()
      },
      {
        id: "file-2",
        name: "kernel_config.json",
        type: "file",
        path: "/documents/kernel_config.json",
        size: 8, // KB (2 blocks)
        blocks: [10, 11],
        permissions: "rwxr-xr-x",
        owner: "admin",
        content: "{\n  \"max_threads\": 16,\n  \"scheduling_algorithm\": \"SCAN\",\n  \"block_size\": 4096,\n  \"mutex_mode\": \"fair\"\n}",
        tracks: [12, 105],
        createdAt: new Date().toLocaleTimeString()
      }
    ]
  },
  {
    id: "root-2",
    name: "projects",
    type: "directory",
    path: "/projects",
    isOpen: true,
    children: [
      {
        id: "file-3",
        name: "os_demo.cpp",
        type: "file",
        path: "/projects/os_demo.cpp",
        size: 16, // KB (4 blocks)
        blocks: [18, 19, 20, 21],
        permissions: "rw-rw-r--",
        owner: "developer",
        content: "#include <iostream>\n#include <thread>\n#include <mutex>\n\nstd::mutex reader_writer_mutex;\nvoid read_data() {\n  std::lock_guard<std::mutex> lock(reader_writer_mutex);\n  std::cout << \"Reading sector data safely...\\n\";\n}",
        tracks: [140, 155, 162, 180],
        createdAt: new Date().toLocaleTimeString()
      }
    ]
  },
  {
    id: "root-3",
    name: "system",
    type: "directory",
    path: "/system",
    isOpen: false,
    children: [
      {
        id: "file-4",
        name: "page_table.sys",
        type: "file",
        path: "/system/page_table.sys",
        size: 4, // 1 block
        blocks: [0],
        permissions: "r--------",
        owner: "kernel",
        content: "BOOT_PAGE_0: ALLOCATED_RESERVED",
        tracks: [0],
        createdAt: new Date().toLocaleTimeString()
      }
    ]
  }
];

function findFirstFile(nodes) {
  for (const node of nodes || []) {
    if (node.type === "file") return node;
    if (node.children?.length) {
      const found = findFirstFile(node.children);
      if (found) return found;
    }
  }
  return null;
}

export default function App() {
  const [activeTab, setActiveTab] = useState("overview"); // overview, vfs, concurrency, scheduler, pipeline, diskmap, logs
  const [fileSystem, setFileSystem] = useState(INITIAL_FILESYSTEM);
  const [selectedFile, setSelectedFile] = useState(INITIAL_FILESYSTEM[0].children[0]);
  const [logs, setLogs] = useState([]);
  
  // Concurrency Lab State
  const [threads, setThreads] = useState([]);
  const [activeReadersCount, setActiveReadersCount] = useState(0);
  const [activeWriter, setActiveWriter] = useState(null);
  const [isMutexLocked, setIsMutexLocked] = useState(false);
  const [concurrencyTargetFile, setConcurrencyTargetFile] = useState("/documents/system_architecture.log");

  // Disk Scheduler State
  const [requestQueue, setRequestQueue] = useState([82, 170, 43, 140, 24, 16, 190]);
  const [initialHead, setInitialHead] = useState(50);
  const [algorithm, setAlgorithm] = useState("SCAN");
  const [isSchedulingRunning, setIsSchedulingRunning] = useState(false);
  const [animatedHead, setAnimatedHead] = useState(50);
  const [totalSeekDistance, setTotalSeekDistance] = useState(0);
  const [seekSequence, setSeekSequence] = useState([]);

  // Full Pipeline Simulation State
  const [pipelineStep, setPipelineStep] = useState(0);
  const [pipelineRunning, setPipelineRunning] = useState(false);

  // Modal State for New File/Folder
  const [showNewModal, setShowNewModal] = useState(false);
  const [newFileType, setNewFileType] = useState("file");
  const [newItemName, setNewItemName] = useState("");
  const [newItemContent, setNewItemContent] = useState("Initial sample content for virtual storage block allocation.");
  const [targetParentPath, setTargetParentPath] = useState("/documents");

  // Selected Block Modal
  const [selectedBlockInfo, setSelectedBlockInfo] = useState(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const saveTimerRef = useRef(null);

  const addLog = (message, module = "SYSTEM", level = "INFO") => {
    const newLog = {
      id: Date.now() + Math.random(),
      timestamp: new Date().toLocaleTimeString() + "." + Math.floor(Math.random() * 900 + 100),
      module,
      level,
      message
    };
    setLogs(prev => [newLog, ...prev.slice(0, 199)]);
  };

// Load persistent state from SQLite through the Express API.
  useEffect(() => {
    let cancelled = false;

    const loadPersistentState = async () => {
      try {
        const response = await fetch(`${API_BASE}/state`);
        if (!response.ok) throw new Error(`API returned ${response.status}`);
        const data = await response.json();
        if (cancelled) return;

        if (data.fileSystem?.length) {
          setFileSystem(data.fileSystem);
          setSelectedFile(findFirstFile(data.fileSystem));
        }
        if (Array.isArray(data.logs)) setLogs(data.logs);
        if (Array.isArray(data.threads)) setThreads(data.threads);
        setActiveReadersCount(data.activeReadersCount || 0);
        setActiveWriter(data.activeWriter || null);
        setIsMutexLocked(Boolean(data.isMutexLocked));
        setConcurrencyTargetFile(data.concurrencyTargetFile || "/documents/system_architecture.log");
        setRequestQueue(Array.isArray(data.requestQueue) ? data.requestQueue : [82, 170, 43, 140, 24, 16, 190]);
        setInitialHead(Number.isFinite(data.initialHead) ? data.initialHead : 50);
        setAlgorithm(data.algorithm || "SCAN");
        setAnimatedHead(Number.isFinite(data.animatedHead) ? data.animatedHead : 50);
        setTotalSeekDistance(Number.isFinite(data.totalSeekDistance) ? data.totalSeekDistance : 0);
        setSeekSequence(Array.isArray(data.seekSequence) ? data.seekSequence : []);
        setPipelineStep(data.pipelineStep || 0);
        setIsHydrated(true);
      } catch (error) {
  if (cancelled) return;

  console.error("Persistent state load failed:", error);

  // Do not enable automatic saving if the initial load fails.
  // This prevents default data from overwriting existing SQLite data.
  setIsHydrated(false);

  addLog(
    "Database connection failed. Changes will not be saved.",
    "DATABASE",
    "ERROR"
  );

  addLog(
    "Check that the SQLite backend is running on port 5000, then refresh.",
    "DATABASE",
    "WARN"
  );
}
    };

    loadPersistentState();
    return () => { cancelled = true; };
  }, []);

  // Debounced persistence of the simulator's complete state.
  // Automatically save simulator state to SQLite
useEffect(() => {
  if (!isHydrated) return;

  if (saveTimerRef.current) {
    clearTimeout(saveTimerRef.current);
  }

  saveTimerRef.current = setTimeout(async () => {
    try {
      const response = await fetch(`${API_BASE}/state`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          activeTab,
          fileSystem,
          logs: logs.slice(0, 200),
          threads,
          activeReadersCount,
          activeWriter,
          isMutexLocked,
          concurrencyTargetFile,
          requestQueue,
          initialHead,
          algorithm,
          animatedHead,
          totalSeekDistance,
          seekSequence,
          pipelineStep
        })
      });

      if (!response.ok) {
        throw new Error(`Save failed: HTTP ${response.status}`);
      }

      console.log("VFS state saved successfully.");

    } catch (error) {
      console.error("Persistent state save failed:", error);
    }
  }, 350);

  return () => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
  };
}, [
  isHydrated,
  activeTab,
  fileSystem,
  logs,
  threads,
  activeReadersCount,
  activeWriter,
  isMutexLocked,
  concurrencyTargetFile,
  requestQueue,
  initialHead,
  algorithm,
  animatedHead,
  totalSeekDistance,
  seekSequence,
  pipelineStep
]);

  // Compute Dynamic Mutex Status for Header Bar & Concurrency Lab
  const mutexState = useMemo(() => {
    const hasWaitingWriter = threads.some(
      t => t.type === 'writer' && (t.status === 'WAITING' || t.status === 'ACQUIRING')
    );

    if (activeWriter || isMutexLocked) {
      return { text: "WRITE LOCK (EXCLUSIVE)", color: "text-amber-400" };
    }
    if (activeReadersCount > 0 && hasWaitingWriter) {
      return { text: "WRITER WAITING", color: "text-purple-400" };
    }
    if (activeReadersCount > 0) {
      return { text: `READ LOCK (SHARED: ${activeReadersCount})`, color: "text-cyan-400" };
    }
    if (hasWaitingWriter) {
      return { text: "WRITER WAITING", color: "text-purple-400" };
    }
    return { text: "FREE (SHARED)", color: "text-emerald-400" };
  }, [activeWriter, isMutexLocked, activeReadersCount, threads]);

  const blockMap = useMemo(() => {
    const map = Array(TOTAL_BLOCKS).fill(null).map((_, idx) => ({
      id: idx,
      status: idx === 0 ? "reserved" : "free",
      filePath: idx === 0 ? "/system/boot.sys" : null,
      fileName: idx === 0 ? "boot.sys" : null,
      owner: idx === 0 ? "kernel" : null
    }));

    const traverse = (nodes) => {
      nodes.forEach(node => {
        if (node.type === "file" && node.blocks) {
          node.blocks.forEach(b => {
            if (b < TOTAL_BLOCKS) {
              map[b] = {
                id: b,
                status: "allocated",
                filePath: node.path,
                fileName: node.name,
                owner: node.owner || "user"
              };
            }
          });
        }
        if (node.children) traverse(node.children);
      });
    };
    traverse(fileSystem);

    if (activeWriter) {
      const file = findFileByPath(concurrencyTargetFile, fileSystem);
      if (file && file.blocks) {
        file.blocks.forEach(b => {
          if (map[b]) map[b].status = "writing";
        });
      }
    } else if (activeReadersCount > 0) {
      const file = findFileByPath(concurrencyTargetFile, fileSystem);
      if (file && file.blocks) {
        file.blocks.forEach(b => {
          if (map[b]) map[b].status = "reading";
        });
      }
    }

    return map;
  }, [fileSystem, concurrencyTargetFile, activeReadersCount, activeWriter]);

  const usedBlocksCount = useMemo(() => {
    return blockMap.filter(b => b.status !== "free").length;
  }, [blockMap]);

  const freeBlocksCount = TOTAL_BLOCKS - usedBlocksCount;

  function findFileByPath(path, nodes) {
    for (const node of nodes) {
      if (node.path === path) return node;
      if (node.children) {
        const found = findFileByPath(path, node.children);
        if (found) return found;
      }
    }
    return null;
  }

  const getAllFiles = (nodes = fileSystem) => {
    let list = [];
    nodes.forEach(n => {
      if (n.type === "file") list.push(n);
      if (n.children) list = [...list, ...getAllFiles(n.children)];
    });
    return list;
  };

  const handleCreateFileOrFolder = () => {
    if (!newItemName.trim()) return;

    const cleanName = newItemName.trim();
    const newPath = `${targetParentPath === "/" ? "" : targetParentPath}/${cleanName}`;

    if (findFileByPath(newPath, fileSystem)) {
      addLog(`Cannot create '${newPath}': item already exists.`, "VFS", "ERROR");
      return;
    }

    const sizeInKB = Math.max(4, Math.ceil(newItemContent.length / 50) * 4);
    const requiredBlocks = newFileType === "file" ? Math.ceil(sizeInKB / BLOCK_SIZE_KB) : 0;
    const freeBlockIds = blockMap.filter(b => b.status === "free").map(b => b.id);

    if (newFileType === "file" && freeBlockIds.length < requiredBlocks) {
      addLog(`Disk Full! Cannot allocate ${requiredBlocks} blocks for ${cleanName}`, "VFS", "ERROR");
      return;
    }

    const allocatedBlocks = newFileType === "file" ? freeBlockIds.slice(0, requiredBlocks) : [];
    const generatedTracks = allocatedBlocks.map(b => (b * 3 + 12) % DISK_TRACK_SIZE);

    const newItem = {
      id: "node-" + Date.now(),
      name: cleanName,
      type: newFileType,
      path: newPath,
      isOpen: true,
      size: newFileType === "file" ? sizeInKB : 0,
      blocks: allocatedBlocks,
      permissions: newFileType === "file" ? "rw-r--r--" : "rwxr-xr-x",
      owner: "user",
      content: newFileType === "file" ? newItemContent : "",
      tracks: generatedTracks,
      createdAt: new Date().toISOString(),
      children: newFileType === "directory" ? [] : undefined
    };

    const updateNodes = (nodes) => nodes.map(node => {
      if (node.path === targetParentPath && node.type === "directory") {
        return { ...node, children: [...(node.children || []), newItem] };
      }
      if (node.children) return { ...node, children: updateNodes(node.children) };
      return node;
    });

    if (targetParentPath === "/") {
      setFileSystem(prev => [...prev, newItem]);
    } else {
      const parent = findFileByPath(targetParentPath, fileSystem);
      if (!parent || parent.type !== "directory") {
        addLog(`Parent directory '${targetParentPath}' was not found.`, "VFS", "ERROR");
        return;
      }
      setFileSystem(prev => updateNodes(prev));
    }

    if (newFileType === "file") {
      setRequestQueue(prev => [...new Set([...prev, ...generatedTracks])]);
      addLog(`Created FILE '${newPath}' using indexed blocks [${allocatedBlocks.join(", ")}].`, "VFS", "SUCCESS");
      addLog(`Generated ${generatedTracks.length} disk track requests for ${cleanName}: [${generatedTracks.join(", ")}]`, "DISK", "INFO");
    } else {
      addLog(`Created DIRECTORY '${newPath}'.`, "VFS", "SUCCESS");
    }

    setShowNewModal(false);
    setNewItemName("");
    setNewItemContent("Initial sample content for virtual storage block allocation.");
  };

  const handleDeleteItem = (path) => {
    const deleteRecursive = (nodes) => {
      return nodes.filter(n => n.path !== path).map(n => {
        if (n.children) return { ...n, children: deleteRecursive(n.children) };
        return n;
      });
    };
    setFileSystem(prev => deleteRecursive(prev));
    if (selectedFile && selectedFile.path === path) {
      setSelectedFile(null);
    }
    addLog(`Deleted item at '${path}' and deallocated block storage.`, "VFS", "WARN");
  };

  const handleUpdateFileContent = (newContent) => {
    if (!selectedFile) return;

    const currentBlocks = selectedFile.blocks || [];
    const newSizeInKB = Math.max(4, Math.ceil(newContent.length / 50) * 4);
    const requiredBlocks = Math.ceil(newSizeInKB / BLOCK_SIZE_KB);
    let nextBlocks = [...currentBlocks];
    let nextTracks = [...(selectedFile.tracks || [])];

    if (requiredBlocks > currentBlocks.length) {
      const needed = requiredBlocks - currentBlocks.length;
      const freeBlockIds = blockMap.filter(b => b.status === "free").map(b => b.id);

      if (freeBlockIds.length < needed) {
        addLog(`Write rejected for '${selectedFile.path}': ${needed} additional blocks required, but only ${freeBlockIds.length} are free.`, "VFS", "ERROR");
        return;
      }

      const extraBlocks = freeBlockIds.slice(0, needed);
      nextBlocks = [...nextBlocks, ...extraBlocks];
      nextTracks = [...nextTracks, ...extraBlocks.map(b => (b * 3 + 12) % DISK_TRACK_SIZE)];
      addLog(`Expanded '${selectedFile.path}' by allocating blocks [${extraBlocks.join(", ")}].`, "VFS", "INFO");
    } else if (requiredBlocks < currentBlocks.length) {
      const released = currentBlocks.slice(requiredBlocks);
      nextBlocks = currentBlocks.slice(0, requiredBlocks);
      nextTracks = nextTracks.slice(0, requiredBlocks);
      addLog(`Shrank '${selectedFile.path}' and released blocks [${released.join(", ")}].`, "VFS", "INFO");
    }

    const updatedFile = {
      ...selectedFile,
      content: newContent,
      size: newSizeInKB,
      blocks: nextBlocks,
      tracks: nextTracks,
      updatedAt: new Date().toISOString()
    };

    const updateRecursive = (nodes) => nodes.map(n => {
      if (n.path === selectedFile.path) return updatedFile;
      if (n.children) return { ...n, children: updateRecursive(n.children) };
      return n;
    });

    setFileSystem(prev => updateRecursive(prev));
    setSelectedFile(updatedFile);
    addLog(`Updated file contents of '${selectedFile.path}'.`, "VFS", "INFO");
  };

  const addThread = (type) => {
    const threadId = `T${threads.length + 1}-${type.toUpperCase().slice(0, 1)}`;
    const newThread = {
      id: threadId,
      type,
      status: 'WAITING',
      progress: 0,
      createdAt: new Date().toLocaleTimeString()
    };
    setThreads(prev => [...prev, newThread]);
    addLog(`Spawned thread ${threadId} for file '${concurrencyTargetFile}'.`, "MUTEX", "INFO");
  };

  useEffect(() => {
    if (
      threads.length === 0 ||
      threads.every(thread => thread.status === "COMPLETED")
    ) {
      return;
    }

    const interval = setInterval(() => {
      setThreads(prevThreads => {
        let updated = [...prevThreads];
        const currentWritingThread = updated.find(t => t.status === 'WRITING');
        const currentReadingThreads = updated.filter(t => t.status === 'READING');

        updated = updated.map(thread => {
          if (thread.status === 'COMPLETED') return thread;

          if (thread.type === 'writer') {
            if (thread.status === 'WRITING') {
              const nextProg = thread.progress + 25;
              if (nextProg >= 100) {
                addLog(`Writer Thread ${thread.id} released EXCLUSIVE Write Lock.`, "MUTEX", "SUCCESS");
                setIsMutexLocked(false);
                setActiveWriter(null);
                return { ...thread, status: 'COMPLETED', progress: 100 };
              }
              return { ...thread, progress: nextProg };
            }

            if (thread.status === 'WAITING' || thread.status === 'ACQUIRING') {
              if (currentReadingThreads.length === 0 && !currentWritingThread && !isMutexLocked) {
                setIsMutexLocked(true);
                setActiveWriter(thread.id);
                addLog(`Writer Thread ${thread.id} acquired EXCLUSIVE Write Lock!`, "MUTEX", "WARN");
                return { ...thread, status: 'WRITING', progress: 10 };
              } else {
                return { ...thread, status: 'ACQUIRING' };
              }
            }
          }

          if (thread.type === 'reader') {
            if (thread.status === 'READING') {
              const nextProg = thread.progress + 20;
              if (nextProg >= 100) {
                setActiveReadersCount(c => Math.max(0, c - 1));
                addLog(`Reader Thread ${thread.id} finished reading and exited CS.`, "MUTEX", "INFO");
                return { ...thread, status: 'COMPLETED', progress: 100 };
              }
              return { ...thread, progress: nextProg };
            }

            if (thread.status === 'WAITING' || thread.status === 'ACQUIRING') {
              if (!currentWritingThread && !isMutexLocked) {
                setActiveReadersCount(c => c + 1);
                addLog(`Reader Thread ${thread.id} acquired Shared Read Lock.`, "MUTEX", "SUCCESS");
                return { ...thread, status: 'READING', progress: 10 };
              } else {
                return { ...thread, status: 'ACQUIRING' };
              }
            }
          }

          return thread;
        });

        return updated;
      });
    }, 600);

    return () => clearInterval(interval);
  }, [threads, isMutexLocked]);

  const calculateDiskSchedule = (reqs, headPos, algo) => {
    let queue = [...reqs];
    let head = headPos;
    let sequence = [head];
    let totalDist = 0;

    if (queue.length === 0) return { sequence: [head], totalDist: 0 };

    if (algo === "FCFS") {
      queue.forEach(req => {
        totalDist += Math.abs(req - head);
        head = req;
        sequence.push(head);
      });
    } else if (algo === "SSTF") {
      let unvisited = [...queue];
      let curr = head;
      while (unvisited.length > 0) {
        unvisited.sort((a, b) => Math.abs(a - curr) - Math.abs(b - curr));
        let closest = unvisited.shift();
        totalDist += Math.abs(closest - curr);
        curr = closest;
        sequence.push(curr);
      }
    } else if (algo === "SCAN") {
      let left = queue.filter(r => r < head).sort((a, b) => b - a);
      let right = queue.filter(r => r >= head).sort((a, b) => a - b);
      
      right.forEach(r => {
        totalDist += Math.abs(r - head);
        head = r;
        sequence.push(head);
      });
      if (right.length > 0) {
        totalDist += Math.abs((DISK_TRACK_SIZE - 1) - head);
        head = DISK_TRACK_SIZE - 1;
        sequence.push(head);
      }
      left.forEach(r => {
        totalDist += Math.abs(r - head);
        head = r;
        sequence.push(head);
      });
    } else if (algo === "C-SCAN") {
      let left = queue.filter(r => r < head).sort((a, b) => a - b);
      let right = queue.filter(r => r >= head).sort((a, b) => a - b);

      right.forEach(r => {
        totalDist += Math.abs(r - head);
        head = r;
        sequence.push(head);
      });
      if (right.length > 0) {
        totalDist += Math.abs((DISK_TRACK_SIZE - 1) - head);
        head = DISK_TRACK_SIZE - 1;
        sequence.push(head);
        totalDist += DISK_TRACK_SIZE - 1;
        head = 0;
        sequence.push(head);
      }
      left.forEach(r => {
        totalDist += Math.abs(r - head);
        head = r;
        sequence.push(head);
      });
    }

    return { sequence, totalDist };
  };

  const runDiskScheduler = () => {
    setIsSchedulingRunning(true);
    const { sequence, totalDist } = calculateDiskSchedule(requestQueue, initialHead, algorithm);
    setSeekSequence(sequence);
    setTotalSeekDistance(totalDist);
    addLog(`Running ${algorithm} Disk Scheduling over ${requestQueue.length} sector requests. Total distance: ${totalDist} tracks.`, "DISK", "SUCCESS");

    let step = 0;
    const interval = setInterval(() => {
      if (step < sequence.length) {
        setAnimatedHead(sequence[step]);
        step++;
      } else {
        clearInterval(interval);
        setIsSchedulingRunning(false);
      }
    }, 400);
  };

  const runFullPipeline = async () => {
    if (pipelineRunning) return;

    setPipelineRunning(true);
    setActiveTab("pipeline");
    addLog("--- STARTED FULL SYSTEM PIPELINE SIMULATION ---", "PIPELINE", "WARN");

    const runStep = (stepNumber, logMessage, module, type, duration) => new Promise(resolve => {
      setPipelineStep(stepNumber);
      if (logMessage) addLog(logMessage, module, type);
      setTimeout(resolve, duration);
    });

    try {
      const demoPath = "/projects/live_demo.log";
      let demoFile = findFileByPath(demoPath, fileSystem);

      if (!demoFile) {
        const content = "VFS NEXUS integrated pipeline demonstration.\\nCreate → Allocate → Synchronize → Schedule → Commit.";
        const requiredBlocks = 3;
        const freeBlockIds = blockMap.filter(b => b.status === "free").map(b => b.id);

        if (freeBlockIds.length < requiredBlocks) {
          addLog("Pipeline stopped: insufficient free disk blocks.", "PIPELINE", "ERROR");
          return;
        }

        const allocatedBlocks = freeBlockIds.slice(0, requiredBlocks);
        const tracks = allocatedBlocks.map(b => (b * 3 + 12) % DISK_TRACK_SIZE);
        demoFile = {
          id: "pipeline-" + Date.now(),
          name: "live_demo.log",
          type: "file",
          path: demoPath,
          isOpen: true,
          size: 12,
          blocks: allocatedBlocks,
          permissions: "rw-r--r--",
          owner: "pipeline",
          content,
          tracks,
          createdAt: new Date().toISOString()
        };

        const updateNodes = (nodes) => nodes.map(node => {
          if (node.path === "/projects" && node.type === "directory") {
            return { ...node, children: [...(node.children || []), demoFile] };
          }
          if (node.children) return { ...node, children: updateNodes(node.children) };
          return node;
        });

        setFileSystem(prev => updateNodes(prev));
        addLog(`[PIPELINE STEP 1] Created file '${demoPath}'`, "VFS", "SUCCESS");
        await runStep(1, null, "VFS", "INFO", 600);
        addLog(`[PIPELINE STEP 2] Allocated Indexed Virtual Disk Blocks: [${allocatedBlocks.join(", ")}]`, "VFS", "INFO");
        await runStep(2, null, "VFS", "INFO", 600);
      } else {
        addLog(`[PIPELINE STEP 1] Reusing existing file '${demoPath}'`, "VFS", "INFO");
        await runStep(1, null, "VFS", "INFO", 400);
        addLog(`[PIPELINE STEP 2] Existing indexed blocks: [${demoFile.blocks.join(", ")}]`, "VFS", "INFO");
        await runStep(2, null, "VFS", "INFO", 400);
      }

      setConcurrencyTargetFile(demoPath);
      setThreads([
        { id: `T${Date.now()}-R1`, type: "reader", status: "WAITING", progress: 0, createdAt: new Date().toISOString() },
        { id: `T${Date.now()}-R2`, type: "reader", status: "WAITING", progress: 0, createdAt: new Date().toISOString() },
        { id: `T${Date.now()}-W1`, type: "writer", status: "WAITING", progress: 0, createdAt: new Date().toISOString() }
      ]);
      setActiveReadersCount(0);
      setActiveWriter(null);
      setIsMutexLocked(false);
      addLog("[PIPELINE STEP 3] Spawned 2 Reader and 1 Writer Threads.", "MUTEX", "INFO");
      await runStep(3, null, "MUTEX", "INFO", 600);

      addLog("[PIPELINE STEP 4] Readers-Writers Mutex resolving shared/exclusive access.", "MUTEX", "SUCCESS");
      await runStep(4, null, "MUTEX", "INFO", 1000);

      const generatedSectors = demoFile.tracks?.length ? demoFile.tracks : [35,112,168];
      setRequestQueue(generatedSectors);
      addLog(`[PIPELINE STEP 5] Extracted Disk Sector/Track Addresses: [${generatedSectors.join(", ")}]`, "DISK", "INFO");
      await runStep(5, null, "DISK", "INFO", 600);

      const scanResult = calculateDiskSchedule(generatedSectors, initialHead, "SCAN");
      setAlgorithm("SCAN");
      setSeekSequence(scanResult.sequence);
      setTotalSeekDistance(scanResult.totalDist);
      addLog(`[PIPELINE STEP 6] Executed SCAN optimization. Total seek distance: ${scanResult.totalDist} tracks.`, "DISK", "SUCCESS");

      let step = 0;
      await new Promise(resolve => {
        const timer = setInterval(() => {
          if (step < scanResult.sequence.length) {
            setAnimatedHead(scanResult.sequence[step++]);
          } else {
            clearInterval(timer);
            resolve();
          }
        }, 250);
      });
      await runStep(6, null, "DISK", "INFO", 300);

      addLog("[PIPELINE STEP 7] System State Synchronized Successfully. Full workflow finished!", "PIPELINE", "SUCCESS");
      await runStep(7, null, "PIPELINE", "SUCCESS", 700);
    } catch (err) {
      console.error("Pipeline Execution Error:", err);
      addLog(`Pipeline error: ${err.message}`, "PIPELINE", "ERROR");
    } finally {
      setIsMutexLocked(false);
      setActiveWriter(null);
      setActiveReadersCount(0);
      setPipelineStep(8);
      setPipelineRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-slate-200 font-sans flex flex-col antialiased selection:bg-cyan-500 selection:text-black">
      {/* TOP HEADER STATUS BAR */}
      <header className="h-14 border-b border-slate-800 bg-[#161b22]/90 backdrop-blur px-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Icon name="cpu" className="w-5 h-5 text-black" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-100 tracking-wide text-sm">VFS NEXUS</span>
              <span className="text-[10px] bg-cyan-950 text-cyan-400 border border-cyan-800/60 px-1.5 py-0.5 rounded font-mono">v3.8-HYBRID</span>
               <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono border ${
                 isHydrated ? "bg-emerald-950 text-emerald-400 border-emerald-800/60" : "bg-amber-950 text-amber-400 border-amber-800/60"
               }`}>
                 {isHydrated ? "STATE LOADED" : "LOADING STATE"}
               </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">Virtual File System & Disk Intelligence Simulator</p>
          </div>
        </div>

        {/* Real-time System KPIs */}
        <div className="hidden lg:flex items-center gap-6 text-xs font-mono">
          <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-md border border-slate-800">
            <Icon name="hardDrive" className="w-4 h-4 text-cyan-400" />
            <span className="text-slate-400">Disk Usage:</span>
            <span className="text-cyan-300 font-bold">{usedBlocksCount * BLOCK_SIZE_KB}KB / {TOTAL_BLOCKS * BLOCK_SIZE_KB}KB</span>
            <span className="text-slate-500">({Math.round((usedBlocksCount/TOTAL_BLOCKS)*100)}%)</span>
          </div>

          <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-md border border-slate-800">
            <Icon name="lock" className="w-4 h-4 text-purple-400" />
            <span className="text-slate-400">Mutex:</span>
            <span className={`font-bold ${mutexState.color}`}>
              {mutexState.text}
            </span>
          </div>

          <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-md border border-slate-800">
            <Icon name="disc" className="w-4 h-4 text-emerald-400" />
            <span className="text-slate-400">Head Pos:</span>
            <span className="text-emerald-300 font-bold">Track {animatedHead}</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button 
            onClick={runFullPipeline}
            disabled={pipelineRunning}
            className="flex items-center gap-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-semibold text-xs px-3 py-1.5 rounded-md transition shadow-md shadow-cyan-500/10 disabled:opacity-50"
          >
            <Icon name="zap" className="w-4 h-4" />
            <span>{pipelineRunning ? "Simulating..." : "Run System Demo"}</span>
          </button>

          <button 
            onClick={() => {
               setFileSystem(INITIAL_FILESYSTEM);
               setSelectedFile(INITIAL_FILESYSTEM[0].children[0]);
               setThreads([]);
               setActiveReadersCount(0);
               setActiveWriter(null);
               setIsMutexLocked(false);
               setRequestQueue([82, 170, 43, 140, 24, 16, 190]);
               setInitialHead(50);
               setAnimatedHead(50);
               setTotalSeekDistance(0);
               setSeekSequence([]);
               setPipelineStep(0);
               setAlgorithm("SCAN");
               addLog("Reset Virtual Disk & Kernel State to default.", "KERNEL", "WARN");
             }}
             className="p-1.5 text-slate-400 hover:text-slate-200 bg-slate-800/60 hover:bg-slate-800 rounded-md border border-slate-700/50 transition"
            title="Reset Simulation State"
          >
            <Icon name="rotateCcw" className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* MAIN LAYOUT WRAPPER */}
      <div className="flex-1 flex overflow-hidden">
        {/* SIDEBAR NAVIGATION */}
        <aside className="w-60 bg-[#161b22] border-r border-slate-800 flex flex-col shrink-0">
          <div className="p-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Kernel Control Modules
          </div>
          
          <nav className="flex-1 space-y-1 px-2">
            {[
              { id: "overview", label: "Dashboard Overview", icon: "grid", badge: null },
              { id: "vfs", label: "Virtual File System", icon: "folder", badge: `${getAllFiles().length} files` },
              { id: "concurrency", label: "Concurrency Lab", icon: "lock", badge: threads.filter(t => t.status !== 'COMPLETED').length ? `${threads.filter(t => t.status !== 'COMPLETED').length} active` : null },
              { id: "scheduler", label: "Disk Scheduler", icon: "disc", badge: algorithm },
              { id: "pipeline", label: "Pipeline Simulation", icon: "zap", badge: pipelineRunning ? "RUNNING" : "READY" },
              { id: "diskmap", label: "Disk Allocation Map", icon: "hardDrive", badge: `${usedBlocksCount}/${TOTAL_BLOCKS}` },
              { id: "logs", label: "Kernel Terminal Logs", icon: "terminal", badge: `${logs.length}` }
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition ${
                  activeTab === item.id 
                    ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30" 
                    : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon name={item.icon} className={`w-4 h-4 ${activeTab === item.id ? "text-cyan-400" : "text-slate-400"}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                    activeTab === item.id ? "bg-cyan-500/20 text-cyan-300" : "bg-slate-800 text-slate-400"
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>

          {/* Quick System Info Widget */}
          <div className="p-3 m-2 rounded-lg bg-slate-900/90 border border-slate-800 text-xs space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span>System Status</span>
              <span className="flex items-center gap-1 text-emerald-400 font-mono text-[10px]">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> ONLINE
              </span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-cyan-500 h-full transition-all duration-300" 
                style={{ width: `${(usedBlocksCount / TOTAL_BLOCKS) * 100}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>Used: {usedBlocksCount} blks</span>
              <span>Free: {freeBlocksCount} blks</span>
            </div>
          </div>
        </aside>

        {/* TAB CONTENT AREA */}
        <main className="flex-1 bg-[#0d1117] overflow-y-auto p-6">
          
          {/* ================= OVERVIEW DASHBOARD ================= */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                  <span>System Control Dashboard</span>
                  <span className="text-xs bg-slate-800 text-cyan-400 px-2 py-0.5 rounded border border-slate-700 font-mono">Live Monitoring</span>
                </h1>
                <p className="text-xs text-slate-400">Unified Real-time Operating System Storage, Synchronization & Disk Metrics.</p>
               <p className="text-[11px] text-emerald-400 mt-1">Persistent storage: SQLite • Files • Blocks • Logs</p>
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-[#161b22] border border-slate-800 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-400 font-medium">Virtual Storage</p>
                    <p className="text-xl font-bold font-mono text-cyan-400 mt-1">{usedBlocksCount * BLOCK_SIZE_KB} / {TOTAL_BLOCKS * BLOCK_SIZE_KB} KB</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{freeBlocksCount} blocks available</p>
                  </div>
                  <div className="p-3 bg-cyan-500/10 rounded-lg text-cyan-400">
                    <Icon name="hardDrive" className="w-6 h-6" />
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#161b22] border border-slate-800 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-400 font-medium">Virtual Files</p>
                    <p className="text-xl font-bold font-mono text-purple-400 mt-1">{getAllFiles().length} Active</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Across 3 root directories</p>
                  </div>
                  <div className="p-3 bg-purple-500/10 rounded-lg text-purple-400">
                    <Icon name="folder" className="w-6 h-6" />
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#161b22] border border-slate-800 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-400 font-medium">Active Mutex Threads</p>
                    <p className="text-xl font-bold font-mono text-amber-400 mt-1">
                      {threads.filter(t => t.status !== 'COMPLETED').length} Enqueued
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{activeReadersCount} readers, {activeWriter ? 1 : 0} writer</p>
                  </div>
                  <div className="p-3 bg-amber-500/10 rounded-lg text-amber-400">
                    <Icon name="users" className="w-6 h-6" />
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#161b22] border border-slate-800 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-400 font-medium">Total Seek Distance</p>
                    <p className="text-xl font-bold font-mono text-emerald-400 mt-1">{totalSeekDistance} Tracks</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Algorithm: {algorithm}</p>
                  </div>
                  <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-400">
                    <Icon name="disc" className="w-6 h-6" />
                  </div>
                </div>
              </div>

              {/* Integrated OS Pipeline Visual Diagram */}
              <div className="p-5 rounded-xl bg-[#161b22] border border-slate-800 space-y-4">
                <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <Icon name="activity" className="w-4 h-4 text-cyan-400" />
                  <span>Integrated Unified OS Pipeline Architecture</span>
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-center">
                  {[
                    { title: "1. VFS File Ops", sub: "User File Operations", color: "border-cyan-500/40 bg-cyan-950/20 text-cyan-300" },
                    { title: "2. Block Allocator", sub: "Indexed Block Mapping", color: "border-blue-500/40 bg-blue-950/20 text-blue-300" },
                    { title: "3. Reader-Writer Lock", sub: "Mutex Synchronization", color: "border-purple-500/40 bg-purple-950/20 text-purple-300" },
                    { title: "4. Disk Queue", sub: "Sector Request Generation", color: "border-amber-500/40 bg-amber-950/20 text-amber-300" },
                    { title: "5. Disk Track Seek", sub: `${algorithm} Head Optimization`, color: "border-emerald-500/40 bg-emerald-950/20 text-emerald-300" }
                  ].map((step, idx) => (
                    <div key={idx} className={`p-3 rounded-lg border ${step.color} flex flex-col items-center justify-center relative`}>
                      <span className="font-bold text-xs">{step.title}</span>
                      <span className="text-[10px] text-slate-400 mt-1">{step.sub}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mini Block Allocation Grid Preview */}
              <div className="p-5 rounded-xl bg-[#161b22] border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                    <Icon name="hardDrive" className="w-4 h-4 text-cyan-400" />
                    <span>Live Disk Block Allocation Snapshot (64 Blocks)</span>
                  </h2>
                  <button 
                    onClick={() => setActiveTab("diskmap")}
                    className="text-xs text-cyan-400 hover:underline flex items-center gap-1"
                  >
                    Full Allocation Map <Icon name="chevronRight" className="w-3 h-3" />
                  </button>
                </div>

                <div className="grid grid-cols-16 gap-1.5 font-mono text-[10px]">
                  {blockMap.map(b => {
                    let color = "bg-slate-800 border-slate-700 text-slate-500";
                    if (b.status === "reserved") color = "bg-purple-900/60 border-purple-500 text-purple-200";
                    if (b.status === "allocated") color = "bg-cyan-900/50 border-cyan-500 text-cyan-200";
                    if (b.status === "reading") color = "bg-emerald-900/80 border-emerald-400 text-emerald-200 animate-pulse";
                    if (b.status === "writing") color = "bg-amber-900/80 border-amber-400 text-amber-200 animate-pulse";

                    return (
                      <div
                        key={b.id}
                        onClick={() => { setSelectedBlockInfo(b); setActiveTab("diskmap"); }}
                        className={`h-7 rounded border flex items-center justify-center cursor-pointer transition hover:scale-105 ${color}`}
                        title={`Block ${b.id}: ${b.status} (${b.fileName || 'Free'})`}
                      >
                        {b.id}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ================= MODULE 1: VIRTUAL FILE SYSTEM ================= */}
          {activeTab === "vfs" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                    <Icon name="folder" className="w-5 h-5 text-cyan-400" />
                    <span>Virtual File System & Block Allocator</span>
                  </h1>
                  <p className="text-xs text-slate-400">Manage hierarchical directories, inspect permissions, and view raw disk block addresses.</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setShowNewModal(true); setNewFileType("file"); }}
                    className="flex items-center gap-1 bg-cyan-500 hover:bg-cyan-400 text-black font-medium text-xs px-3 py-1.5 rounded-lg transition"
                  >
                    <Icon name="plus" className="w-4 h-4" /> New File
                  </button>
                  <button
                    onClick={() => { setShowNewModal(true); setNewFileType("directory"); }}
                    className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-3 py-1.5 rounded-lg border border-slate-700 transition"
                  >
                    <Icon name="plus" className="w-4 h-4" /> New Directory
                  </button>
                </div>
              </div>

              {/* VS Code Style File Explorer Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[600px]">
                {/* File Tree Left Pane */}
                <div className="lg:col-span-4 bg-[#161b22] border border-slate-800 rounded-xl p-3 flex flex-col overflow-y-auto font-mono text-xs">
                  <div className="text-[11px] font-bold text-slate-400 uppercase mb-2 tracking-wider flex items-center justify-between">
                    <span>EXPLORER (VFS ROOT)</span>
                    <span className="text-[10px] text-cyan-400 font-normal">Indexed Allocation</span>
                  </div>

                  <div className="space-y-1">
                    {fileSystem.map(node => (
                      <DirectoryTreeNode 
                        key={node.id} 
                        node={node} 
                        selectedFile={selectedFile}
                        onSelectFile={(f) => setSelectedFile(f)}
                        onDelete={(path) => handleDeleteItem(path)}
                      />
                    ))}
                  </div>
                </div>

                {/* File Details & Editor Right Pane */}
                <div className="lg:col-span-8 bg-[#161b22] border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                  {selectedFile ? (
                    <div className="flex-1 flex flex-col space-y-4">
                      {/* Header bar */}
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <div className="flex items-center gap-2">
                          <Icon name="fileCode" className="w-5 h-5 text-cyan-400" />
                          <div>
                            <h2 className="text-sm font-bold text-slate-100">{selectedFile.name}</h2>
                            <p className="text-[11px] font-mono text-slate-400">{selectedFile.path}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 text-xs font-mono">
                          <span className="bg-slate-900 px-2 py-1 rounded border border-slate-800 text-slate-300">
                            Size: {selectedFile.size} KB
                          </span>
                          <span className="bg-slate-900 px-2 py-1 rounded border border-slate-800 text-purple-300">
                            Permissions: {selectedFile.permissions}
                          </span>
                        </div>
                      </div>

                      {/* Allocated Blocks Display */}
                      <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-800">
                        <p className="text-xs font-bold text-slate-300 mb-2 flex items-center gap-2">
                          <Icon name="hardDrive" className="w-4 h-4 text-cyan-400" />
                          <span>Allocated Disk Blocks & Track Addresses:</span>
                        </p>
                        <div className="flex flex-wrap gap-2 font-mono text-xs">
                          {selectedFile.blocks && selectedFile.blocks.map((blk, idx) => (
                            <span key={blk} className="px-2.5 py-1 bg-cyan-950/80 border border-cyan-800 text-cyan-300 rounded flex items-center gap-1.5">
                              <span>Block #{blk}</span>
                              <span className="text-[10px] text-slate-500">(Track {selectedFile.tracks?.[idx] || blk * 3})</span>
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Content Editor */}
                      <div className="flex-1 flex flex-col">
                        <label className="text-xs font-medium text-slate-400 mb-1">File Contents:</label>
                        <textarea
                          value={selectedFile.content || ""}
                          onChange={(e) => handleUpdateFileContent(e.target.value)}
                          className="w-full flex-1 bg-[#0d1117] border border-slate-800 rounded-lg p-3 font-mono text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50 resize-none"
                          placeholder="Type content..."
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-xs">
                      <Icon name="file" className="w-12 h-12 stroke-1 mb-2 text-slate-600" />
                      <p>Select a file from the VFS tree to inspect metadata and block allocation.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ================= MODULE 2: CONCURRENCY LAB ================= */}
          {activeTab === "concurrency" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                    <Icon name="lock" className="w-5 h-5 text-purple-400" />
                    <span>Concurrency Lab — Readers-Writers Synchronization</span>
                  </h1>
                  <p className="text-xs text-slate-400">Simulate thread safety, mutual exclusion, and semaphore queues on actual VFS files.</p>
                </div>

                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="text-slate-400">Target VFS File:</span>
                  <select 
                    value={concurrencyTargetFile}
                    onChange={(e) => setConcurrencyTargetFile(e.target.value)}
                    className="bg-slate-900 border border-slate-800 text-cyan-300 rounded px-2.5 py-1 focus:outline-none"
                  >
                    {getAllFiles().map(f => (
                      <option key={f.path} value={f.path}>{f.path}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Status Dashboard Controls */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-[#161b22] border border-slate-800 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-400">Shared Read Lock Count</p>
                    <p className="text-2xl font-bold font-mono text-cyan-400 mt-1">{activeReadersCount} Readers</p>
                    <p className="text-[11px] text-slate-500">Concurrent reading permitted</p>
                  </div>
                  <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-lg">
                    <Icon name="users" className="w-6 h-6" />
                  </div>
                </div>

                <div className="p-4 bg-[#161b22] border border-slate-800 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-400">Writer Mutex Status</p>
                    <p className={`text-xl font-bold font-mono mt-1 ${mutexState.color}`}>
                      {mutexState.text}
                    </p>
                    <p className="text-[11px] text-slate-500">{activeWriter ? `Writer Thread: ${activeWriter}` : "No active writer"}</p>
                  </div>
                  <div className={`p-3 rounded-lg ${isMutexLocked ? "bg-amber-500/10 text-amber-400" : "bg-emerald-500/10 text-emerald-400"}`}>
                    <Icon name={isMutexLocked ? "lock" : "unlock"} className="w-6 h-6" />
                  </div>
                </div>

                <div className="p-4 bg-[#161b22] border border-slate-800 rounded-xl flex flex-col justify-between">
                  <p className="text-xs text-slate-400">Spawn Threads</p>
                  <div className="flex gap-2 mt-2">
                    <button 
                      onClick={() => addThread('reader')}
                      className="flex-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-semibold py-2 rounded-lg transition"
                    >
                      + Add Reader
                    </button>
                    <button 
                      onClick={() => addThread('writer')}
                      className="flex-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-semibold py-2 rounded-lg transition"
                    >
                      + Add Writer
                    </button>
                  </div>
                </div>
              </div>

              {/* Thread Queue Display Cards */}
              <div className="p-5 bg-[#161b22] border border-slate-800 rounded-xl space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-slate-200">Enqueued Thread Operations</h2>
                  <button 
                    onClick={() => {
                      setThreads([]);
                      setActiveReadersCount(0);
                      setActiveWriter(null);
                      setIsMutexLocked(false);
                    }}
                    className="text-xs text-slate-400 hover:text-slate-200 underline"
                  >
                    Clear Queue
                  </button>
                </div>

                {threads.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-xs font-mono">
                    No active threads in queue. Click "+ Add Reader" or "+ Add Writer" above.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 font-mono">
                    {threads.map(t => {
                      let badgeColor = "bg-slate-800 text-slate-400 border-slate-700";
                      if (t.status === 'READING') badgeColor = "bg-cyan-950 text-cyan-300 border-cyan-700 animate-pulse";
                      if (t.status === 'WRITING') badgeColor = "bg-amber-950 text-amber-300 border-amber-700 animate-pulse";
                      if (t.status === 'ACQUIRING') badgeColor = "bg-purple-950 text-purple-300 border-purple-800";
                      if (t.status === 'COMPLETED') badgeColor = "bg-emerald-950 text-emerald-400 border-emerald-800";

                      return (
                        <div key={t.id} className="p-3 bg-slate-900 border border-slate-800 rounded-lg flex flex-col justify-between space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-200">{t.id} ({t.type.toUpperCase()})</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded border ${badgeColor}`}>
                              {t.status}
                            </span>
                          </div>

                          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className={`h-full transition-all duration-300 ${
                                t.type === 'reader' ? "bg-cyan-400" : "bg-amber-400"
                              }`}
                              style={{ width: `${t.progress}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================= MODULE 3: DISK SCHEDULER ================= */}
          {activeTab === "scheduler" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                    <Icon name="disc" className="w-5 h-5 text-emerald-400" />
                    <span>Disk Track Scheduling Optimizer</span>
                  </h1>
                  <p className="text-xs text-slate-400">Optimize physical disk head movement across track sectors (0 to 199).</p>
                </div>

                <button
                  onClick={runDiskScheduler}
                  disabled={isSchedulingRunning}
                  className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs px-4 py-2 rounded-lg transition disabled:opacity-50"
                >
                  <Icon name="play" className="w-4 h-4" /> Run {algorithm} Algorithm
                </button>
              </div>

              {/* Controls Header */}
              <div className="p-4 bg-[#161b22] border border-slate-800 rounded-xl grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
                <div>
                  <label className="text-slate-400 block mb-1">Select Algorithm:</label>
                  <select 
                    value={algorithm}
                    onChange={(e) => setAlgorithm(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 text-emerald-300 rounded px-2.5 py-1.5 focus:outline-none"
                  >
                    <option value="SCAN">SCAN (Elevator)</option>
                    <option value="C-SCAN">C-SCAN (Circular SCAN)</option>
                    <option value="SSTF">SSTF (Shortest Seek Time First)</option>
                    <option value="FCFS">FCFS (First Come First Served)</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Initial Head Position (0-199):</label>
                  <input
                    type="number"
                    value={initialHead}
                    onChange={(e) => setInitialHead(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 text-slate-200 rounded px-2.5 py-1.5 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Track Requests Queue:</label>
                  <input
                    type="text"
                    value={requestQueue.join(", ")}
                    onChange={(e) => setRequestQueue(e.target.value.split(",").map(n => parseInt(n.trim())).filter(n => !isNaN(n)))}
                    className="w-full bg-slate-900 border border-slate-800 text-cyan-300 rounded px-2.5 py-1.5 focus:outline-none"
                  />
                </div>
              </div>

              {/* Disk Track Visualizer */}
              <div className="p-5 bg-[#161b22] border border-slate-800 rounded-xl space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-200">Disk Track Seek Animator (Track 0 to 199)</span>
                  <span className="font-mono text-emerald-400">Current Head: Track #{animatedHead}</span>
                </div>

                <div className="relative w-full bg-slate-900 h-10 rounded-lg border border-slate-800 flex items-center px-2">
                  {requestQueue.map(req => (
                    <div 
                      key={req}
                      className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-md shadow-cyan-500/50"
                      style={{ left: `${(req / DISK_TRACK_SIZE) * 100}%` }}
                      title={`Request Track #${req}`}
                    ></div>
                  ))}

                  <div 
                    className="absolute top-0 bottom-0 w-1 bg-emerald-400 shadow-lg shadow-emerald-400/80 transition-all duration-300 flex items-center justify-center"
                    style={{ left: `${(animatedHead / DISK_TRACK_SIZE) * 100}%` }}
                  >
                    <div className="w-3 h-3 bg-emerald-400 rounded-full border-2 border-black -top-1 absolute"></div>
                  </div>
                </div>

                <div className="flex justify-between text-[10px] font-mono text-slate-500 px-1">
                  <span>Track 0</span>
                  <span>Track 50</span>
                  <span>Track 100</span>
                  <span>Track 150</span>
                  <span>Track 199</span>
                </div>
              </div>

              {/* Performance Comparison Table */}
              <div className="p-5 bg-[#161b22] border border-slate-800 rounded-xl space-y-3">
                <h2 className="text-sm font-bold text-slate-200">Algorithm Performance Comparison</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400">
                        <th className="p-2">Algorithm</th>
                        <th className="p-2">Seek Order Sequence</th>
                        <th className="p-2">Total Head Movement</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {["SCAN", "C-SCAN", "SSTF", "FCFS"].map(alg => {
                        const { sequence, totalDist } = calculateDiskSchedule(requestQueue, initialHead, alg);
                        const isCurrent = alg === algorithm;
                        return (
                          <tr key={alg} className={isCurrent ? "bg-emerald-950/20 text-emerald-300" : "text-slate-300"}>
                            <td className="p-2 font-bold">{alg}</td>
                            <td className="p-2">{sequence.join(" → ")}</td>
                            <td className="p-2 font-bold">{totalDist} tracks</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ================= MODULE 4: PIPELINE SIMULATION ================= */}
          {activeTab === "pipeline" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                  <Icon name="zap" className="w-5 h-5 text-cyan-400" />
                  <span>Full System Pipeline Simulation Engine</span>
                </h1>
                <p className="text-xs text-slate-400">Automated end-to-end execution linking File Operations, Mutex Locks, and Disk Track Scheduling.</p>
              </div>

              <div className="space-y-3">
                {[
                  { step: 1, title: "1. Create File in VFS", desc: "Instantiate '/projects/live_demo.log' in directory tree." },
                  { step: 2, title: "2. Allocate Disk Storage", desc: "Assign indexed virtual disk blocks [14, 15, 16]." },
                  { step: 3, title: "3. Spawn Concurrent Threads", desc: "Enqueue 2 Reader threads & 1 Writer thread." },
                  { step: 4, title: "4. Mutex Lock Resolution", desc: "Enforce Readers-Writers mutual exclusion critical section." },
                  { step: 5, title: "5. Extract Disk Sectors", desc: "Map block IDs to physical disk track requests." },
                  { step: 6, title: "6. SCAN Head Optimization", desc: "Sort disk requests to minimize physical seek distance." },
                  { step: 7, title: "7. System Commit & Sync", desc: "Commit file writes and update VFS state." }
                ].map(s => {
                  const isActive = pipelineStep === s.step;
                  const isDone = pipelineStep > s.step;

                  return (
                    <div 
                      key={s.step} 
                      className={`p-4 rounded-xl border transition flex items-center justify-between ${
                        isActive 
                          ? "bg-cyan-950/30 border-cyan-500 text-cyan-200 shadow-lg shadow-cyan-500/10" 
                          : isDone 
                          ? "bg-slate-900/60 border-slate-800 text-slate-300" 
                          : "bg-[#161b22] border-slate-800/40 text-slate-500"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                          isDone ? "bg-emerald-500 text-black" : isActive ? "bg-cyan-500 text-black animate-pulse" : "bg-slate-800 text-slate-400"
                        }`}>
                          {isDone ? "✓" : s.step}
                        </div>
                        <div>
                          <p className="font-bold text-xs">{s.title}</p>
                          <p className="text-[11px] text-slate-400">{s.desc}</p>
                        </div>
                      </div>

                      {isActive && (
                        <span className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded font-mono animate-pulse">
                          EXECUTING
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ================= MODULE 5: DISK ALLOCATION MAP ================= */}
          {activeTab === "diskmap" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                  <Icon name="hardDrive" className="w-5 h-5 text-cyan-400" />
                  <span>Interactive Disk Allocation Map</span>
                </h1>
                <p className="text-xs text-slate-400">Click any block to inspect file assignment, status, and sector properties.</p>
              </div>

              <div className="p-5 bg-[#161b22] border border-slate-800 rounded-xl space-y-4">
                <div className="grid grid-cols-8 sm:grid-cols-16 gap-2 font-mono text-xs">
                  {blockMap.map(b => {
                    let color = "bg-slate-900 border-slate-800 text-slate-500";
                    if (b.status === "reserved") color = "bg-purple-900/50 border-purple-500 text-purple-200";
                    if (b.status === "allocated") color = "bg-cyan-900/50 border-cyan-500 text-cyan-200";
                    if (b.status === "reading") color = "bg-emerald-900/80 border-emerald-400 text-emerald-200 animate-pulse";
                    if (b.status === "writing") color = "bg-amber-900/80 border-amber-400 text-amber-200 animate-pulse";

                    return (
                      <div
                        key={b.id}
                        onClick={() => setSelectedBlockInfo(b)}
                        className={`h-10 rounded-lg border flex flex-col items-center justify-center cursor-pointer transition hover:scale-105 ${color}`}
                      >
                        <span className="font-bold text-[11px]">{b.id}</span>
                        <span className="text-[9px] opacity-75">{b.status.slice(0, 4)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {selectedBlockInfo && (
                <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl font-mono text-xs space-y-2">
                  <h3 className="font-bold text-cyan-400">Block Details: #{selectedBlockInfo.id}</h3>
                  <p className="text-slate-300">Status: <span className="text-slate-100 font-bold">{selectedBlockInfo.status.toUpperCase()}</span></p>
                  <p className="text-slate-300">Assigned File: <span className="text-cyan-300">{selectedBlockInfo.filePath || 'None'}</span></p>
                  <p className="text-slate-300">Block Size: 4096 Bytes (4 KB)</p>
                </div>
              )}
            </div>
          )}

          {/* ================= MODULE 6: LOGS ================= */}
          {activeTab === "logs" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                  <Icon name="terminal" className="w-5 h-5 text-cyan-400" />
                  <span>Kernel Terminal Console Logs</span>
                </h1>

                <button 
                  onClick={() => setLogs([])}
                  className="text-xs text-slate-400 hover:text-slate-200 bg-slate-800 px-3 py-1.5 rounded border border-slate-700"
                >
                  Clear Logs
                </button>
              </div>

              <div className="bg-[#0d1117] border border-slate-800 rounded-xl p-4 h-[550px] overflow-y-auto font-mono text-xs space-y-1.5">
                {logs.map(log => (
                  <div key={log.id} className="flex items-center gap-3">
                    <span className="text-slate-500">{log.timestamp}</span>
                    <span className="text-purple-400 font-bold">[{log.module}]</span>
                    <span className={`flex-1 ${
                      log.level === 'SUCCESS' ? 'text-emerald-400' :
                      log.level === 'ERROR' ? 'text-red-400' :
                      log.level === 'WARN' ? 'text-amber-400' : 'text-slate-300'
                    }`}>
                      {log.message}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </main>
      </div>

      {/* NEW ITEM MODAL */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#161b22] border border-slate-800 rounded-xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-slate-100">Create New {newFileType.toUpperCase()}</h3>
            
            <div className="space-y-3 font-mono text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Target Path:</label>
                <input 
                  type="text" 
                  value={targetParentPath} 
                  onChange={(e) => setTargetParentPath(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-slate-200 p-2 rounded focus:outline-none" 
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Item Name:</label>
                <input 
                  type="text" 
                  value={newItemName} 
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder={newFileType === "file" ? "example.txt" : "my_folder"}
                  className="w-full bg-slate-900 border border-slate-800 text-cyan-300 p-2 rounded focus:outline-none" 
                />
              </div>

              {newFileType === "file" && (
                <div>
                  <label className="text-slate-400 block mb-1">Initial Contents:</label>
                  <textarea 
                    value={newItemContent} 
                    onChange={(e) => setNewItemContent(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 text-slate-300 p-2 rounded h-20 focus:outline-none resize-none" 
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button 
                onClick={() => setShowNewModal(false)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200"
              >
                Cancel
              </button>
              <button 
                onClick={handleCreateFileOrFolder}
                className="px-4 py-1.5 text-xs bg-cyan-500 text-black font-bold rounded hover:bg-cyan-400"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Directory Tree Component
function DirectoryTreeNode({ node, selectedFile, onSelectFile, onDelete }) {
  const [isOpen, setIsOpen] = useState(node.isOpen || false);

  if (node.type === "file") {
    const isSelected = selectedFile && selectedFile.path === node.path;
    return (
      <div 
        onClick={() => onSelectFile(node)}
        className={`flex items-center justify-between px-2 py-1 rounded cursor-pointer transition ${
          isSelected ? "bg-cyan-500/20 text-cyan-300" : "hover:bg-slate-800/60 text-slate-300"
        }`}
      >
        <div className="flex items-center gap-2">
          <Icon name="fileCode" className="w-3.5 h-3.5 text-cyan-400" />
          <span>{node.name}</span>
        </div>
        <Icon 
          name="trash" 
          className="w-3 h-3 text-slate-500 hover:text-red-400 transition" 
          onClick={(e) => { e.stopPropagation(); onDelete(node.path); }} 
        />
      </div>
    );
  }

  return (
    <div className="space-y-0.5">
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between px-2 py-1 rounded cursor-pointer text-slate-300 hover:bg-slate-800/60"
      >
        <div className="flex items-center gap-1.5 font-bold text-slate-200">
          <Icon name={isOpen ? "chevronDown" : "chevronRight"} className="w-3.5 h-3.5 text-slate-500" />
          <Icon name={isOpen ? "folderOpen" : "folder"} className="w-3.5 h-3.5 text-purple-400" />
          <span>{node.name}</span>
        </div>
      </div>

      {isOpen && node.children && (
        <div className="pl-4 border-l border-slate-800 ml-2 space-y-1">
          {node.children.map(child => (
            <DirectoryTreeNode 
              key={child.id} 
              node={child} 
              selectedFile={selectedFile} 
              onSelectFile={onSelectFile} 
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}