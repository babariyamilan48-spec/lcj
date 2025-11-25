'use client';

import AdminQuestions from '@/components/admin/AdminQuestions';

export default function QuestionsPage() {
  const handleOpenModal = (type: string, data?: any) => {
    // Modal handling can be added here if needed
  };

  return (
    <div>
      <AdminQuestions onOpenModal={handleOpenModal} />
    </div>
  );
}

