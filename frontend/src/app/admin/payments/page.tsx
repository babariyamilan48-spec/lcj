'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import AdminPayments from '@/components/admin/AdminPayments';

const AdminModals = dynamic(() => import('@/components/admin/AdminModals'), { ssr: false });

interface ModalState {
  type: string | null;
  data?: any;
}

export default function PaymentsPage() {
  const [modal, setModal] = useState<ModalState>({ type: null });

  const handleOpenModal = (type: string, data?: any) => {
    setModal({ type, data });
  };

  const handleCloseModal = () => {
    setModal({ type: null });
  };

  return (
    <div>
      <AdminPayments onOpenModal={handleOpenModal} />
    </div>
  );
}
