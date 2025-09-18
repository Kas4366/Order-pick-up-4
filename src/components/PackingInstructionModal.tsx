import React from 'react';
import { AlertTriangle, CheckCircle, Package } from 'lucide-react';
import { PackingInstruction } from '../types/PackingInstructions';

interface PackingInstructionModalProps {
  isOpen: boolean;
  instruction: PackingInstruction | null;
  orderNote?: string;
  onComplete: () => void;
}

export const PackingInstructionModal: React.FC<PackingInstructionModalProps> = ({
  isOpen,
  instruction,
  orderNote,
  onComplete
}) => {
  if (!isOpen || (!instruction && !orderNote)) return null;

  const hasInstruction = !!instruction;
  const hasNote = !!(orderNote && orderNote.trim());
  
  // Determine what to show in the header
  const getHeaderText = () => {
    if (hasInstruction && hasNote) {
      return '⚠️ SPECIAL INSTRUCTIONS & NOTES';
    } else if (hasInstruction) {
      return '⚠️ SPECIAL INSTRUCTIONS';
    } else {
      return '📝 ORDER NOTES';
    }
  };
  
  const getSubHeaderText = () => {
    if (hasInstruction && hasNote) {
      return `SKU: ${instruction?.sku || 'N/A'} • Order Notes Included`;
    } else if (hasInstruction) {
      return `SKU: ${instruction?.sku}`;
    } else {
      return 'Important information for this order';
    }
  };
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-end items-start z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full border-4 border-orange-500">
        {/* Header */}
        <div className="bg-orange-500 text-white p-4 rounded-t-lg">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold">{getHeaderText()}</h2>
              <p className="text-orange-100 text-sm">{getSubHeaderText()}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Packing Instructions Section */}
          {hasInstruction && (
            <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-3 mb-4">
              <div className="flex items-start gap-3">
                <Package className="h-5 w-5 text-yellow-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-md font-semibold text-yellow-800 mb-2">
                    Follow These Instructions:
                  </h3>
                  <p className="text-yellow-900 text-sm leading-relaxed">
                    {instruction!.instruction}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Order Notes Section */}
          {hasNote && (
            <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-3 mb-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-blue-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-md font-semibold text-blue-800 mb-2">
                    Order Notes:
                  </h3>
                  <p className="text-blue-900 text-sm leading-relaxed">
                    {orderNote}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <p className="text-red-800 font-medium text-xs">
                You must acknowledge this information before proceeding to the next order.
              </p>
            </div>
          </div>

          <div className="flex justify-center">
            <button
              onClick={onComplete}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white font-bold text-sm rounded-lg hover:bg-green-700 transition-colors shadow-lg"
            >
              <CheckCircle className="h-4 w-4" />
              {hasInstruction && hasNote ? 'Instructions & Notes Read - Continue' : hasInstruction ? 'Instructions Followed - Continue' : 'Notes Read - Continue'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};