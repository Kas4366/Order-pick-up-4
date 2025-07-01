export interface CustomTag {
  id: string;
  name: string;
  description?: string;
  color?: string;
  createdAt: string;
}

export interface CustomTagsState {
  tags: CustomTag[];
  selectedSelroTag?: string;
  selectedVeeqoTag?: string;
}

export const defaultCustomTags: CustomTag[] = [
  {
    id: 'ready-to-pick',
    name: 'Ready to Pick',
    description: 'Orders ready for picking',
    color: '#10B981',
    createdAt: new Date().toISOString()
  },
  {
    id: 'urgent',
    name: 'Urgent',
    description: 'Urgent orders requiring immediate attention',
    color: '#EF4444',
    createdAt: new Date().toISOString()
  },
  {
    id: 'priority',
    name: 'Priority',
    description: 'Priority orders',
    color: '#F59E0B',
    createdAt: new Date().toISOString()
  },
  {
    id: 'in-progress',
    name: 'In Progress',
    description: 'Orders currently being processed',
    color: '#3B82F6',
    createdAt: new Date().toISOString()
  },
  {
    id: 'picked',
    name: 'Picked',
    description: 'Orders that have been picked',
    color: '#8B5CF6',
    createdAt: new Date().toISOString()
  },
  {
    id: 'packed',
    name: 'Packed',
    description: 'Orders that have been packed',
    color: '#06B6D4',
    createdAt: new Date().toISOString()
  }
];