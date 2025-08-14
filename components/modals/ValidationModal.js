// app/components/modals/ValidationModal.js
"use client";

import { useEffect, useRef, useCallback } from 'react';
import { AiOutlineCloseCircle, AiOutlineCheckCircle, AiOutlineLoading3Quarters } from 'react-icons/ai';

const ValidationModal = ({ show, onClose, status, title, message, isLoading = false }) => {
    const dialogRef = useRef(null);

    useEffect(() => {
        if (show) {
            dialogRef.current?.showModal();
        } else {
            dialogRef.current?.close();
        }
    }, [show]);

    // Handle ESC key and backdrop click, but only when not loading
    const handleClick = (event) => {
        if (event.target === dialogRef.current && !isLoading) {
            onClose();
        }
    };

    const handleKeyDown = useCallback((event) => {
        if (event.key === 'Escape' && !isLoading) {
            onClose();
        }
    }, [isLoading, onClose]);

    useEffect(() => {
        if (show) {
            document.addEventListener('keydown', handleKeyDown);
            return () => document.removeEventListener('keydown', handleKeyDown);
        }
    }, [show, handleKeyDown]);

    const getIcon = () => {
        switch (status) {
            case "loading":
                return <AiOutlineLoading3Quarters className="w-12 h-12 text-indigo-500 animate-spin" />;
            case "success":
                return <AiOutlineCheckCircle className="w-12 h-12 text-green-500" />;
            case "error":
                return <AiOutlineCloseCircle className="w-12 h-12 text-red-500" />;
            default:
                return null;
        }
    };

    const getButtonText = () => {
        return isLoading ? "Stop" : "Close";
    };

    const getButtonStyle = () => {
        if (isLoading) {
            return "bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-6 rounded-full focus:outline-none transition-colors duration-200";
        }
        return "bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-6 rounded-full focus:outline-none transition-colors duration-200";
    };

    if (!show) return null;

    return (
        <dialog
            ref={dialogRef}
            onClick={handleClick}
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-lg p-8 shadow-2xl backdrop:bg-black backdrop:opacity-50 dark:bg-gray-800 dark:text-white max-w-md w-full mx-4"
        >
            <div className="flex flex-col items-center text-center">
                {status && <div className="mb-4">{getIcon()}</div>}
                {title && <h3 className="text-xl font-bold mb-2">{title}</h3>}
                {message && <p className="text-gray-600 dark:text-gray-300">{message}</p>}
                <div className="mt-6 flex justify-center">
                    <button
                        onClick={onClose}
                        className={getButtonStyle()}
                    >
                        {getButtonText()}
                    </button>
                </div>
            </div>
        </dialog>
    );
};

export default ValidationModal;