import { ReactNode } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export default function Modal({ open, onClose, title, children, footer, size = 'md' }: ModalProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <DialogContent className={sizeClasses[size]}>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-1 h-5 rounded-full bg-gradient-primary" />
            <DialogTitle className="text-base font-bold text-slate-800">{title}</DialogTitle>
          </div>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto py-1">
          {children}
        </div>
        {footer && (
          <DialogFooter className="modal-footer">
            {footer}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
