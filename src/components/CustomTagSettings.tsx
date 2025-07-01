import React, { useState, useEffect } from 'react';
import { Tag, Plus, Edit2, Trash2, Save, X, Palette, Hash } from 'lucide-react';
import { CustomTag, defaultCustomTags } from '../types/CustomTags';

interface CustomTagSettingsProps {
  customTags: CustomTag[];
  onSaveTags: (tags: CustomTag[]) => void;
  selectedSelroTag?: string;
  selectedVeeqoTag?: string;
  onSelectSelroTag: (tagName: string) => void;
  onSelectVeeqoTag: (tagName: string) => void;
}

export const CustomTagSettings: React.FC<CustomTagSettingsProps> = ({
  customTags,
  onSaveTags,
  selectedSelroTag,
  selectedVeeqoTag,
  onSelectSelroTag,
  onSelectVeeqoTag,
}) => {
  const [tags, setTags] = useState<CustomTag[]>(customTags);
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [newTag, setNewTag] = useState<Partial<CustomTag>>({
    name: '',
    description: '',
    color: '#3B82F6'
  });

  const predefinedColors = [
    '#EF4444', // Red
    '#F59E0B', // Amber
    '#10B981', // Emerald
    '#3B82F6', // Blue
    '#8B5CF6', // Violet
    '#EC4899', // Pink
    '#06B6D4', // Cyan
    '#84CC16', // Lime
    '#F97316', // Orange
    '#6366F1', // Indigo
  ];

  useEffect(() => {
    setTags(customTags);
  }, [customTags]);

  const generateId = (name: string): string => {
    return name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  };

  const handleAddTag = () => {
    if (!newTag.name?.trim()) return;

    const tag: CustomTag = {
      id: generateId(newTag.name),
      name: newTag.name.trim(),
      description: newTag.description?.trim() || '',
      color: newTag.color || '#3B82F6',
      createdAt: new Date().toISOString()
    };

    const updatedTags = [...tags, tag];
    setTags(updatedTags);
    onSaveTags(updatedTags);
    
    setNewTag({ name: '', description: '', color: '#3B82F6' });
    setIsAddingTag(false);
  };

  const handleEditTag = (tagId: string) => {
    const tag = tags.find(t => t.id === tagId);
    if (tag) {
      setNewTag({
        name: tag.name,
        description: tag.description,
        color: tag.color
      });
      setEditingTagId(tagId);
    }
  };

  const handleUpdateTag = () => {
    if (!newTag.name?.trim() || !editingTagId) return;

    const updatedTags = tags.map(tag => 
      tag.id === editingTagId 
        ? {
            ...tag,
            name: newTag.name!.trim(),
            description: newTag.description?.trim() || '',
            color: newTag.color || '#3B82F6'
          }
        : tag
    );

    setTags(updatedTags);
    onSaveTags(updatedTags);
    
    setNewTag({ name: '', description: '', color: '#3B82F6' });
    setEditingTagId(null);
  };

  const handleDeleteTag = (tagId: string) => {
    if (confirm('Are you sure you want to delete this tag?')) {
      const updatedTags = tags.filter(tag => tag.id !== tagId);
      setTags(updatedTags);
      onSaveTags(updatedTags);
    }
  };

  const handleResetToDefaults = () => {
    if (confirm('Reset to default tags? This will remove all custom tags.')) {
      setTags(defaultCustomTags);
      onSaveTags(defaultCustomTags);
    }
  };

  const cancelEdit = () => {
    setIsAddingTag(false);
    setEditingTagId(null);
    setNewTag({ name: '', description: '', color: '#3B82F6' });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Tag className="h-5 w-5" />
          Custom Tag Management
        </h3>
        <p className="text-gray-600 mb-4">
          Create and manage custom tags for filtering orders from Selro and Veeqo. You can select different tags for each platform.
        </p>
      </div>

      {/* Tag Selection for Platforms */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Selro Tag Selection */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-md font-semibold text-blue-800 mb-3 flex items-center gap-2">
            <Hash className="h-4 w-4" />
            Selro Tag Filter
          </h4>
          <div className="space-y-2">
            <button
              onClick={() => onSelectSelroTag('all')}
              className={`w-full text-left px-3 py-2 rounded-lg border transition-colors ${
                selectedSelroTag === 'all' || !selectedSelroTag
                  ? 'bg-blue-100 border-blue-300 text-blue-800'
                  : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              All Orders (No Filter)
            </button>
            {tags.map(tag => (
              <button
                key={`selro-${tag.id}`}
                onClick={() => onSelectSelroTag(tag.name)}
                className={`w-full text-left px-3 py-2 rounded-lg border transition-colors flex items-center gap-2 ${
                  selectedSelroTag === tag.name
                    ? 'bg-blue-100 border-blue-300 text-blue-800'
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: tag.color }}
                ></div>
                <span className="font-medium">{tag.name}</span>
              </button>
            ))}
          </div>
          {selectedSelroTag && selectedSelroTag !== 'all' && (
            <div className="mt-2 text-xs text-blue-600">
              Selected: {selectedSelroTag}
            </div>
          )}
        </div>

        {/* Veeqo Tag Selection */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h4 className="text-md font-semibold text-purple-800 mb-3 flex items-center gap-2">
            <Hash className="h-4 w-4" />
            Veeqo Tag Filter
          </h4>
          <div className="space-y-2">
            <button
              onClick={() => onSelectVeeqoTag('all')}
              className={`w-full text-left px-3 py-2 rounded-lg border transition-colors ${
                selectedVeeqoTag === 'all' || !selectedVeeqoTag
                  ? 'bg-purple-100 border-purple-300 text-purple-800'
                  : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              All Orders (No Filter)
            </button>
            {tags.map(tag => (
              <button
                key={`veeqo-${tag.id}`}
                onClick={() => onSelectVeeqoTag(tag.name)}
                className={`w-full text-left px-3 py-2 rounded-lg border transition-colors flex items-center gap-2 ${
                  selectedVeeqoTag === tag.name
                    ? 'bg-purple-100 border-purple-300 text-purple-800'
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: tag.color }}
                ></div>
                <span className="font-medium">{tag.name}</span>
              </button>
            ))}
          </div>
          {selectedVeeqoTag && selectedVeeqoTag !== 'all' && (
            <div className="mt-2 text-xs text-purple-600">
              Selected: {selectedVeeqoTag}
            </div>
          )}
        </div>
      </div>

      {/* Tag Management */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-md font-semibold text-gray-800">Manage Tags</h4>
          <div className="flex gap-2">
            <button
              onClick={handleResetToDefaults}
              className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Reset to Defaults
            </button>
            <button
              onClick={() => setIsAddingTag(true)}
              disabled={isAddingTag || editingTagId !== null}
              className="flex items-center gap-2 px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 text-sm"
            >
              <Plus className="h-3 w-3" />
              Add Tag
            </button>
          </div>
        </div>

        {/* Add/Edit Tag Form */}
        {(isAddingTag || editingTagId) && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
            <h5 className="text-sm font-medium text-gray-800 mb-3">
              {editingTagId ? 'Edit Tag' : 'Add New Tag'}
            </h5>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Tag Name *
                </label>
                <input
                  type="text"
                  value={newTag.name || ''}
                  onChange={(e) => setNewTag({ ...newTag, name: e.target.value })}
                  placeholder="Enter tag name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={newTag.description || ''}
                  onChange={(e) => setNewTag({ ...newTag, description: e.target.value })}
                  placeholder="Optional description"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={newTag.color || '#3B82F6'}
                    onChange={(e) => setNewTag({ ...newTag, color: e.target.value })}
                    className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
                  />
                  <div className="flex gap-1">
                    {predefinedColors.slice(0, 5).map(color => (
                      <button
                        key={color}
                        onClick={() => setNewTag({ ...newTag, color })}
                        className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={cancelEdit}
                className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={editingTagId ? handleUpdateTag : handleAddTag}
                disabled={!newTag.name?.trim()}
                className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm"
              >
                <Save className="h-3 w-3" />
                {editingTagId ? 'Update' : 'Add'} Tag
              </button>
            </div>
          </div>
        )}

        {/* Tags List */}
        <div className="space-y-2">
          {tags.map(tag => (
            <div
              key={tag.id}
              className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div 
                  className="w-4 h-4 rounded-full border border-gray-300" 
                  style={{ backgroundColor: tag.color }}
                ></div>
                <div>
                  <p className="font-medium text-gray-800">{tag.name}</p>
                  {tag.description && (
                    <p className="text-sm text-gray-500">{tag.description}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleEditTag(tag.id)}
                  disabled={isAddingTag || editingTagId !== null}
                  className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors disabled:opacity-50"
                  title="Edit tag"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDeleteTag(tag.id)}
                  disabled={isAddingTag || editingTagId !== null}
                  className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                  title="Delete tag"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {tags.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Tag className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium mb-2">No Custom Tags</p>
            <p className="text-sm">Create your first custom tag to get started.</p>
          </div>
        )}
      </div>

      {/* Usage Instructions */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-800 mb-2">How to Use Custom Tags:</h4>
        <div className="text-sm text-blue-700 space-y-1">
          <p>1. <strong>Create Tags:</strong> Add custom tags that match your workflow (e.g., "Ready to Pick", "Urgent")</p>
          <p>2. <strong>Select Platform Tags:</strong> Choose different tags for Selro and Veeqo independently</p>
          <p>3. <strong>Filter Orders:</strong> The app will filter orders based on your selected tags when loading from APIs</p>
          <p>4. <strong>Tag Matching:</strong> Orders are filtered by checking if they contain the selected tag name</p>
        </div>
      </div>

      {/* Current Selection Summary */}
      {(selectedSelroTag || selectedVeeqoTag) && (
        <div className="bg-green-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-green-800 mb-2">Current Tag Selection:</h4>
          <div className="text-sm text-green-700 space-y-1">
            <p><strong>Selro:</strong> {selectedSelroTag === 'all' || !selectedSelroTag ? 'All Orders (No Filter)' : selectedSelroTag}</p>
            <p><strong>Veeqo:</strong> {selectedVeeqoTag === 'all' || !selectedVeeqoTag ? 'All Orders (No Filter)' : selectedVeeqoTag}</p>
          </div>
        </div>
      )}
    </div>
  );
};