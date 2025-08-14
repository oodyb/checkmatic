// app/components/modals/ContactModal.js
"use client";

import { useEffect, useRef } from 'react';
import { AiOutlineCloseCircle, AiOutlineCheckCircle, AiOutlineLoading3Quarters } from 'react-icons/ai';

const ContactModal = ({ status, onClose }) => {
    const dialogRef = useRef(null);

    useEffect(() => {
        if (status) {
            dialogRef.current?.showModal();
        } else {
            dialogRef.current?.close();
        }
    }, [status]);

    let icon;
    let message;
    let title;

    switch (status) {
        case "Sending...":
            icon = <AiOutlineLoading3Quarters className="w-12 h-12 text-indigo-500 animate-spin" />;
            message = "Your message is being sent.";
            title = "Sending...";
            break;
        case "Message sent successfully!":
            icon = <AiOutlineCheckCircle className="w-12 h-12 text-green-500" />;
            message = "Your message was sent successfully! We'll get back to you soon.";
            title = "Success!";
            break;
        case "Failed to send message. Please try again.":
            icon = <AiOutlineCloseCircle className="w-12 h-12 text-red-500" />;
            message = "There was an error sending your message. Please try again.";
            title = "Error!";
            break;
        default:
            return null;
    }

    return (
        <dialog
            ref={dialogRef}
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-lg p-8 shadow-2xl backdrop:bg-black backdrop:opacity-50 dark:bg-gray-800 dark:text-white max-w-md w-full mx-4"
        >
            <div className="flex flex-col items-center text-center">
                <div className="mb-4">
                    {icon}
                </div>
                <h3 className="text-xl font-bold mb-2">{title}</h3>
                <p className="text-gray-600 dark:text-gray-300">{message}</p>
                <div className="mt-6 flex justify-center">
                    <button
                        onClick={onClose}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-6 rounded-full focus:outline-none transition-colors duration-200"
                    >
                        Close
                    </button>
                </div>
            </div>
        </dialog>
    );
};

export default ContactModal;