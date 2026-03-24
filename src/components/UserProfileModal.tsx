import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, Phone, Mail, Camera, Save } from 'lucide-react';
import { auth, storage, db } from '../firebase';
import { rideService } from '../services/rideService';
import { toast } from 'sonner';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userData: any;
  onUpdate: (newData: any) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  userData,
  onUpdate,
}) => {
  const [name, setName] = useState(userData?.name || '');
  const [phone, setPhone] = useState(userData?.phone || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (userData) {
      setName(userData.name || '');
      setPhone(userData.phone || '');
    }
  }, [userData]);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setIsUploading(true);
      try {
        const storageRef = ref(storage, `users/${userData.uid}/profile.jpg`);
        await uploadBytes(storageRef, file);
        const photoUrl = await getDownloadURL(storageRef);
        
        await updateDoc(doc(db, 'users', userData.uid), { photoUrl });
        onUpdate({ ...userData, photoUrl });
        toast.success("Foto atualizada!");
      } catch (error) {
        console.error("Error uploading photo:", error);
        toast.error("Erro ao atualizar foto");
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("O nome é obrigatório");
      return;
    }

    setIsSaving(true);
    try {
      const updatedData = {
        ...userData,
        name,
        phone,
      };
      await rideService.updateUserProfile(updatedData);
      onUpdate(updatedData);
      toast.success("Perfil atualizado com sucesso!");
      onClose();
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Erro ao atualizar perfil");
    } finally {
      setIsSaving(false);
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
            className="bg-[var(--system-secondary-background)]/90 backdrop-blur-2xl w-full rounded-t-3xl flex flex-col relative z-10 shadow-2xl max-h-[90vh] overflow-y-auto border-t border-white/50"
          >
            <div className="p-4 border-b border-[var(--system-separator)] flex flex-col items-center bg-[var(--system-secondary-background)]/50 sticky top-0 z-20 rounded-t-3xl">
              <div className="w-10 h-1.25 bg-[var(--system-separator)] rounded-full mb-4" />
              <div className="flex justify-between items-center w-full px-2">
                <h3 className="font-bold text-lg text-[var(--system-label)] tracking-tight">Meu Perfil</h3>
                <button
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center bg-[var(--system-quaternary-background)] rounded-full active:opacity-60 transition-opacity"
                >
                  <X className="w-5 h-5 text-[var(--system-secondary-label)]" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="flex flex-col items-center mb-8">
                <div className="relative">
                  <div className="w-24 h-24 bg-[var(--system-quaternary-background)] rounded-full flex items-center justify-center overflow-hidden border-4 border-[var(--system-background)] shadow-md">
                    {userData?.photoUrl ? (
                      <img 
                        src={userData.photoUrl} 
                        alt={userData.name} 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <User size={48} className="text-[var(--system-tertiary-label)]" />
                    )}
                  </div>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="absolute bottom-0 right-0 bg-[var(--system-blue)] text-white p-2.5 rounded-full shadow-lg active:scale-90 transition-transform disabled:opacity-70"
                  >
                    {isUploading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Camera size={16} />
                    )}
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handlePhotoChange} 
                    accept="image/*" 
                    className="hidden" 
                  />
                </div>
                <h2 className="mt-4 text-xl font-bold text-[var(--system-label)] tracking-tight">{userData?.name}</h2>
                <p className="text-[var(--system-secondary-label)] text-sm font-medium">{userData?.email}</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-[var(--system-background)] rounded-2xl border border-[var(--system-separator)] overflow-hidden">
                  <div className="p-4 border-b border-[var(--system-separator)]">
                    <label className="block text-[10px] font-bold text-[var(--system-secondary-label)] uppercase tracking-wider mb-1 flex items-center gap-2">
                      <User size={12} />
                      Nome Completo
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-transparent text-[var(--system-label)] font-medium outline-none placeholder:text-[var(--system-tertiary-label)]"
                      placeholder="Seu nome"
                      required
                    />
                  </div>

                  <div className="p-4 border-b border-[var(--system-separator)]">
                    <label className="block text-[10px] font-bold text-[var(--system-secondary-label)] uppercase tracking-wider mb-1 flex items-center gap-2">
                      <Phone size={12} />
                      Telefone
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-transparent text-[var(--system-label)] font-medium outline-none placeholder:text-[var(--system-tertiary-label)]"
                      placeholder="(00) 00000-0000"
                    />
                  </div>

                  <div className="p-4 bg-[var(--system-quaternary-background)]/30">
                    <label className="block text-[10px] font-bold text-[var(--system-tertiary-label)] uppercase tracking-wider mb-1 flex items-center gap-2">
                      <Mail size={12} />
                      E-mail (Somente leitura)
                    </label>
                    <input
                      type="email"
                      value={userData?.email || ''}
                      disabled
                      className="w-full bg-transparent text-[var(--system-tertiary-label)] font-medium outline-none cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="w-full bg-[var(--system-blue)] text-white font-bold py-4 rounded-2xl active:scale-[0.98] transition-all flex justify-center items-center gap-2 disabled:opacity-70 shadow-lg"
                  >
                    {isSaving ? (
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <Save size={20} />
                        Salvar Alterações
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
