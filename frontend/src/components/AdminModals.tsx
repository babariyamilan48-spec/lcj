import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface User {
  id: string;
  email: string;
  username: string;
  role: string;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
  last_login?: string;
}

interface Option {
  option_text: string;
  dimension?: string;
  weight: number;
  option_order: number;
}

interface Question {
  id: number;
  test_id: number;
  section_id?: number;
  question_text: string;
  question_type: string;
  options?: Option[];
  question_order: number;
  is_active: boolean;
  created_at: string;
}

interface Test {
  id: number;
  name: string;
  description: string;
  category: string;
  duration_minutes: number;
  total_questions: number;
  passing_score?: number;
  is_active: boolean;
  created_at: string;
}

interface AdminModalsProps {
  showCreateModal: boolean;
  setShowCreateModal: (show: boolean) => void;
  editingItem: any;
  setEditingItem: (item: any) => void;
  modalType: 'user' | 'question' | 'test';
  onCreateUser: (userData: any) => void;
  onCreateQuestion: (questionData: any) => void;
  onCreateTest: (testData: any) => void;
  onUpdateUser: (userId: string, userData: any) => void;
  onUpdateQuestion: (questionId: number, questionData: any) => void;
  onUpdateTest: (testId: number, testData: any) => void;
}

export const AdminModals: React.FC<AdminModalsProps> = ({
  showCreateModal,
  setShowCreateModal,
  editingItem,
  setEditingItem,
  modalType,
  onCreateUser,
  onCreateQuestion,
  onCreateTest,
  onUpdateUser,
  onUpdateQuestion,
  onUpdateTest,
}) => {
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    if (editingItem) {
      setFormData(editingItem);
    } else {
      setFormData({});
    }
  }, [editingItem]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingItem) {
      // Update mode
      if (modalType === 'user') {
        onUpdateUser(editingItem.id, formData);
      } else if (modalType === 'question') {
        onUpdateQuestion(editingItem.id, formData);
      } else if (modalType === 'test') {
        onUpdateTest(editingItem.id, formData);
      }
    } else {
      // Create mode
      if (modalType === 'user') {
        onCreateUser(formData);
      } else if (modalType === 'question') {
        onCreateQuestion(formData);
      } else if (modalType === 'test') {
        onCreateTest(formData);
      }
    }
  };

  const handleClose = () => {
    setShowCreateModal(false);
    setEditingItem(null);
    setFormData({});
  };

  const renderUserForm = () => (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Username</label>
        <Input
          value={formData.username || ''}
          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
          placeholder="Enter username"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Email</label>
        <Input
          type="email"
          value={formData.email || ''}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="Enter email"
          required
        />
      </div>
      {!editingItem && (
        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <Input
            type="password"
            value={formData.password || ''}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            placeholder="Enter password"
            required
          />
        </div>
      )}
      <div>
        <label className="block text-sm font-medium mb-1">Role</label>
        <select
          value={formData.role || 'user'}
          onChange={(e) => setFormData({ ...formData, role: e.target.value })}
          className="w-full p-2 border rounded-md"
        >
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
      </div>
      <div className="flex items-center space-x-4">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={formData.is_active || false}
            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
            className="mr-2"
          />
          Active
        </label>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={formData.is_verified || false}
            onChange={(e) => setFormData({ ...formData, is_verified: e.target.checked })}
            className="mr-2"
          />
          Verified
        </label>
      </div>
    </form>
  );

  const renderQuestionForm = () => (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Test ID</label>
        <Input
          type="number"
          value={formData.test_id || ''}
          onChange={(e) => setFormData({ ...formData, test_id: parseInt(e.target.value) })}
          placeholder="Enter test ID"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Section ID (Optional)</label>
        <Input
          type="number"
          value={formData.section_id || ''}
          onChange={(e) => setFormData({ ...formData, section_id: e.target.value ? parseInt(e.target.value) : null })}
          placeholder="Enter section ID (optional)"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Question Text</label>
        <textarea
          value={formData.question_text || ''}
          onChange={(e) => setFormData({ ...formData, question_text: e.target.value })}
          placeholder="Enter question text"
          className="w-full p-2 border rounded-md h-24"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Question Type</label>
        <select
          value={formData.question_type || 'multiple_choice'}
          onChange={(e) => setFormData({ ...formData, question_type: e.target.value })}
          className="w-full p-2 border rounded-md"
        >
          <option value="multiple_choice">Multiple Choice</option>
          <option value="true_false">True/False</option>
          <option value="text">Text</option>
          <option value="rating">Rating</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Question Order</label>
        <Input
          type="number"
          value={formData.question_order || 0}
          onChange={(e) => setFormData({ ...formData, question_order: parseInt(e.target.value) || 0 })}
          placeholder="Enter question order"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Options</label>
        {(formData.options || []).map((option: Option, index: number) => (
          <div key={index} className="flex gap-2 mb-2">
            <Input
              value={option.option_text || ''}
              onChange={(e) => {
                const newOptions = [...(formData.options || [])];
                newOptions[index] = { ...newOptions[index], option_text: e.target.value };
                setFormData({ ...formData, options: newOptions });
              }}
              placeholder="Option text"
              className="flex-1"
            />
            <Input
              value={option.dimension || ''}
              onChange={(e) => {
                const newOptions = [...(formData.options || [])];
                newOptions[index] = { ...newOptions[index], dimension: e.target.value };
                setFormData({ ...formData, options: newOptions });
              }}
              placeholder="Dimension (E, I, S, N, etc.)"
              className="w-24"
            />
            <Input
              type="number"
              value={option.weight || 1}
              onChange={(e) => {
                const newOptions = [...(formData.options || [])];
                newOptions[index] = { ...newOptions[index], weight: parseInt(e.target.value) || 1 };
                setFormData({ ...formData, options: newOptions });
              }}
              placeholder="Weight"
              className="w-20"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const newOptions = (formData.options || []).filter((_: Option, i: number) => i !== index);
                setFormData({ ...formData, options: newOptions });
              }}
            >
              Remove
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            const newOptions = [...(formData.options || []), { option_text: '', dimension: '', weight: 1, option_order: (formData.options || []).length }];
            setFormData({ ...formData, options: newOptions });
          }}
        >
          Add Option
        </Button>
      </div>
      <div>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={formData.is_active !== false}
            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
            className="mr-2"
          />
          Active
        </label>
      </div>
    </form>
  );

  const renderTestForm = () => (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Test Name</label>
        <Input
          value={formData.name || ''}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Enter test name"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <textarea
          value={formData.description || ''}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Enter test description"
          className="w-full p-2 border rounded-md h-24"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Category</label>
        <select
          value={formData.category || 'personality'}
          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          className="w-full p-2 border rounded-md"
        >
          <option value="personality">Personality</option>
          <option value="career">Career</option>
          <option value="skills">Skills</option>
          <option value="aptitude">Aptitude</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Duration (minutes)</label>
        <Input
          type="number"
          value={formData.duration_minutes || ''}
          onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
          placeholder="Enter duration in minutes"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Total Questions</label>
        <Input
          type="number"
          value={formData.total_questions || ''}
          onChange={(e) => setFormData({ ...formData, total_questions: parseInt(e.target.value) })}
          placeholder="Enter total questions"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Passing Score (optional)</label>
        <Input
          type="number"
          value={formData.passing_score || ''}
          onChange={(e) => setFormData({ ...formData, passing_score: parseInt(e.target.value) })}
          placeholder="Enter passing score"
        />
      </div>
      <div>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={formData.is_active || false}
            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
            className="mr-2"
          />
          Active
        </label>
      </div>
    </form>
  );

  const getModalTitle = () => {
    if (editingItem) {
      return `Edit ${modalType.charAt(0).toUpperCase() + modalType.slice(1)}`;
    }
    return `Create New ${modalType.charAt(0).toUpperCase() + modalType.slice(1)}`;
  };

  const renderForm = () => {
    switch (modalType) {
      case 'user':
        return renderUserForm();
      case 'question':
        return renderQuestionForm();
      case 'test':
        return renderTestForm();
      default:
        return null;
    }
  };

  return (
    <>
      {/* Create/Edit Modal */}
      <Dialog open={showCreateModal || !!editingItem} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{getModalTitle()}</DialogTitle>
          </DialogHeader>
          {renderForm()}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" onClick={handleSubmit}>
              {editingItem ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
