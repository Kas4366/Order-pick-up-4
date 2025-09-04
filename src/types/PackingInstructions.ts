export interface PackingInstruction {
  sku: string;
  instruction: string;
  createdAt: string;
  updatedAt: string;
}

export interface PackingInstructionsState {
  instructions: PackingInstruction[];
  lastUploadedFile?: string;
  lastUploadedAt?: string;
  totalInstructions: number;
}