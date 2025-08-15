// app/components/modals/ValidationModal.js
"use client";

import { useEffect, useRef, useCallback } from 'react';
import { AiOutlineCloseCircle, AiOutlineCheckCircle, AiOutlineLoading3Quarters } from 'react-icons/ai';

const ValidationModal = ({ show, onClose, status, title, message, isLoading = false }) => {
    const dialogRef = useRef(null);

    useEffect(() => {
        if (show) {
            dialogRef.current?.showModal();
            document.body.style.overflow = 'hidden';
        } else {
            dialogRef.current?.close();
            document.body.style.overflow = '';
        }
    }, [show]);

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
                return <AiOutlineLoading3Quarters className="w-10 h-10 sm:w-12 sm:h-12 text-indigo-500 animate-spin" />;
            case "success":
                return <AiOutlineCheckCircle className="w-10 h-10 sm:w-12 sm:h-12 text-green-500" />;
            case "error":
                return <AiOutlineCloseCircle className="w-10 h-10 sm:w-12 sm:h-12 text-red-500" />;
            default:
                return null;
        }
    };

    const getButtonText = () => {
        return isLoading ? "Stop" : "Close";
    };

    const getButtonStyle = () => {
        const baseStyle = "font-bold py-2 px-6 rounded-full focus:outline-none transition-colors duration-200";
        const mobileStyle = "py-1.5 px-4 text-sm sm:py-2 sm:px-6 sm:text-base";
        
        if (isLoading) {
            return `bg-red-600 hover:bg-red-500 text-white ${baseStyle} ${mobileStyle}`;
        }
        return `bg-indigo-600 hover:bg-indigo-500 text-white ${baseStyle} ${mobileStyle}`;
    };

    if (!show) return null;

    return (
        <dialog
            ref={dialogRef}
            onClick={handleClick}
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-lg p-6 sm:p-8 shadow-2xl backdrop:bg-black backdrop:opacity-50 dark:bg-gray-800 dark:text-white w-11/12 max-w-sm md:max-w-md transition-opacity duration-300 ease-in-out"
        >
            <div className="flex flex-col items-center text-center">
                {status && <div className="mb-4">{getIcon()}</div>}
                {title && <h3 className="text-lg sm:text-xl font-bold mb-2">{title}</h3>}
                {message && <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">{message}</p>}
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