import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Settings, Save, RotateCcw, Bell, BellOff } from 'lucide-react';
import { VoiceSettings, defaultVoiceSettings } from '../types/VoiceSettings';

interface VoiceSettingsProps {
  onSaveSettings: (settings: VoiceSettings) => void;
  savedSettings: VoiceSettings;
}

export const VoiceSettingsComponent: React.FC<VoiceSettingsProps> = ({
  onSaveSettings,
  savedSettings,
}) => {
  const [settings, setSettings] = useState<VoiceSettings>(savedSettings);
  const [isTestPlaying, setIsTestPlaying] = useState(false);

  useEffect(() => {
    setSettings(savedSettings);
  }, [savedSettings]);

  const handleFieldToggle = (field: keyof VoiceSettings['fields']) => {
    setSettings(prev => ({
      ...prev,
      fields: {
        ...prev.fields,
        [field]: !prev.fields[field],
      },
    }));
  };

  const handleSpeedChange = (speed: number) => {
    setSettings(prev => ({ ...prev, speed }));
  };

  const handleEnabledToggle = () => {
    setSettings(prev => ({ ...prev, enabled: !prev.enabled }));
  };

  const handleBeepToggle = () => {
    setSettings(prev => ({ ...prev, beepEnabled: !prev.beepEnabled }));
  };

  const handleSave = () => {
    onSaveSettings(settings);
  };

  const handleReset = () => {
    setSettings(defaultVoiceSettings);
  };

  const testVoice = () => {
    if (!window.speechSynthesis || isTestPlaying) return;
    
    setIsTestPlaying(true);
    window.speechSynthesis.cancel();
    
    // Build test text based on selected fields
    const testParts: string[] = [];
    if (settings.fields.customerName) testParts.push('Customer John Smith');
    if (settings.fields.orderNumber) testParts.push('Order 12345');
    if (settings.fields.sku) testParts.push('SKU ABC-123');
    if (settings.fields.quantity) testParts.push('Quantity 2');
    if (settings.fields.location) testParts.push('Location A1');
    
    const testText = testParts.length > 0 ? testParts.join('. ') : 'Voice test';
    
    const utterance = new SpeechSynthesisUtterance(testText);
    utterance.rate = settings.speed;
    utterance.onend = () => setIsTestPlaying(false);
    utterance.onerror = () => setIsTestPlaying(false);
    
    window.speechSynthesis.speak(utterance);
  };

  const fieldLabels = {
    customerName: 'Customer Name',
    orderNumber: 'Order Number',
    sku: 'SKU',
    quantity: 'Quantity',
    location: 'Location',
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Volume2 className="h-5 w-5" />
          Voice Control Settings
        </h3>
        <p className="text-gray-600 mb-4">
          Configure voice announcements for order details. Settings are automatically saved.
        </p>
      </div>

      {/* Enable/Disable Voice */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div>
          <h4 className="font-medium text-gray-800">Voice Announcements</h4>
          <p className="text-sm text-gray-600">Enable or disable voice reading</p>
        </div>
        <button
          onClick={handleEnabledToggle}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            settings.enabled ? 'bg-blue-600' : 'bg-gray-300'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              settings.enabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Enable/Disable Beep */}
      <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
        <div>
          <h4 className="font-medium text-gray-800 flex items-center gap-2">
            <Bell className="h-4 w-4 text-orange-600" />
            Pick Extra Beep Alert
          </h4>
          <p className="text-sm text-gray-600">Play beep sound when extra items are needed for same SKU</p>
        </div>
        <button
          onClick={handleBeepToggle}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            settings.beepEnabled ? 'bg-orange-600' : 'bg-gray-300'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              settings.beepEnabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {settings.enabled && (
        <>
          {/* Reading Speed */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-800">Reading Speed</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Slow</span>
                <span className="text-sm font-medium text-gray-800">{settings.speed.toFixed(1)}x</span>
                <span className="text-sm text-gray-600">Fast</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="2.0"
                step="0.1"
                value={settings.speed}
                onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>0.1x</span>
                <span>1.0x</span>
                <span>2.0x</span>
              </div>
            </div>
          </div>

          {/* Fields to Read */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-800">Fields to Read Aloud</h4>
            <p className="text-sm text-gray-600">Select which order details should be announced</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.entries(fieldLabels).map(([field, label]) => (
                <label
                  key={field}
                  className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={settings.fields[field as keyof VoiceSettings['fields']]}
                    onChange={() => handleFieldToggle(field as keyof VoiceSettings['fields'])}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Test Voice */}
          <div className="flex items-center gap-3">
            <button
              onClick={testVoice}
              disabled={isTestPlaying}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {isTestPlaying ? (
                <>
                  <VolumeX className="h-4 w-4" />
                  Playing...
                </>
              ) : (
                <>
                  <Volume2 className="h-4 w-4" />
                  Test Voice
                </>
              )}
            </button>
            
            <div className="text-sm text-gray-600">
              {settings.fields.customerName || settings.fields.orderNumber || settings.fields.sku || settings.fields.quantity || settings.fields.location
                ? `Will read: ${Object.entries(settings.fields)
                    .filter(([_, enabled]) => enabled)
                    .map(([field, _]) => fieldLabels[field as keyof typeof fieldLabels])
                    .join(', ')}`
                : 'No fields selected for reading'
              }
            </div>
          </div>
        </>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between pt-4 border-t border-gray-200">
        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <RotateCcw className="h-4 w-4" />
          Reset to Default
        </button>
        
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Save className="h-4 w-4" />
          Save Settings
        </button>
      </div>

      {/* Current Settings Summary */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-800 mb-2">Current Settings:</h4>
        <div className="text-sm text-blue-700 space-y-1">
          <p><strong>Voice:</strong> {settings.enabled ? 'Enabled' : 'Disabled'}</p>
          {settings.enabled && (
            <>
              <p><strong>Speed:</strong> {settings.speed.toFixed(1)}x</p>
              <p><strong>Reading:</strong> {
                Object.entries(settings.fields)
                  .filter(([_, enabled]) => enabled)
                  .map(([field, _]) => fieldLabels[field as keyof typeof fieldLabels])
                  .join(', ') || 'Nothing selected'
              }</p>
            </>
          )}
          <p><strong>Pick Extra Beep:</strong> {settings.beepEnabled ? 'Enabled' : 'Disabled'}</p>
        </div>
      </div>
    </div>
  );
};