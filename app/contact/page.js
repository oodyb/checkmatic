// app/contact/page.js
"use client";

import { useState } from "react";
import { HiOutlineMail } from "react-icons/hi";
import { HiUser, HiAtSymbol, HiChatBubbleLeftRight } from "react-icons/hi2";
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
        <div className="pt-20 md:pt-24 min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="py-8 sm:py-12">
                    {/* Header Section */}
                    <div className="text-center mb-8 sm:mb-12">
                        <div className="flex items-center justify-center space-x-2 sm:space-x-3 mb-4">
                            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-indigo-600 dark:text-indigo-400">
                                Contact Us
                            </h1>
                            <HiOutlineMail className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <p className="text-base sm:text-lg leading-relaxed text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                            Have a question, feedback, or a partnership inquiry? We&#39;d love to hear from you.
                        </p>
                    </div>

                    {/* Contact Form Card */}
                    <div className="max-w-2xl mx-auto">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                            <div className="p-6 sm:p-8 lg:p-10">
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {/* Name Field */}
                                    <div className="space-y-2">
                                        <label htmlFor="name" className="flex items-center text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300">
                                            <HiUser className="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400" />
                                            Name
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                id="name"
                                                name="name"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                className="w-full px-4 py-3 sm:py-4 text-sm sm:text-base bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                                                placeholder="Your full name"
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* Email Field */}
                                    <div className="space-y-2">
                                        <label htmlFor="email" className="flex items-center text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300">
                                            <HiAtSymbol className="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400" />
                                            Email
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="email"
                                                id="email"
                                                name="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="w-full px-4 py-3 sm:py-4 text-sm sm:text-base bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                                                placeholder="your.email@example.com"
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* Message Field */}
                                    <div className="space-y-2">
                                        <label htmlFor="message" className="flex items-center text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300">
                                            <HiChatBubbleLeftRight className="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400" />
                                            Message
                                        </label>
                                        <div className="relative">
                                            <textarea
                                                id="message"
                                                name="message"
                                                rows="5"
                                                value={message}
                                                onChange={(e) => setMessage(e.target.value)}
                                                className="w-full px-4 py-3 sm:py-4 text-sm sm:text-base bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 resize-none"
                                                placeholder="Tell us about your question, feedback, or partnership inquiry..."
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* Submit Button */}
                                    <div className="pt-0">
                                        <button
                                            type="submit"
                                            disabled={status === "Sending..."}
                                            className="w-full sm:w-auto sm:min-w-[200px] mx-auto flex items-center justify-center px-6 py-3 sm:py-4 bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-400 text-white font-semibold text-sm sm:text-base rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100 disabled:cursor-not-allowed"
                                        >
                                            {status === "Sending..." ? (
                                                <>
                                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    Sending...
                                                </>
                                            ) : (
                                                <>
                                                    <HiOutlineMail className="w-5 h-5 mr-2" />
                                                    Send Message
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>

                        <div className="mt-8 text-center">
                            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                                We typically respond within 24 hours
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <ContactModal status={status} onClose={handleCloseModal} />
        </div>
    );
}