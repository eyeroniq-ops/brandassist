import React, { useState, useRef, useEffect } from 'react';
import { Company, Message } from './types';
import { COMPANIES } from './constants';
import { generateChatResponse } from './services/geminiService';
import { SendIcon, ImageIcon, LoadingSpinner } from './components/icons';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [prompt, setPrompt] = useState<string>('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [companies] = useState<Company[]>(COMPANIES);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(companies.length > 0 ? companies[0] : null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleFileSelect = (file: File) => {
    if (file) {
      if (file.size > 4 * 1024 * 1024) { // 4MB limit
          setError("El tamaño del archivo supera los 4MB. Por favor, elige una imagen más pequeña.");
          return;
      }
      if (!file.type.startsWith('image/')) {
          setError("Solo se aceptan archivos de imagen.");
          return;
      }
      setImageFile(file);
      setImageUrl(URL.createObjectURL(file));
      setError(null);
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) handleFileSelect(file);
  };
  
  const clearAttachment = () => {
      setImageFile(null);
      setImageUrl(null);
      if(fileInputRef.current) fileInputRef.current.value = "";
  }

  const handleSubmit = async () => {
    if ((!prompt.trim() && !imageFile) || !selectedCompany) {
      setError('Por favor, selecciona una marca y escribe un mensaje o sube una imagen.');
      return;
    }
    
    const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        text: prompt,
        image: imageUrl ?? undefined,
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);
    setPrompt('');
    clearAttachment();

    try {
      const responseText = await generateChatResponse(prompt, imageFile, selectedCompany);
      const modelMessage: Message = { id: (Date.now() + 1).toString(), role: 'model', text: responseText };
      setMessages(prev => [...prev, modelMessage]);
    } catch (err) {
        setError(err instanceof Error ? err.message : 'Ocurrió un error inesperado.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragEvents = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.type === "dragenter" || e.type === "dragover") setIsDragging(true);
      else if (e.type === "dragleave") setIsDragging(false);
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if(file) handleFileSelect(file);
  }

  return (
    <div className="min-h-screen bg-[#282832] text-[#f3c6ca] font-sans flex flex-col p-2 sm:p-4">
      <header className="text-center mb-4 p-2">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[#fc4986] to-[#d12863]">
            Brand Assist
          </h1>
          <div className="max-w-md mx-auto mt-4">
            <select
                id="company-select"
                value={selectedCompany?.id || ''}
                onChange={(e) => {
                    const company = companies.find(c => c.id === e.target.value);
                    if(company) {
                        setSelectedCompany(company);
                        setMessages([]);
                        setError(null);
                    }
                }}
                className="w-full bg-[#3c3c4c] border border-[#5a5a6a] rounded-lg py-2 px-3 text-[#f3c6ca] focus:ring-2 focus:ring-[#fc4986] focus:border-[#fc4986] transition disabled:opacity-50"
                disabled={companies.length === 0}
            >
                {companies.length > 0 ? companies.map((company) => (
                  <option key={company.id} value={company.id}>
                      {company.logo} {company.name}
                  </option>
                )) : (
                  <option>No hay marcas disponibles</option>
                )}
            </select>
          </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-lg lg:max-w-2xl rounded-2xl p-4 ${msg.role === 'user' ? 'bg-[#d12863] text-white' : 'bg-[#3c3c4c]'}`}>
              {msg.image && <img src={msg.image} alt="Imagen subida por el usuario" className="rounded-lg mb-2 max-h-64" />}
              <p className="whitespace-pre-wrap">{msg.text}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-lg rounded-2xl p-4 bg-[#3c3c4c] inline-flex items-center">
              <LoadingSpinner />
              <span className="ml-2">Generando...</span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </main>

      <footer className="p-4 bg-[#282832] sticky bottom-0" onDragEnter={handleDragEvents}>
         {error && <div className="bg-[#d12863]/30 border border-[#d12863] text-[#f3c6ca] px-4 py-2 rounded-lg text-center mb-2 text-sm">{error}</div>}
        <div 
          className={`relative bg-[#1f1f26] border-2 rounded-2xl transition-colors ${isDragging ? 'border-[#fc4986]' : 'border-[#5a5a6a]'}`}
          onDragOver={handleDragEvents} onDragLeave={handleDragEvents} onDrop={handleDrop}
        >
          {isDragging && (
            <div className="absolute inset-0 bg-[#282832]/80 rounded-2xl flex items-center justify-center pointer-events-none">
                <p className="text-lg font-semibold">Suelta la imagen aquí</p>
            </div>
          )}
          {imageUrl && (
              <div className="p-2">
                <div className="relative inline-block">
                    <img src={imageUrl} alt="preview" className="h-16 w-16 object-cover rounded-lg"/>
                    <button onClick={clearAttachment} className="absolute -top-2 -right-2 bg-[#3c3c4c] rounded-full h-6 w-6 flex items-center justify-center text-white font-bold">&times;</button>
                </div>
              </div>
          )}
          <div className="flex items-center p-2">
            <button onClick={() => fileInputRef.current?.click()} className="p-2 text-[#f3c6ca] hover:text-white transition">
                <ImageIcon />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              className="hidden" 
              accept="image/*"
            />
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
              placeholder={selectedCompany ? `Chatea con ${selectedCompany.name}...` : 'Selecciona una marca para empezar...'}
              rows={1}
              disabled={!selectedCompany}
              className="flex-1 bg-transparent resize-none focus:outline-none p-2 disabled:text-[#a0a0b0]"
            />
            <button
              onClick={handleSubmit}
              disabled={isLoading || (!prompt.trim() && !imageFile) || !selectedCompany}
              className="p-3 rounded-full bg-[#d12863] hover:bg-[#fc4986] disabled:bg-[#5a5a6a] disabled:cursor-not-allowed transition text-white"
            >
              <SendIcon />
            </button>
          </div>
        </div>
      </footer>
      <div className="text-center text-xs text-[#a0a0b0] py-2">© 2025 eyeroniq ®</div>
    </div>
  );
};

export default App;
