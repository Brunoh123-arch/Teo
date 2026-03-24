import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({ isOpen, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[3000] flex flex-col justify-end pointer-events-auto">
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
            <div className="p-4 border-b border-gray-100 flex flex-col items-center bg-white/50 sticky top-0 z-20 rounded-t-3xl">
              <div className="w-12 h-1.5 bg-gray-300 rounded-full mb-4" />
              <div className="flex justify-between items-center w-full">
                <h3 className="font-bold text-lg text-[var(--system-label)]">Política de Privacidade</h3>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-[var(--system-secondary-label)]" />
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto text-gray-700 space-y-4 pb-[env(safe-area-inset-bottom,24px)]">
              <p className="font-semibold">Última atualização: 23 de Março de 2026</p>
              
              <section>
                <h4 className="font-bold text-gray-900 mb-2">1. Coleta de Dados</h4>
                <p>Coletamos informações necessárias para a prestação dos serviços de transporte, incluindo:</p>
                <ul className="list-disc ml-5 mt-2 space-y-1">
                  <li>Dados de localização em tempo real (mesmo em segundo plano para motoristas);</li>
                  <li>Informações de perfil (nome, e-mail, foto);</li>
                  <li>Dados do veículo e documentos (para motoristas);</li>
                  <li>Histórico de viagens e transações.</li>
                </ul>
              </section>

              <section>
                <h4 className="font-bold text-gray-900 mb-2">2. Uso da Localização</h4>
                <p>A localização é fundamental para o funcionamento do Uppi:</p>
                <ul className="list-disc ml-5 mt-2 space-y-1">
                  <li><strong>Passageiros:</strong> Para definir o ponto de partida e acompanhar o motorista.</li>
                  <li><strong>Motoristas:</strong> Para receber pedidos próximos e permitir que o passageiro acompanhe a viagem. A localização em segundo plano é usada para garantir que a viagem continue sendo rastreada mesmo se o app for minimizado.</li>
                </ul>
              </section>

              <section>
                <h4 className="font-bold text-gray-900 mb-2">3. Compartilhamento de Informações</h4>
                <p>Seus dados são compartilhados apenas entre passageiro e motorista durante a corrida ativa para fins de identificação e segurança.</p>
              </section>

              <section>
                <h4 className="font-bold text-gray-900 mb-2">4. Exclusão de Dados</h4>
                <p>Você pode solicitar a exclusão da sua conta e de todos os dados associados a qualquer momento através das configurações do aplicativo.</p>
              </section>

              <div className="bg-gray-50 p-4 rounded-xl text-sm italic">
                Ao utilizar o Uppi, você concorda com os termos desta política.
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
