import { useState } from 'react';
import type { Entry } from '../lib/supabase';

export function useModalManagement() {
  const [showCategoryManagement, setShowCategoryManagement] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; entryId: string | null }>({
    show: false,
    entryId: null,
  });
  const [showSplash, setShowSplash] = useState(true);

  const handleDelete = (id: string) => {
    setDeleteConfirm({ show: true, entryId: id });
  };

  const handleCancelDelete = () => {
    setDeleteConfirm({ show: false, entryId: null });
  };

  return {
    showCategoryManagement,
    setShowCategoryManagement,
    deleteConfirm,
    showSplash,
    setShowSplash,
    handleDelete,
    handleCancelDelete
  };
}