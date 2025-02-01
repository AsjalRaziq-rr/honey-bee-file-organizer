import React, { useState, useCallback, useRef } from 'react';
import { FolderOpen, FileCheck, Trash2, FolderSearch, AlertCircle, Upload, Image, FileText, File, X, Maximize2, Download, Search, SlidersHorizontal, Share2, Link, Eye, Copy, LayoutGrid, List } from 'lucide-react';

// Move formatFileSize outside of App component so it can be used by all components
const formatFileSize = (bytes: number) => {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`;
};

interface FileItem {
  name: string;
  path: string;
  size: number;
  type: string;
  hash: string;
  isDuplicate?: boolean;
  lastModified: number;
  preview?: string;
  shareId?: string;
  shareUrl?: string;
}

interface FileFilters {
  search: string;
  type: string;
  dateRange: string;
  sizeRange: string;
}

interface PreviewModalProps {
  file: FileItem;
  onClose: () => void;
}

interface ShareModalProps {
  file: FileItem;
  onClose: () => void;
  onShare: (file: FileItem) => void;
}

function ShareModal({ file, onClose, onShare }: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-lg w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Share File</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-2">File name: {file.name}</p>
            <p className="text-sm text-gray-600 mb-4">Size: {formatFileSize(file.size)}</p>
          </div>

          {!file.shareUrl ? (
            <button
              onClick={() => onShare(file)}
              className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center justify-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              Generate Sharing Link
            </button>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  View Link
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={file.shareUrl}
                    readOnly
                    className="flex-1 p-2 border border-gray-300 rounded-md bg-gray-50"
                  />
                  <button
                    onClick={() => handleCopy(file.shareUrl!)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-md flex items-center gap-1"
                  >
                    <Copy className="w-4 h-4" />
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Download Link
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={`${file.shareUrl}?download=true`}
                    readOnly
                    className="flex-1 p-2 border border-gray-300 rounded-md bg-gray-50"
                  />
                  <button
                    onClick={() => handleCopy(`${file.shareUrl}?download=true`)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-md flex items-center gap-1"
                  >
                    <Copy className="w-4 h-4" />
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PreviewModal({ file, onClose }: PreviewModalProps) {
  const isImage = file.type.startsWith('image/');
  const isText = file.type.startsWith('text/') || 
                file.type === 'application/json' ||
                file.name.endsWith('.md') ||
                file.name.endsWith('.txt');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">{file.name}</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">
          {isImage ? (
            <img
              src={file.preview}
              alt={file.name}
              className="max-w-full max-h-[60vh] mx-auto object-contain"
            />
          ) : isText && file.preview ? (
            <pre className="whitespace-pre-wrap font-mono text-sm bg-gray-50 p-4 rounded-lg max-h-[60vh] overflow-auto">
              {file.preview}
            </pre>
          ) : (
            <div className="text-center py-12">
              <File className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">Preview not available for this file type</p>
            </div>
          )}
        </div>
        <div className="p-4 border-t bg-gray-50 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            <p>Type: {file.type || 'Unknown'}</p>
            <p>Size: {formatFileSize(file.size)}</p>
          </div>
          {file.preview && (
            <a
              href={file.preview}
              download={file.name}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Download className="w-4 h-4" />
              Download
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function App() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [deletedFiles, setDeletedFiles] = useState<FileItem[]>([]);
  const [scanning, setScanning] = useState(false);
  const [step, setStep] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [shareFile, setShareFile] = useState<FileItem | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'honeycomb'>('list');
  const [filters, setFilters] = useState<FileFilters>({
    search: '',
    type: '',
    dateRange: '',
    sizeRange: '',
  });
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const calculateHash = async (file: File): Promise<string> => {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const generatePreview = async (file: File): Promise<string | undefined> => {
    if (file.type.startsWith('image/')) {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    } else if (
      file.type.startsWith('text/') ||
      file.type === 'application/json' ||
      file.name.endsWith('.md') ||
      file.name.endsWith('.txt')
    ) {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsText(file);
      });
    }
    return undefined;
  };

  const processFiles = async (items: DataTransferItemList | FileList) => {
    const fileList: FileItem[] = [];
    const hashMap = new Map<string, boolean>();
    let processedFiles = 0;

    const processItem = async (item: File) => {
      const [hash, preview] = await Promise.all([
        calculateHash(item),
        generatePreview(item)
      ]);
      
      const isDuplicate = hashMap.has(hash);
      
      if (!isDuplicate) {
        hashMap.set(hash, true);
      }

      fileList.push({
        name: item.name,
        path: item.webkitRelativePath || item.name,
        size: item.size,
        type: item.type,
        hash,
        isDuplicate,
        lastModified: item.lastModified,
        preview
      });

      processedFiles++;
      setProgress(Math.round((processedFiles / (items.length || 1)) * 100));
    };

    if (items instanceof FileList) {
      await Promise.all(Array.from(items).map(processItem));
    } else {
      const files = Array.from(items)
        .filter(item => item.kind === 'file')
        .map(item => item.getAsFile())
        .filter((file): file is File => file !== null);
      
      await Promise.all(files.map(processItem));
    }

    return fileList;
  };

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setProgress(0);
    setScanning(true);
    
    const fileList = await processFiles(e.dataTransfer.items);
    setFiles(fileList);
    setScanning(false);
    setStep(2);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (e.currentTarget === dropZoneRef.current) {
      setIsDragging(false);
    }
  }, []);

  const handleRemoveDuplicate = (path: string) => {
    const fileToRemove = files.find(file => file.path === path);
    if (fileToRemove) {
      setDeletedFiles(prev => [...prev, fileToRemove]);
      setFiles(files.filter(file => file.path !== path));
    }
  };

  const handleFolderSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setProgress(0);
      setScanning(true);
      const fileList = await processFiles(e.target.files);
      setFiles(fileList);
      setScanning(false);
      setStep(2);
    }
  };

  const handleApplyChanges = () => {
    const duplicates = files.filter(file => file.isDuplicate);
    setDeletedFiles(prev => [...prev, ...duplicates]);
    setFiles(files.filter(file => !file.isDuplicate));
    setStep(3);
  };

  const handleShare = (file: FileItem) => {
    const shareId = crypto.randomUUID();
    const shareUrl = `${window.location.origin}/share/${shareId}`;
    
    const updatedFile = {
      ...file,
      shareId,
      shareUrl,
    };

    setFiles(files.map(f => f.path === file.path ? updatedFile : f));
    setShareFile(updatedFile);
  };

  const getFileIcon = (file: FileItem) => {
    if (file.type.startsWith('image/')) {
      return <Image className="w-5 h-5" />;
    } else if (
      file.type.startsWith('text/') ||
      file.type === 'application/json' ||
      file.name.endsWith('.md') ||
      file.name.endsWith('.txt')
    ) {
      return <FileText className="w-5 h-5" />;
    }
    return <File className="w-5 h-5" />;
  };

  const filterFiles = (files: FileItem[]): FileItem[] => {
    return files.filter(file => {
      const matchesSearch = file.name.toLowerCase().includes(filters.search.toLowerCase()) ||
                          file.path.toLowerCase().includes(filters.search.toLowerCase());
      
      const matchesType = !filters.type || file.type.startsWith(filters.type);
      
      const matchesDate = !filters.dateRange || (() => {
        const date = new Date(file.lastModified);
        const now = new Date();
        switch (filters.dateRange) {
          case 'today':
            return date.toDateString() === now.toDateString();
          case 'week':
            const weekAgo = new Date(now.setDate(now.getDate() - 7));
            return date >= weekAgo;
          case 'month':
            const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
            return date >= monthAgo;
          default:
            return true;
        }
      })();
      
      const matchesSize = !filters.sizeRange || (() => {
        switch (filters.sizeRange) {
          case 'small':
            return file.size < 1024 * 1024; // < 1MB
          case 'medium':
            return file.size >= 1024 * 1024 && file.size < 100 * 1024 * 1024; // 1MB - 100MB
          case 'large':
            return file.size >= 100 * 1024 * 1024; // > 100MB
          default:
            return true;
        }
      })();

      return matchesSearch && matchesType && matchesDate && matchesSize;
    });
  };

  const renderFileInHoneycomb = (file: FileItem) => {
    return (
      <div
        key={file.path}
        className={`honeycomb-cell ${file.isDuplicate ? 'honeycomb-cell-duplicate' : ''}`}
      >
        <div className="honeycomb-content">
          <div className="honeycomb-preview">
            {file.type.startsWith('image/') && file.preview ? (
              <img
                src={file.preview}
                alt={file.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex items-center justify-center w-full h-full bg-gray-50">
                {getFileIcon(file)}
              </div>
            )}
          </div>
          <div className="honeycomb-details">
            <p className="font-medium text-gray-900 truncate" title={file.name}>
              {file.name}
            </p>
            <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
          </div>
          <div className="honeycomb-actions">
            {file.preview && (
              <button
                onClick={() => setSelectedFile(file)}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-md"
                title="Preview"
              >
                <Eye className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => setShareFile(file)}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-md"
              title="Share"
            >
              <Share2 className="w-4 h-4" />
            </button>
            {file.isDuplicate && (
              <button
                onClick={() => handleRemoveDuplicate(file.path)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                title="Remove"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
          {file.shareUrl && (
            <div className="honeycomb-share-status">
              <Link className="w-3 h-3" />
            </div>
          )}
          {file.isDuplicate && (
            <div className="honeycomb-duplicate-badge">
              <AlertCircle className="w-3 h-3" />
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderFileList = (file: FileItem) => {
    return (
      <div
        key={file.path}
        className={`p-4 rounded-lg border ${
          file.isDuplicate ? 'border-orange-200 bg-orange-50' : 'border-gray-200'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {file.isDuplicate && (
              <AlertCircle className="w-5 h-5 text-orange-500" />
            )}
            <div className="flex items-center space-x-3">
              {file.type.startsWith('image/') && file.preview ? (
                <img
                  src={file.preview}
                  alt={file.name}
                  className="w-12 h-12 object-cover rounded"
                />
              ) : (
                <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                  {getFileIcon(file)}
                </div>
              )}
              <div>
                <p className="font-medium text-gray-900">{file.name}</p>
                <p className="text-sm text-gray-500">{file.path}</p>
                <div className="flex space-x-4 text-xs text-gray-400">
                  <p>Last modified: {new Date(file.lastModified).toLocaleString()}</p>
                  <p>Size: {formatFileSize(file.size)}</p>
                  <p className="font-mono">Hash: {file.hash.slice(0, 8)}...</p>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {file.preview && (
              <button
                onClick={() => setSelectedFile(file)}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-md"
                title="Preview"
              >
                <Eye className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={() => setShareFile(file)}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-md"
              title="Share"
            >
              <Share2 className="w-5 h-5" />
            </button>
            {file.isDuplicate && (
              <button
                onClick={() => handleRemoveDuplicate(file.path)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                title="Remove"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
        {file.shareUrl && (
          <div className="mt-2 p-2 bg-gray-50 rounded-md flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Link className="w-4 h-4" />
              Shared
            </div>
            <button
              onClick={() => setShareFile(file)}
              className="text-sm text-blue-600 hover:underline"
            >
              View sharing options
            </button>
          </div>
        )}
      </div>
    );
  };

  const filteredFiles = filterFiles(files);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">File Organization Assistant</h1>
            <p className="text-lg text-gray-600">Keep your files organized and optimized</p>
          </div>

          {/* Steps */}
          <div className="flex justify-between mb-12">
            {[1, 2, 3].map((stepNumber) => (
              <div
                key={stepNumber}
                className={`flex-1 text-center ${
                  step >= stepNumber ? 'text-blue-600' : 'text-gray-400'
                }`}
              >
                <div className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center mb-2 ${
                  step >= stepNumber ? 'bg-blue-100' : 'bg-gray-100'
                }`}>
                  {stepNumber === 1 && <FolderOpen className="w-5 h-5" />}
                  {stepNumber === 2 && <FolderSearch className="w-5 h-5" />}
                  {stepNumber === 3 && <FileCheck className="w-5 h-5" />}
                </div>
                <p className="text-sm font-medium">Step {stepNumber}</p>
              </div>
            ))}
          </div>

          {/* Main Content */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            {step === 1 && (
              <div 
                ref={dropZoneRef}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`space-y-6 ${
                  isDragging 
                    ? 'border-2 border-dashed border-blue-500 bg-blue-50' 
                    : 'border-2 border-dashed border-gray-300'
                } rounded-lg p-8 transition-colors duration-200`}
              >
                <div className="text-center">
                  <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {isDragging ? 'Drop folder here' : 'Drag & drop a folder here'}
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">or</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    webkitdirectory=""
                    directory=""
                    multiple
                    className="hidden"
                    onChange={handleFileInputChange}
                  />
                  <button
                    onClick={handleFolderSelect}
                    disabled={scanning}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
                  >
                    Select Folder
                  </button>
                  {scanning && (
                    <div className="mt-4">
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">Scanning files... {progress}%</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <div className="mb-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        placeholder="Search files..."
                        value={filters.search}
                        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    </div>
                    <button
                      onClick={() => setViewMode(viewMode === 'list' ? 'honeycomb' : 'list')}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-md"
                      title={viewMode === 'list' ? 'Switch to Honeycomb View' : 'Switch to List View'}
                    >
                      {viewMode === 'list' ? (
                        <LayoutGrid className="w-5 h-5" />
                      ) : (
                        <List className="w-5 h-5" />
                      )}
                    </button>
                    <button
                      onClick={() => setShowFilters(!showFilters)}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-md flex items-center gap-2"
                    >
                      <SlidersHorizontal className="w-5 h-5" />
                      Filters
                    </button>
                  </div>

                  {showFilters && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          File Type
                        </label>
                        <select
                          value={filters.type}
                          onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                          className="w-full p-2 border border-gray-300 rounded-md"
                        >
                          <option value="">All Types</option>
                          <option value="image/">Images</option>
                          <option value="text/">Text</option>
                          <option value="application/">Documents</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Date Modified
                        </label>
                        <select
                          value={filters.dateRange}
                          onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
                          className="w-full p-2 border border-gray-300 rounded-md"
                        >
                          <option value="">Any Time</option>
                          <option value="today">Today</option>
                          <option value="week">Last Week</option>
                          <option value="month">Last Month</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          File Size
                        </label>
                        <select
                          value={filters.sizeRange}
                          onChange={(e) => setFilters({ ...filters, sizeRange: e.target.value })}
                          className="w-full p-2 border border-gray-300 rounded-md"
                        >
                          <option value="">Any Size</option>
                          <option value="small">Small (&lt; 1MB)</option>
                          <option value="medium">Medium (1MB - 100MB)</option>
                          <option value="large">Large (&gt; 100MB)</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {viewMode === 'list' ? (
                  <div className="space-y-4">
                    {filteredFiles.map(renderFileList)}
                  </div>
                ) : (
                  <div className="honeycomb-grid">
                    {filteredFiles.map(renderFileInHoneycomb)}
                  </div>
                )}

                <button
                  onClick={handleApplyChanges}
                  className="mt-6 w-full py-3 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Apply Changes
                </button>
              </div>
            )}

            {step === 3 && (
              <div className="text-center">
                <FileCheck className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Organization Complete!</h3>
                <div className="mb-6 text-left">
                  <p className="text-gray-600 mb-4">Summary of changes:</p>
                  <div className="bg-gray-50 rounded-lg p-4">
                 ```
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Files kept:</span> {files.length}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Duplicates removed:</span> {deletedFiles.length}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Space saved:</span> {formatFileSize(deletedFiles.reduce((acc, file) => acc + file.size, 0))}
                    </p>
                  </div>
                  {deletedFiles.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-600 mb-2">Removed files:</p>
                      <div className="max-h-40 overflow-y-auto">
                        {deletedFiles.map((file, index) => (
                          <p key={index} className="text-xs text-gray-500">{file.path}</p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => {
                    setStep(1);
                    setFiles([]);
                    setDeletedFiles([]);
                    setFilters({
                      search: '',
                      type: '',
                      dateRange: '',
                      sizeRange: '',
                    });
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                  className="py-3 px-6 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Start New Scan
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer with Privacy Policy and Terms of Service */}
      <footer className="bg-white border-t mt-12">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-center space-x-8 text-sm text-gray-600">
            <a 
              href="/privacy-policy.html" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-blue-600 transition-colors duration-200"
            >
              Privacy Policy
            </a>
            <a 
              href="/terms-of-services.html" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-blue-600 transition-colors duration-200"
            >
              Terms of Service
            </a>
          </div>
        </div>
      </footer>

      {selectedFile && (
        <PreviewModal
          file={selectedFile}
          onClose={() => setSelectedFile(null)}
        />
      )}

      {shareFile && (
        <ShareModal
          file={shareFile}
          onClose={() => setShareFile(null)}
          onShare={handleShare}
        />
      )}
    </div>
  );
}

export default App;
