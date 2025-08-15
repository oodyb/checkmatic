// components/SearchBar.js
"use client";

import { useState, useRef, useEffect } from "react";
import { Search, X, Link, Type, Camera, Upload } from "lucide-react";
import DOMPurify from 'dompurify';
import Image from 'next/image';

import ValidationModal from "./modals/ValidationModal";

// Helper function for URL validation
const isValidUrl = (string) => {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
};

const MAX_FILE_SIZE_MB = 10;

export default function SearchBar({ setAnalysisData }) {
    // Initialize with default values - no sessionStorage check during initialization
    const [mode, setMode] = useState("link");
    const [queries, setQueries] = useState({ link: "", text: "" });
    const [file, setFile] = useState(null);
    const [focused, setFocused] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const [modalData, setModalData] = useState({
        show: false,
        status: "",
        title: "",
        message: "",
    });
    const [isHydrated, setIsHydrated] = useState(false);

    const abortControllerRef = useRef(null);
    const fileInputRef = useRef(null);
    const textareaRef = useRef(null);

    const getCurrentQuery = () => queries[mode] || "";
    const setCurrentQuery = (value) => {
        setQueries(prev => ({ ...prev, [mode]: value }));
    };

    // Load from sessionStorage after component mounts
    useEffect(() => {
        const savedMode = sessionStorage.getItem('searchMode');
        const savedQueries = sessionStorage.getItem('searchQueries');

        if (savedMode) {
            setMode(savedMode);
        }

        if (savedQueries) {
            try {
                setQueries(JSON.parse(savedQueries));
            } catch (error) {
                console.warn('Failed to parse saved queries:', error);
            }
        }

        setIsHydrated(true);
    }, []);

    // Save mode and queries to sessionStorage whenever they change
    useEffect(() => {
        if (isHydrated) {
            sessionStorage.setItem('searchMode', mode);
            sessionStorage.setItem('searchQueries', JSON.stringify(queries));
        }
    }, [mode, queries, isHydrated]);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current && mode === "text") {
            const newHeight = Math.min(textareaRef.current.scrollHeight, 300);
            textareaRef.current.style.height = `${newHeight}px`;
            textareaRef.current.style.overflowY = textareaRef.current.scrollHeight > 300 ? "auto" : "hidden";
        }
    }, [queries.text, mode]);

    const handleStop = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        setModalData({ show: false, status: "", title: "", message: "" });
    };

    const validateAndSetFile = (selectedFile) => {
        if (selectedFile.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
            setModalData({
                show: true,
                status: "error",
                title: "File Too Large",
                message: `Please upload an image smaller than ${MAX_FILE_SIZE_MB}MB.`,
            });
            return false;
        }
        setFile(selectedFile);
        return true;
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            validateAndSetFile(selectedFile);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setDragOver(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setDragOver(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile && droppedFile.type.startsWith("image/")) {
            validateAndSetFile(droppedFile);
        }
    };

    const handleSubmit = async () => {
        let currentQuery = getCurrentQuery();

        // Client-side validation
        if (mode === "link" || mode === "text") {
            if (!currentQuery) {
                setModalData({
                    show: true,
                    status: "error",
                    title: "Empty Input",
                    message: `Please enter a ${mode === "link" ? "URL" : "text"} to analyze.`,
                });
                return;
            }
        }

        if (mode === "link") {
            // Prepend https:// if no protocol is found
            if (!currentQuery.startsWith('http://') && !currentQuery.startsWith('https://')) {
                currentQuery = `https://${currentQuery}`;
            }

            if (!isValidUrl(currentQuery)) {
                setModalData({
                    show: true,
                    status: "error",
                    title: "Invalid URL",
                    message: "Please enter a valid URL.",
                });
                return;
            }
        }

        abortControllerRef.current = new AbortController();

        setModalData({
            show: true,
            status: "loading",
            title: "Processing...",
            message: "Your content is being analyzed.",
        });

        setAnalysisData?.(null);

        try {
            let requestData = { mode };

            if (mode === "link") {
                requestData.query = currentQuery;
            } else if (mode === "text") {
                requestData.content = currentQuery;
            } else if (mode === "photo" && file) {
                const base64 = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result);
                    reader.readAsDataURL(file);
                });
                requestData.photo = {
                    data: base64,
                    name: file.name,
                    size: file.size,
                    type: file.type
                };
            }

            const response = await fetch('/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestData),
                signal: abortControllerRef.current.signal
            });

            const result = await response.json();

            if (!response.ok) {
                const sanitizedError = DOMPurify.sanitize(result.error || "An error occurred during validation.");
                setModalData({
                    show: true,
                    status: "error",
                    title: "Validation Error",
                    message: sanitizedError,
                });
            } else {
                setModalData({
                    show: true,
                    status: "success",
                    title: "Analysis Complete",
                    message: "Content has been successfully analyzed!",
                });
                setAnalysisData?.(result);
            }
        } catch (error) {
            if (error.name === 'AbortError') {
                return;
            }

            console.error("Submit error:", error);
            setModalData({
                show: true,
                status: "error",
                title: "Network Error",
                message: "Failed to connect to the server. Please try again.",
            });
        }
    };

    // Function to handle key presses
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            if (mode === "link") {
                e.preventDefault();
                handleSubmit();
            }
            if (mode === "text" && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                handleSubmit();
            }
        }
    };

    const modeConfig = {
        link: { icon: Link, label: "Link" },
        text: { icon: Type, label: "Text" },
        photo: { icon: Camera, label: "Photo" },
    };

    const hasContent = () => {
        if (mode === "photo") return file !== null;
        return getCurrentQuery().trim().length > 0;
    };

    const hasContentForMode = (m) => {
        if (m === "photo") return file !== null;
        return queries[m]?.trim().length > 0;
    };

    const isDisabled = modalData.status === "loading" || !hasContent();
    const isLoading = modalData.status === "loading";

    const renderAnalyzeButton = () => (
        <button
            type="button"
            onClick={handleSubmit}
            disabled={isDisabled}
            className={`
                flex items-center justify-center p-2 sm:p-3 rounded-xl transition-all duration-300
                ${isDisabled
                    ? "bg-gray-200 dark:bg-gray-600 text-gray-400 dark:text-gray-500 cursor-not-allowed opacity-60"
                    : "bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg hover:shadow-md hover:scale-105 active:scale-95"
                }
            `}
            aria-label="Analyze content"
        >
            <Search className={`h-5 w-5 transition-all duration-300 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
    );

    return (
        <div className="w-full max-w-2xl mx-auto">
            {/* Mode Selector */}
            <div className="mb-3 sm:mb-3">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-2 sm:p-3">
                    <div className="flex space-x-2">
                        {Object.entries(modeConfig).map(([m, config]) => {
                            const Icon = config.icon;
                            const isActive = mode === m;
                            const hasData = hasContentForMode(m);

                            return (
                                <button
                                    key={m}
                                    onClick={() => setMode(m)}
                                    className={`
                                        relative flex-1 flex items-center justify-center gap-2 sm:gap-3 
                                        px-3 sm:px-6 py-3 sm:py-4 rounded-xl
                                        font-semibold text-sm sm:text-base transition-all duration-300 ease-out
                                        min-h-[48px] sm:min-h-[56px] touch-manipulation
                                        ${isActive
                                            ? "bg-indigo-500 text-white shadow-lg scale-[1.02]"
                                            : "text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:scale-[1.01]"
                                        }
                                    `}
                                >
                                    <Icon className="h-5 w-5 flex-shrink-0" />
                                    <span className="hidden sm:inline">{config.label}</span>

                                    {hasData && (
                                        <div
                                            className={`
                                            absolute top-2 right-2 w-2 h-2 rounded-full transition-all duration-300
                                            ${isActive ? 'bg-white/80' : 'bg-green-500'}
                                        `}
                                        />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                {/* Link Mode */}
                {mode === "link" && (
                    <div
                        className={`
                            bg-white dark:bg-gray-800 rounded-2xl shadow-xl border transition-all duration-300
                            ${focused
                                ? "border-indigo-500 shadow-lg scale-[1.005]"
                                : "border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600"
                            }
                        `}
                    >
                        <div className="flex items-center p-4 sm:p-6">
                            <input
                                type="text"
                                value={queries.link}
                                onChange={(e) => setCurrentQuery(e.target.value)}
                                onFocus={() => setFocused(true)}
                                onBlur={() => setFocused(false)}
                                onKeyDown={handleKeyDown}
                                placeholder="Paste your URL here..."
                                className="flex-1 bg-transparent placeholder-gray-500 dark:placeholder-gray-400 outline-none px-2 sm:px-4 text-sm sm:text-lg text-gray-900 dark:text-gray-100 transition-all duration-300"
                                disabled={isLoading}
                            />
                            {renderAnalyzeButton()}
                        </div>
                    </div>
                )}

                {/* Text Mode */}
                {mode === "text" && (
                    <div
                        className={`
                            bg-white dark:bg-gray-800 rounded-2xl shadow-xl border transition-all duration-300
                            ${focused
                                ? "border-indigo-500 shadow-lg scale-[1.005]"
                                : "border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600"
                            }
                        `}
                    >
                        <div className="relative">
                            <textarea
                                ref={textareaRef}
                                rows={6}
                                value={queries.text}
                                onChange={(e) => setCurrentQuery(e.target.value)}
                                onFocus={() => setFocused(true)}
                                onBlur={() => setFocused(false)}
                                onKeyDown={handleKeyDown}
                                placeholder="Type or paste your text here..."
                                className="w-full p-4 sm:p-6 pr-16 resize-none bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 text-sm sm:text-base leading-relaxed min-h-[200px] max-h-[300px] overflow-y-auto transition-all duration-300 outline-none"
                                disabled={isLoading}
                                style={{ transition: 'height 0.3s ease-out' }}
                            />
                            <div className="absolute bottom-4 right-4">
                                {renderAnalyzeButton()}
                            </div>
                        </div>
                    </div>
                )}

                {/* Photo Mode */}
                {mode === "photo" && (
                    <div className="space-y-4 sm:space-y-6">
                        <div
                            className={`
                                bg-white dark:bg-gray-800 rounded-2xl shadow-xl border-2 border-dashed transition-all duration-300 cursor-pointer
                                ${dragOver
                                    ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 scale-[1.02]"
                                    : file
                                        ? "border-green-400 bg-green-50 dark:bg-green-900/20"
                                        : "border-gray-300 dark:border-gray-600 hover:border-indigo-400 dark:hover:border-indigo-600 hover:bg-gray-50 dark:hover:bg-gray-700/30"
                                }
                            `}
                            onClick={!file ? () => fileInputRef.current?.click() : undefined}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                disabled={isLoading}
                                className="hidden"
                            />

                            {!file ? (
                                <div className="p-8 sm:p-12 text-center">
                                    <div
                                        className={`
                                        inline-flex p-4 rounded-2xl mb-4 transition-all duration-300
                                        ${dragOver
                                                ? "bg-indigo-600 text-white scale-125"
                                                : "bg-gray-100 dark:bg-gray-700 text-gray-500 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 hover:text-indigo-600 hover:scale-110"
                                            }
                                    `}
                                    >
                                        <Upload className="h-8 w-8" />
                                    </div>
                                    <h3 className="text-lg sm:text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">
                                        {dragOver ? "Drop it here!" : "Upload your image"}
                                    </h3>
                                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                                        Drag & drop or click to browse (Max {MAX_FILE_SIZE_MB}MB)
                                    </p>
                                </div>
                            ) : (
                                <div className="p-6 sm:p-8">
                                    <div className="relative">
                                        {!isLoading && (
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setFile(null);
                                                }}
                                                className="absolute -top-2 -right-2 p-2 rounded-xl bg-red-500 text-white hover:bg-red-600 shadow-lg transition-all duration-300"
                                                aria-label="Remove image"
                                            >
                                                <X className="h-5 w-5" />
                                            </button>
                                        )}

                                        <div className="relative w-full max-w-sm mx-auto mb-4 overflow-hidden rounded-xl shadow-lg">
                                            <Image
                                                src={URL.createObjectURL(file)}
                                                alt="Preview"
                                                className="w-full h-48 sm:h-64 object-cover"
                                                width={400}
                                                height={300}
                                            />
                                        </div>
                                    </div>

                                    <div className="text-center bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                                        <p className="font-semibold text-gray-800 dark:text-gray-200 mb-1">{file.name}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {(file.size / 1024 / 1024).toFixed(2)} MB
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={isDisabled}
                            className={`
                                w-full flex items-center justify-center gap-3 py-4 sm:py-5 px-6 rounded-2xl 
                                font-bold text-base sm:text-lg transition-all duration-300
                                ${isDisabled
                                    ? "bg-gray-200 dark:bg-gray-700 text-gray-500 cursor-not-allowed opacity-60"
                                    : "bg-indigo-600 hover:bg-indigo-400 text-white shadow-xl hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
                                }
                            `}
                        >
                            <Search className={`h-5 w-5 transition-all duration-300 ${isLoading ? 'animate-spin' : ''}`} />
                            <span>{isLoading ? 'Processing...' : 'Analyze Image'}</span>
                        </button>
                    </div>
                )}
            </div>

            <ValidationModal
                show={modalData.show}
                onClose={isLoading ? handleStop : () => setModalData({ ...modalData, show: false })}
                status={modalData.status}
                title={modalData.title}
                message={modalData.message}
                isLoading={isLoading}
            />
        </div>
    );
}