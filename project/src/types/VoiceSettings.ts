export interface VoiceSettings {
  enabled: boolean;
  speed: number; // 0.1 to 2.0
  fields: {
    customerName: boolean;
    orderNumber: boolean;
    sku: boolean;
    quantity: boolean;
    location: boolean;
  };
}

export const defaultVoiceSettings: VoiceSettings = {
  enabled: true,
  speed: 0.9,
  fields: {
    customerName: false,
    orderNumber: false,
    sku: true,
    quantity: true,
    location: true,
  },
};