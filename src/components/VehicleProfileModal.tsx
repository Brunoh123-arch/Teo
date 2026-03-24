import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Upload, CheckCircle } from 'lucide-react';

interface VehicleData {
  model: string;
  color: string;
  plate: string;
  year: string;
  cnhUrl?: string;
  crlvUrl?: string;
  selfieUrl?: string;
}

interface VehicleProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicleData: VehicleData;
  setVehicleData: (data: VehicleData) => void;
  onSave: (e: React.FormEvent, cnhFile: File | null, crlvFile: File | null, selfieFile: File | null) => void;
}

export const VehicleProfileModal: React.FC<VehicleProfileModalProps> = ({
  isOpen,
  onClose,
  vehicleData,
  setVehicleData,
  onSave,
}) => {
  const [cnhFile, setCnhFile] = useState<File | null>(null);
  const [crlvFile, setCrlvFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    try {
      await onSave(e, cnhFile, crlvFile, selfieFile);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[2000] flex flex-col justify-end pointer-events-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="bg-[var(--system-secondary-background)]/90 backdrop-blur-2xl w-full rounded-t-3xl flex flex-col relative z-10 shadow-2xl max-h-[90vh] overflow-hidden border-t border-white/50"
          >
            <div className="p-4 border-b border-[var(--system-separator)] flex flex-col items-center bg-[var(--system-secondary-background)]/50 sticky top-0 z-20 rounded-t-3xl">
              <div className="w-10 h-1.25 bg-[var(--system-separator)] rounded-full mb-4" />
              <div className="flex justify-between items-center w-full px-2">
                <h3 className="font-bold text-lg text-[var(--system-label)] tracking-tight">Cadastro de Motorista</h3>
                <button
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center bg-[var(--system-quaternary-background)] rounded-full active:opacity-60 transition-opacity"
                >
                  <X className="w-5 h-5 text-[var(--system-secondary-label)]" />
                </button>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-6 overflow-y-auto">
              
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-[var(--system-secondary-label)] uppercase tracking-wider px-1">Dados do Veículo</h4>
                <div className="bg-[var(--system-background)] rounded-2xl border border-[var(--system-separator)] overflow-hidden">
                  <div className="p-4 border-b border-[var(--system-separator)]">
                    <label className="block text-[10px] font-bold text-[var(--system-secondary-label)] uppercase tracking-wider mb-1">
                      Modelo do Veículo
                    </label>
                    <input
                      type="text"
                      value={vehicleData.model}
                      onChange={(e) =>
                        setVehicleData({
                          ...vehicleData,
                          model: e.target.value,
                        })
                      }
                      placeholder="Ex: Toyota Corolla"
                      className="w-full bg-transparent text-[var(--system-label)] font-medium outline-none placeholder:text-[var(--system-tertiary-label)]"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-3">
                    <div className="p-4 border-r border-[var(--system-separator)]">
                      <label className="block text-[10px] font-bold text-[var(--system-secondary-label)] uppercase tracking-wider mb-1">
                        Cor
                      </label>
                      <input
                        type="text"
                        value={vehicleData.color}
                        onChange={(e) =>
                          setVehicleData({
                            ...vehicleData,
                            color: e.target.value,
                          })
                        }
                        placeholder="Prata"
                        className="w-full bg-transparent text-[var(--system-label)] font-medium outline-none placeholder:text-[var(--system-tertiary-label)]"
                        required
                      />
                    </div>
                    <div className="p-4 border-r border-[var(--system-separator)]">
                      <label className="block text-[10px] font-bold text-[var(--system-secondary-label)] uppercase tracking-wider mb-1">
                        Ano
                      </label>
                      <input
                        type="text"
                        value={vehicleData.year}
                        onChange={(e) =>
                          setVehicleData({
                            ...vehicleData,
                            year: e.target.value,
                          })
                        }
                        placeholder="2022"
                        className="w-full bg-transparent text-[var(--system-label)] font-medium outline-none placeholder:text-[var(--system-tertiary-label)]"
                        required
                      />
                    </div>
                    <div className="p-4">
                      <label className="block text-[10px] font-bold text-[var(--system-secondary-label)] uppercase tracking-wider mb-1">
                        Placa
                      </label>
                      <input
                        type="text"
                        value={vehicleData.plate}
                        onChange={(e) =>
                          setVehicleData({
                            ...vehicleData,
                            plate: e.target.value,
                          })
                        }
                        placeholder="ABC1234"
                        className="w-full bg-transparent text-[var(--system-label)] font-medium outline-none uppercase placeholder:text-[var(--system-tertiary-label)]"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-bold text-[var(--system-secondary-label)] uppercase tracking-wider px-1">Documentos Obrigatórios</h4>
                
                <div className="grid grid-cols-1 gap-4">
                  {/* CNH Upload */}
                  <div className="bg-[var(--system-background)] rounded-2xl border border-[var(--system-separator)] p-4">
                    <label className="block text-[10px] font-bold text-[var(--system-secondary-label)] uppercase tracking-wider mb-3">
                      Foto da CNH (Frente e Verso)
                    </label>
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setCnhFile(e.target.files?.[0] || null)}
                        className="hidden"
                        id="cnh-upload"
                        required={!vehicleData.cnhUrl}
                      />
                      <label
                        htmlFor="cnh-upload"
                        className={`flex items-center justify-center gap-3 w-full border-2 border-dashed rounded-xl p-6 cursor-pointer transition-all active:scale-[0.98] ${
                          cnhFile || vehicleData.cnhUrl ? 'border-[var(--system-green)] bg-[var(--system-green)]/5' : 'border-[var(--system-separator)] hover:bg-[var(--system-quaternary-background)]'
                        }`}
                      >
                        {cnhFile || vehicleData.cnhUrl ? (
                          <>
                            <CheckCircle className="w-6 h-6 text-[var(--system-green)]" />
                            <span className="text-[var(--system-green)] font-bold text-sm">
                              {cnhFile ? cnhFile.name : 'CNH Enviada'}
                            </span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-6 h-6 text-[var(--system-blue)]" />
                            <span className="text-[var(--system-blue)] font-bold text-sm">Anexar CNH</span>
                          </>
                        )}
                      </label>
                    </div>
                  </div>

                  {/* CRLV Upload */}
                  <div className="bg-[var(--system-background)] rounded-2xl border border-[var(--system-separator)] p-4">
                    <label className="block text-[10px] font-bold text-[var(--system-secondary-label)] uppercase tracking-wider mb-3">
                      Foto do Documento do Carro (CRLV)
                    </label>
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setCrlvFile(e.target.files?.[0] || null)}
                        className="hidden"
                        id="crlv-upload"
                        required={!vehicleData.crlvUrl}
                      />
                      <label
                        htmlFor="crlv-upload"
                        className={`flex items-center justify-center gap-3 w-full border-2 border-dashed rounded-xl p-6 cursor-pointer transition-all active:scale-[0.98] ${
                          crlvFile || vehicleData.crlvUrl ? 'border-[var(--system-green)] bg-[var(--system-green)]/5' : 'border-[var(--system-separator)] hover:bg-[var(--system-quaternary-background)]'
                        }`}
                      >
                        {crlvFile || vehicleData.crlvUrl ? (
                          <>
                            <CheckCircle className="w-6 h-6 text-[var(--system-green)]" />
                            <span className="text-[var(--system-green)] font-bold text-sm">
                              {crlvFile ? crlvFile.name : 'Documento Enviado'}
                            </span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-6 h-6 text-[var(--system-blue)]" />
                            <span className="text-[var(--system-blue)] font-bold text-sm">Anexar CRLV</span>
                          </>
                        )}
                      </label>
                    </div>
                  </div>

                  {/* Selfie Upload */}
                  <div className="bg-[var(--system-background)] rounded-2xl border border-[var(--system-separator)] p-4">
                    <label className="block text-[10px] font-bold text-[var(--system-secondary-label)] uppercase tracking-wider mb-3">
                      Selfie (Rosto)
                    </label>
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setSelfieFile(e.target.files?.[0] || null)}
                        className="hidden"
                        id="selfie-upload"
                        required={!vehicleData.selfieUrl}
                      />
                      <label
                        htmlFor="selfie-upload"
                        className={`flex items-center justify-center gap-3 w-full border-2 border-dashed rounded-xl p-6 cursor-pointer transition-all active:scale-[0.98] ${
                          selfieFile || vehicleData.selfieUrl ? 'border-[var(--system-green)] bg-[var(--system-green)]/5' : 'border-[var(--system-separator)] hover:bg-[var(--system-quaternary-background)]'
                        }`}
                      >
                        {selfieFile || vehicleData.selfieUrl ? (
                          <>
                            <CheckCircle className="w-6 h-6 text-[var(--system-green)]" />
                            <span className="text-[var(--system-green)] font-bold text-sm">
                              {selfieFile ? selfieFile.name : 'Selfie Enviada'}
                            </span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-6 h-6 text-[var(--system-blue)]" />
                            <span className="text-[var(--system-blue)] font-bold text-sm">Tirar Selfie</span>
                          </>
                        )}
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isUploading}
                className="w-full bg-[var(--system-blue)] text-white font-bold py-4 rounded-2xl active:scale-[0.98] transition-all mt-4 disabled:opacity-70 flex justify-center items-center shadow-lg"
              >
                {isUploading ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  "Enviar Cadastro para Análise"
                )}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
