import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

export default function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-lg' }) {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        if (isOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'unset'
        }
        return () => {
            document.body.style.overflow = 'unset'
        }
    }, [isOpen])

    if (!mounted || !isOpen) return null

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className={`relative bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl w-full ${maxWidth} overflow-hidden transform transition-all animate-modal-pop border border-white/20`}>
                {/* Header */}
                <div className="px-6 py-4 bg-gradient-to-r from-indigo-50/50 to-blue-50/50 border-b border-gray-100 flex items-center justify-center relative">
                    <h3 className="text-xl font-bold text-center text-gray-800 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-blue-600">
                        {title}
                    </h3>
                    <button
                        onClick={onClose}
                        className="absolute right-6 p-2 rounded-full hover:bg-white/50 text-gray-400 hover:text-red-500 transition-all hover:scale-110 active:scale-95"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
                    {children}
                </div>
            </div>

            <style>{`
                @keyframes modalPop {
                    0% { opacity: 0; transform: scale(0.95) translateY(10px); }
                    100% { opacity: 1; transform: scale(1) translateY(0); }
                }
                .animate-modal-pop {
                    animation: modalPop 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background-color: rgba(79, 70, 229, 0.2);
                    border-radius: 20px;
                }
            `}</style>
        </div>,
        document.body
    )
}
