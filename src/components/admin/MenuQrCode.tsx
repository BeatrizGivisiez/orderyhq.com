import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '../ui/Button';
import toast from 'react-hot-toast';

interface MenuQrCodeProps {
  slug: string;
  size?: number;
}

export const MenuQrCode: React.FC<MenuQrCodeProps> = ({ slug, size = 150 }) => {
  const menuUrl = `${window.location.origin}/r/${slug}`;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col items-center text-center space-y-4">
      <h3 className="font-bold text-slate-900">QR Code do Cardápio</h3>
      <p className="text-xs text-slate-500">Imprima este QR Code ou salve para compartilhar com seus clientes.</p>
      
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <QRCodeSVG value={menuUrl} size={size} level="H" />
      </div>

      <Button 
        variant="outline" 
        className="w-full mt-2 text-xs"
        onClick={() => {
          navigator.clipboard.writeText(menuUrl);
          toast.success('URL copiada!');
        }}
      >
        Copiar Link
      </Button>
    </div>
  );
};
