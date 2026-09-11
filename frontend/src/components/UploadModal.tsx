import React, { useState } from 'react';
import { X, UploadCloud, CheckCircle2, FileText, Loader2, AlertCircle, Database, Layers } from 'lucide-react';
import { UserRole } from '../types';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: () => void;
  currentUserRole: UserRole;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onUploadSuccess,
  currentUserRole,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [folderPath, setFolderPath] = useState<string>('/Contracts');
  const [stage, setStage] = useState<'idle' | 'uploading' | 'parsing' | 'embedding' | 'classifying' | 'ready' | 'error'>('idle');
  const [result, setResult] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    if (currentUserRole === 'viewer') {
      setStage('error');
      setErrorMessage("Role 'viewer' cannot upload documents. Switch to 'editor' or 'admin'.");
      return;
    }

    try {
      setStage('uploading');
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder_path', folderPath);

      setTimeout(() => setStage('parsing'), 500);
      setTimeout(() => setStage('embedding'), 1100);
      setTimeout(() => setStage('classifying'), 1800);

      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Upload failed');
      }

      const data = await res.json();
      setResult(data);
      setStage('ready');
      onUploadSuccess();
    } catch (err: any) {
      setStage('error');
      setErrorMessage(err.message || 'An error occurred during ingestion');
    }
  };

  const resetModal = () => {
    setFile(null);
    setStage('idle');
    setResult(null);
    setErrorMessage('');
    onClose();
  };

  const stagesList = [
    { key: 'uploading', label: '1. Ingesting Raw Binary File' },
    { key: 'parsing', label: '2. Text Extraction & Clause Parsing' },
    { key: 'embedding', label: '3. Vectorizing with ChromaDB Store' },
    { key: 'classifying', label: '4. MCP Category & Metadata Indexing' },
    { key: 'ready', label: '5. Asset Synchronized in Vault' },
  ];

  const getStageIndex = (st: string) => {
    switch (st) {
      case 'uploading': return 0;
      case 'parsing': return 1;
      case 'embedding': return 2;
      case 'classifying': return 3;
      case 'ready': return 4;
      default: return -1;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 font-sans">
      <div className="w-full max-w-lg bg-[var(--app-surface)] border border-[var(--app-border)] rounded-2xl shadow-2xl p-6 relative">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--app-border)]">
          <div className="flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-[var(--app-primary)]" />
            <h3 className="font-bold text-lg text-[var(--app-text)] tracking-tight">
              Ingest Document into Enterprise Vault
            </h3>
          </div>
          <button onClick={resetModal} className="text-[var(--app-text-muted)] hover:text-[var(--app-primary)] text-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="py-5 space-y-4">
          
          {stage === 'idle' && (
            <>
              <div className="border-2 border-dashed border-[var(--app-border)] hover:border-[var(--app-primary)] rounded-xl p-6 text-center bg-[var(--app-bg)] transition-colors cursor-pointer relative">
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.docx,.doc,.txt"
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <FileText className="w-10 h-10 text-[var(--app-primary)] mx-auto mb-2 opacity-80" />
                {file ? (
                  <div>
                    <p className="font-bold text-sm text-[var(--app-text)] font-mono">{file.name}</p>
                    <p className="text-xs text-[var(--app-text-subtle)] font-mono mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                ) : (
                  <div>
                    <p className="font-semibold text-sm text-[var(--app-text)]">
                      Select or drop file to ingest
                    </p>
                    <p className="text-xs text-[var(--app-text-muted)] mt-1 font-mono">
                      PDF, DOCX, TXT with automated OCR & ChromaDB vector embeddings
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-[var(--app-text-subtle)] uppercase mb-1">
                  Target Vault Directory:
                </label>
                <select
                  value={folderPath}
                  onChange={(e) => setFolderPath(e.target.value)}
                  className="w-full bg-[var(--app-bg)] border border-[var(--app-border)] rounded-lg px-3 py-2 text-xs font-mono text-[var(--app-text)] focus:outline-hidden focus:border-[var(--app-primary)]"
                >
                  <option value="/Contracts">/Contracts</option>
                  <option value="/Finance">/Finance</option>
                  <option value="/Policies">/Policies</option>
                  <option value="/Engineering">/Engineering</option>
                  <option value="/HR">/HR</option>
                  <option value="/">/ (Root)</option>
                </select>
              </div>
            </>
          )}

          {/* Processing Stages */}
          {stage !== 'idle' && stage !== 'ready' && stage !== 'error' && (
            <div className="py-6 space-y-4">
              <div className="flex items-center justify-center gap-3">
                <Loader2 className="w-5 h-5 text-[var(--app-primary)] animate-spin" />
                <span className="text-sm font-bold text-[var(--app-text)] font-mono">
                  Processing Enterprise Ingestion Pipeline...
                </span>
              </div>

              <div className="space-y-2 pt-2">
                {stagesList.map((st, idx) => {
                  const currIdx = getStageIndex(stage);
                  const isDone = currIdx > idx;
                  const isCurrent = currIdx === idx;
                  return (
                    <div
                      key={st.key}
                      className={`flex items-center justify-between p-2.5 rounded-lg border text-xs font-mono transition-colors ${
                        isDone
                          ? 'border-[var(--app-secondary)]/40 bg-[var(--app-secondary)]/15 text-[var(--app-secondary)]'
                          : isCurrent
                          ? 'border-[var(--app-primary)]/40 bg-[var(--app-primary)]/15 text-[var(--app-primary)] font-bold'
                          : 'border-[var(--app-border)] text-[var(--app-text-subtle)]'
                      }`}
                    >
                      <span>{st.label}</span>
                      {isDone && <CheckCircle2 className="w-3.5 h-3.5 text-[var(--app-secondary)]" />}
                      {isCurrent && <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--app-primary)]" />}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Ready */}
          {stage === 'ready' && result && (
            <div className="bg-[var(--app-secondary)]/15 border border-[var(--app-secondary)]/40 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-[var(--app-secondary)]">
                <CheckCircle2 className="w-5 h-5" />
                <h4 className="font-bold text-sm">Ingestion Complete & Verified!</h4>
              </div>
              <div className="text-xs space-y-1 font-mono text-[var(--app-text)]">
                <p>• Title: <span className="font-bold">{result.title}</span></p>
                <p>• Classification: <span className="text-[var(--app-primary)] font-bold">{result.category}</span> ({Math.round(result.confidence * 100)}% confidence)</p>
                <p>• Vector Index: <span className="font-bold">{result.chunks_indexed}</span> chunks stored in ChromaDB</p>
                <p>• Signature Check: {result.has_signature ? 'Verified' : 'Missing Signature'}</p>
                {result.expiration_date && <p>• Term Expiration: {result.expiration_date}</p>}
              </div>
            </div>
          )}

          {/* Error */}
          {stage === 'error' && (
            <div className="bg-[var(--app-danger)]/15 border border-[var(--app-danger)]/40 rounded-xl p-4 flex items-start gap-2 text-[var(--app-danger)]">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm font-mono">Ingestion Halted</h4>
                <p className="text-xs mt-1 font-mono">{errorMessage}</p>
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-[var(--app-border)] flex justify-end gap-2">
          {stage === 'ready' || stage === 'error' ? (
            <button
              onClick={resetModal}
              className="px-4 py-2 rounded-lg bg-[var(--app-primary)] text-black text-xs font-bold hover:bg-[var(--app-primary-hover)] transition-colors"
            >
              Done
            </button>
          ) : (
            <>
              <button
                onClick={resetModal}
                className="px-3 py-2 rounded-lg border border-[var(--app-border)] text-xs font-mono text-[var(--app-text-muted)] hover:bg-[var(--app-surface-hover)]"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={!file || stage !== 'idle'}
                className="px-4 py-2 rounded-lg bg-[var(--app-primary)] text-black text-xs font-bold hover:bg-[var(--app-primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Start Ingestion Pipeline
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
};
