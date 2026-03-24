import React, { useState } from 'react';
import { motion } from 'motion/react';
import { FileText, Camera, CheckCircle, AlertCircle, Clock, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { userService } from '../services/userService';

interface DriverVerificationProps {
  onClose: () => void;
  user: any;
}

export const DriverVerification: React.FC<DriverVerificationProps> = ({ onClose, user }) => {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    cnhNumber: '',
    plate: '',
    model: '',
    color: '',
    year: ''
  });
  const [docs, setDocs] = useState<{
    cnh: File | null;
    crlv: File | null;
    selfie: File | null;
  }>({
    cnh: null,
    crlv: null,
    selfie: null,
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'cnh' | 'crlv' | 'selfie') => {
    if (e.target.files && e.target.files[0]) {
      setDocs(prev => ({ ...prev, [type]: e.target.files![0] }));
    }
  };

  const handleUpload = async () => {
    if (!docs.cnh || !docs.crlv || !docs.selfie) {
      toast.error("Por favor, envie todos os documentos.");
      return;
    }

    if (!formData.cnhNumber || !formData.plate || !formData.model || !formData.color) {
      toast.error("Por favor, preencha todos os dados do veículo e CNH.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
      const { doc, setDoc } = await import('firebase/firestore');
      const { storage, db } = await import('../firebase');

      const uploadFile = async (file: File, path: string) => {
        const fileRef = ref(storage, `documents/${user.uid}/${path}`);
        await uploadBytes(fileRef, file);
        return getDownloadURL(fileRef);
      };

      const [cnhUrl, crlvUrl, selfieUrl] = await Promise.all([
        uploadFile(docs.cnh, 'cnh'),
        uploadFile(docs.crlv, 'crlv'),
        uploadFile(docs.selfie, 'selfie'),
      ]);

      // Save document URLs to Firestore
      await setDoc(doc(db, 'documents', user.uid), {
        userId: user.uid,
        cnhUrl,
        crlvUrl,
        selfieUrl,
        status: 'pending',
        createdAt: new Date()
      });

      // Update user status
      await userService.updateDriverData({ 
        submittedAt: new Date().toISOString(),
        cnh: formData.cnhNumber,
        vehicle: {
          plate: formData.plate,
          model: formData.model,
          color: formData.color,
          year: formData.year
        },
        rejectionReason: null
      });

      toast.success("Cadastro enviado com sucesso! Aguarde a análise.");
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao enviar documentos.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] bg-white flex flex-col">
      <div className="p-4 border-b border-gray-100 flex items-center gap-4">
        <button onClick={onClose} className="p-2 -ml-2 hover:bg-gray-100 rounded-full">
          <ArrowLeft className="w-6 h-6 text-gray-800" />
        </button>
        <h2 className="text-xl font-bold text-gray-900">Seja um Motorista</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-md mx-auto">
          <div className="mb-8 text-center">
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-10 h-10 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Verificação de Conta</h3>
            <p className="text-gray-500">Para sua segurança e de nossos passageiros, precisamos verificar seus documentos.</p>
          </div>

          <div className="space-y-4 mb-8">
            <h4 className="font-bold text-gray-900 border-b pb-2">Dados do Veículo e CNH</h4>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CNH (Número)</label>
              <input
                type="text"
                required
                value={formData.cnhNumber}
                onChange={(e) => setFormData({...formData, cnhNumber: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent"
                placeholder="Número da sua CNH"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Placa do Veículo</label>
              <input
                type="text"
                required
                value={formData.plate}
                onChange={(e) => setFormData({...formData, plate: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent"
                placeholder="Ex: ABC-1234"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Modelo</label>
                <input
                  type="text"
                  required
                  value={formData.model}
                  onChange={(e) => setFormData({...formData, model: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="Ex: Onix"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cor</label>
                <input
                  type="text"
                  required
                  value={formData.color}
                  onChange={(e) => setFormData({...formData, color: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="Ex: Prata"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ano</label>
                <input
                  type="text"
                  required
                  value={formData.year}
                  onChange={(e) => setFormData({...formData, year: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="Ex: 2020"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4 mb-8">
            <h4 className="font-bold text-gray-900 border-b pb-2">Fotos dos Documentos</h4>
            <div className="flex items-start gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shrink-0 shadow-sm relative">
                <CheckCircle className={`w-6 h-6 ${docs.cnh ? 'text-green-500' : 'text-gray-300'}`} />
                <input type="file" onChange={(e) => handleFileChange(e, 'cnh')} className="absolute inset-0 opacity-0 cursor-pointer" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900">CNH {docs.cnh && <span className="text-xs text-green-600">(Selecionado)</span>}</h4>
                <p className="text-sm text-gray-500">Carteira Nacional de Habilitação válida.</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shrink-0 shadow-sm relative">
                <CheckCircle className={`w-6 h-6 ${docs.crlv ? 'text-green-500' : 'text-gray-300'}`} />
                <input type="file" onChange={(e) => handleFileChange(e, 'crlv')} className="absolute inset-0 opacity-0 cursor-pointer" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900">CRLV {docs.crlv && <span className="text-xs text-green-600">(Selecionado)</span>}</h4>
                <p className="text-sm text-gray-500">Documento do veículo atualizado.</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shrink-0 shadow-sm relative">
                <Camera className={`w-6 h-6 ${docs.selfie ? 'text-blue-500' : 'text-gray-300'}`} />
                <input type="file" onChange={(e) => handleFileChange(e, 'selfie')} className="absolute inset-0 opacity-0 cursor-pointer" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900">Selfie {docs.selfie && <span className="text-xs text-green-600">(Selecionado)</span>}</h4>
                <p className="text-sm text-gray-500">Uma foto sua segurando o documento.</p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-100 p-4 rounded-2xl mb-8 flex gap-3">
            <Clock className="w-6 h-6 text-yellow-600 shrink-0" />
            <p className="text-sm text-yellow-800">A análise dos documentos pode levar até 24 horas úteis.</p>
          </div>
        </div>
      </div>

      <div className="p-6 border-t border-gray-100">
        <button
          onClick={handleUpload}
          disabled={isSubmitting}
          className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Enviando...
            </>
          ) : (
            "Enviar Documentos"
          )}
        </button>
      </div>
    </div>
  );
};
