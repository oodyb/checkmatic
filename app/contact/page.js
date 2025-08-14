// app/contact/page.js
"use client";

import { useState } from "react";
import { HiOutlineMail } from "react-icons/hi";
import ContactModal from "../../components/modals/ContactModal";

export default function Contact() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [status, setStatus] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus("Sending...");

        try {
            const response = await fetch("/api/contact", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ name, email, message }),
            });

            if (response.ok) {
                setStatus("Message sent successfully!");
                setName("");
                setEmail("");
                setMessage("");
            } else {
                setStatus("Failed to send message. Please try again.");
            }
        } catch (error) {
            console.error("Submission error:", error);
            setStatus("Failed to send message. Please try again.");
        }
    };

    const handleCloseModal = () => {
        setStatus("");
    };

    return (
        <div className="md:mt-24 max-w-4xl mx-auto px-6 flex flex-col justify-center bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
            <div className="flex items-center justify-center space-x-2 mb-6">
                <h1 className="text-4xl font-extrabold text-indigo-600 dark:text-indigo-600">
                    Contact Us
                </h1>
                <HiOutlineMail className="w-12 h-12 text-indigo-600 dark:text-indigo-600" />
            </div>

            <form onSubmit={handleSubmit} className="w-full max-w-lg mx-auto">
                <p className="text-lg leading-relaxed mb-6 text-gray-700 dark:text-gray-300">
                    Have a question, feedback, or a partnership inquiry? We&apos;d love to hear from you. Please fill out the form below and we&apos;ll get back to you as soon as possible.
                </p>
                <div className="mb-4">
                    <label htmlFor="name" className="block text-gray-700 dark:text-gray-300 font-bold mb-2">
                        Name
                    </label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-200 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700"
                        required
                    />
                </div>
                <div className="mb-4">
                    <label htmlFor="email" className="block text-gray-700 dark:text-gray-300 font-bold mb-2">
                        Email
                    </label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-200 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700"
                        required
                    />
                </div>
                <div className="mb-6">
                    <label htmlFor="message" className="block text-gray-700 dark:text-gray-300 font-bold mb-2">
                        Message
                    </label>
                    <textarea
                        id="message"
                        name="message"
                        rows="4"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-200 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700"
                        required
                    ></textarea>
                </div>
                <div className="flex flex-col items-center justify-center">
                    <button
                        type="submit"
                        className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-6 rounded-full focus:outline-none focus:shadow-outline transition-colors duration-200"
                    >
                        Send Message
                    </button>
                </div>
            </form>

            <ContactModal status={status} onClose={handleCloseModal} />
        </div>
    );
}