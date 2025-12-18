import React, { useState } from 'react';
import { ResourceType } from '../types';

interface ResourceModalProps {
    onClose: () => void;
    onSave: (resource: { title: string; url: string; description: string; type: ResourceType }) => void;
}

const ResourceModal: React.FC<ResourceModalProps> = ({ onClose, onSave }) => {
    const [activeTab, setActiveTab] = useState<'link' | 'file'>('link');
    const [title, setTitle] = useState('');
    const [url, setUrl] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState<ResourceType>('link');
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setTitle(e.target.files[0].name.replace(/\.[^/.]+$/, ""));
            setType('pdf');
        }
    };

    const handleSave = async () => {
        if (!title) return;

        if (activeTab === 'file') {
            if (!file) {
                alert("Por favor selecciona un archivo.");
                return;
            }
            setIsUploading(true);
            const formData = new FormData();
            formData.append('file', file);

            try {
                const response = await fetch('http://localhost:3001/api/upload', {
                    method: 'POST',
                    body: formData,
                });

                if (!response.ok) throw new Error('Upload failed');

                const data = await response.json();
                onSave({ title, url: data.url, description, type: 'pdf' });
                onClose();
            } catch (error) {
                console.error("Upload error:", error);
                alert("Error al subir archivo.");
            } finally {
                setIsUploading(false);
            }
        } else {
            if (!url) {
                alert("Por favor ingresa una URL.");
                return;
            }
            // Auto-detect type mainly for video
            const isYoutube = url.includes('youtube.com') || url.includes('youtu.be');
            const finalType = isYoutube ? 'video' : type;

            onSave({ title, url, description, type: finalType });
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[200] p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-lg w-full animate-scale-in border border-slate-100 dark:border-slate-800 shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-black text-slate-800 dark:text-white">Añadir Recurso</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">✕</button>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800/50 rounded-xl mb-6">
                    <button
                        onClick={() => setActiveTab('link')}
                        className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'link' ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-sm' : 'text-slate-500'}`}
                    >
                        🔗 Enlace / Video
                    </button>
                    <button
                        onClick={() => setActiveTab('file')}
                        className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'file' ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-sm' : 'text-slate-500'}`}
                    >
                        📄 Subir Archivo
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Título</label>
                        <input
                            type="text"
                            placeholder="Ej: Resumen del Capítulo 1"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-blue-500 dark:text-white font-semibold"
                        />
                    </div>

                    {activeTab === 'link' ? (
                        <>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">URL</label>
                                <input
                                    type="text"
                                    placeholder="https://..."
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Tipo</label>
                                <select
                                    value={type}
                                    onChange={(e) => setType(e.target.value as ResourceType)}
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                                >
                                    <option value="link">Enlace Web</option>
                                    <option value="video">Video</option>
                                    <option value="book">Libro</option>
                                    <option value="pdf">Documento PDF</option>
                                    <option value="other">Otro</option>
                                </select>
                            </div>
                        </>
                    ) : (
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Archivo (PDF)</label>
                            <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-8 flex flex-col items-center justify-center text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer relative">
                                <input
                                    type="file"
                                    accept=".pdf"
                                    onChange={handleFileChange}
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                />
                                <div className="text-4xl mb-2">📄</div>
                                <p className="font-bold text-sm">{file ? file.name : "Click para seleccionar PDF"}</p>
                                <p className="text-xs opacity-70 mt-1">{file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : "Máx 10MB"}</p>
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Descripción (Opcional)</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-blue-500 dark:text-white h-24 resize-none"
                            placeholder="Breve nota sobre este recurso..."
                        />
                    </div>
                </div>

                <div className="flex gap-4 mt-8">
                    <button onClick={onClose} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold text-slate-600 dark:text-slate-400">Cancelar</button>
                    <button
                        onClick={handleSave}
                        disabled={isUploading || !title || (activeTab === 'link' && !url) || (activeTab === 'file' && !file)}
                        className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 dark:shadow-none disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isUploading ? (
                            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        ) : 'Guardar Recurso'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ResourceModal;
