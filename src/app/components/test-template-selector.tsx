// components/test-template-selector.tsx
'use client';

import { useState, useEffect } from 'react';
import { TestTemplateWithCategoryAndParams } from '../types';

interface TestTemplateSelectorProps {
  onTemplateSelect: (template: TestTemplateWithCategoryAndParams) => void;
  selectedTemplateId?: string;
}

export function TestTemplateSelector({ onTemplateSelect, selectedTemplateId }: TestTemplateSelectorProps) {
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [templates, setTemplates] = useState<TestTemplateWithCategoryAndParams[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      loadTemplates(selectedCategory);
    }
  }, [selectedCategory]);

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/test-categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data.data || data);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTemplates = async (categoryId: string) => {
    try {
      const response = await fetch(`/api/test-templates?categoryId=${categoryId}`);
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.data || data);
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  };

  if (isLoading) {
    return <div>Loading categories...</div>;
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Test Category
        </label>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Choose a category</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      {selectedCategory && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Test Template
          </label>
          <div className="space-y-2 max-h-60 overflow-y-auto border rounded-md p-2">
            {templates.map((template) => (
              <div
                key={template.id}
                className={`p-3 border rounded cursor-pointer hover:bg-gray-50 ${selectedTemplateId === template.id ? 'bg-blue-50 border-blue-500' : 'border-gray-200'
                  }`}
                onClick={() => onTemplateSelect(template)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-gray-900">{template.name}</h4>
                    <p className="text-sm text-gray-600">{template.code}</p>
                    {template.description && (
                      <p className="text-sm text-gray-500 mt-1">{template.description}</p>
                    )}
                  </div>
                  {template.fees && (
                    <span className="text-sm font-medium text-green-600">
                      {template.fees}
                    </span>
                  )}
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  <span>Specimen: {template.specimen}</span>
                  {template.turnaround_time && (
                    <span className="ml-3">TAT: {template.turnaround_time}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}