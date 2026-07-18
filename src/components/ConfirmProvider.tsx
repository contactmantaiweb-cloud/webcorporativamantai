import React, { createContext, useContext, useState, ReactNode } from 'react';
import ConfirmModal from './ConfirmModal';

interface ConfirmContextType {
  confirm: (message: string, onConfirm: () => void, onCancel?: () => void) => void;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return context.confirm;
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [modalState, setModalState] = useState<{ isOpen: boolean; message: string; onConfirm: () => void; onCancel?: () => void }>({
    isOpen: false,
    message: '',
    onConfirm: () => {},
  });

  const confirm = (message: string, onConfirm: () => void, onCancel?: () => void) => {
    setModalState({ isOpen: true, message, onConfirm, onCancel });
  };

  const handleConfirm = () => {
    modalState.onConfirm();
    setModalState((prev) => ({ ...prev, isOpen: false }));
  };

  const handleCancel = () => {
    if (modalState.onCancel) {
      modalState.onCancel();
    }
    setModalState((prev) => ({ ...prev, isOpen: false }));
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <ConfirmModal
        isOpen={modalState.isOpen}
        message={modalState.message}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </ConfirmContext.Provider>
  );
}
