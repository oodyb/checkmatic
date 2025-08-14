// components/SearchBar.js
"use client";

import { useState, useRef, useEffect } from "react";
import { Search, X, Link, Type, Camera, Upload } from "lucide-react";
import DOMPurify from 'dompurify';

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
    const [mode, setMode] = useState("link");
    const [queries, setQueries] = useState({
        link: "",
        text: "",
    });
    const [file, setFile] = useState(null);
    const [focused, setFocused] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const [modalData, setModalData] = useState({
        show: false,
        status: "",
        title: "",
        message: "",
    });

    const abortControllerRef = useRef(null);
    const fileInputRef = useRef(null);
    const textareaRef = useRef(null);

    const getCurrentQuery = () => queries[mode] || "";
    const setCurrentQuery = (value) => {
        setQueries(prev => ({ ...prev, [mode]: value }));
    };

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current && mode === "text") {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 300)}px`;
        }
    }, [queries.text, mode]);

    const handleClear = () => {
        if (mode === "photo") {
            setFile(null);
        } else {
            setCurrentQuery("");
        }
    };

    const clearAllData = () => {
        setQueries({ link: "", text: "" });
        setFile(null);
    };

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
        const currentQuery = getCurrentQuery();

        // Client-side validation
        if (mode === "link" && !isValidUrl(currentQuery)) {
            setModalData({
                show: true,
                status: "error",
                title: "Invalid URL",
                message: "Please enter a valid URL.",
            });
            return;
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
                console.log('Analysis was stopped by user');
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

    return (
        <div className="w-full max-w-2xl mx-auto">
            {/* Mode Selector */}
            <div className="mb-6 flex space-x-2 bg-white dark:bg-gray-800 p-2 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
                {Object.entries(modeConfig).map(([m, config]) => {
                    const Icon = config.icon;
                    const isActive = mode === m;
                    const hasData = hasContentForMode(m);

                    return (
                        <button
                            key={m}
                            onClick={() => setMode(m)}
                            className={`
                relative flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl 
                font-medium text-sm transition-all duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]
                ${isActive
                                    ? "bg-indigo-600 text-white shadow-lg scale-[1.02] translate-y-[-1px]"
                                    : "text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-50 dark:hover:bg-gray-750 hover:scale-[1.01]"
                                }
              `}
                        >
                            <Icon className="h-4 w-4" />
                            {config.label}

                            {/* Content indicator */}
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

            <div className="space-y-4">
                {/* Link Mode */}
                {mode === "link" && (
                    <div
                        className={`
              relative overflow-hidden rounded-2xl bg-white dark:bg-gray-800 border-2
              transition-all duration-500 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]
              ${focused
                                ? "border-indigo-500 shadow-2xl shadow-indigo-500/20 scale-[1.005]"
                                : "border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl hover:border-indigo-300 dark:hover:border-indigo-600"
                            }
            `}
                    >
                        <div className="flex items-center p-4">
                            <div
                                className={`
                  p-3 rounded-xl transition-all duration-300
                  ${focused
                                        ? "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 scale-110"
                                        : "bg-gray-100 dark:bg-gray-700 text-gray-500"
                                    }
                `}
                            >
                                <Search className="h-5 w-5" />
                            </div>

                            <input
                                type="text"
                                value={queries.link}
                                onChange={(e) => setCurrentQuery(e.target.value)}
                                onFocus={() => setFocused(true)}
                                onBlur={() => setFocused(false)}
                                placeholder="Paste your URL here..."
                                className="flex-1 bg-transparent placeholder-gray-500 outline-none px-4 text-gray-900 dark:text-gray-100 text-lg transition-all duration-300"
                                disabled={isLoading}
                            />

                            {queries.link && !isLoading && (
                                <button
                                    type="button"
                                    onClick={handleClear}
                                    className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all duration-300 hover:scale-110 active:scale-95"
                                    aria-label="Clear search"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Text Mode */}
                {mode === "text" && (
                    <div
                        className={`
              relative overflow-hidden rounded-2xl bg-white dark:bg-gray-800 border-2
              transition-all duration-500 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]
              ${focused
                                ? "border-indigo-500 shadow-2xl shadow-indigo-500/20 scale-[1.003]"
                                : "border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl hover:border-indigo-300 dark:hover:border-indigo-600"
                            }
            `}
                    >
                        <div className="relative">
                            <textarea
                                ref={textareaRef}
                                rows={4}
                                value={queries.text}
                                onChange={(e) => setCurrentQuery(e.target.value)}
                                onFocus={() => setFocused(true)}
                                onBlur={() => setFocused(false)}
                                placeholder="Type or paste your text here..."
                                className="w-full p-4 pr-12 bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-500 resize-none outline-none text-lg leading-relaxed min-h-[120px] max-h-[300px] overflow-y-auto transition-all duration-300"
                                disabled={isLoading}
                                style={{ transition: 'height 0.3s ease-out' }}
                            />

                            {queries.text && !isLoading && (
                                <button
                                    type="button"
                                    onClick={handleClear}
                                    className="absolute top-4 right-4 p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all duration-300 hover:scale-110 active:scale-95"
                                    aria-label="Clear text"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Photo Mode */}
                {mode === "photo" && (
                    <div
                        className={`
              relative overflow-hidden rounded-2xl bg-white dark:bg-gray-800
              border-2 border-dashed transition-all duration-500 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]
              ${dragOver
                                ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30 scale-[1.02] shadow-lg"
                                : file
                                    ? "border-green-400 bg-green-50 dark:bg-green-950/30 shadow-lg"
                                    : "border-gray-300 dark:border-gray-600 hover:border-indigo-40 cursor-pointer hover:scale-[1.005] shadow-lg hover:shadow-xl"
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
                            <div className="p-8 text-center">
                                <div
                                    className={`
                    inline-flex p-4 rounded-2xl mb-4 transition-all duration-500 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]
                    ${dragOver
                                            ? "bg-indigo-500 text-white scale-125 rotate-6"
                                            : "bg-gray-100 dark:bg-gray-700 text-gray-500 hover:scale-110 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 hover:text-indigo-600"
                                        }
                  `}
                                >
                                    <Upload className="h-8 w-8" />
                                </div>
                                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2 transition-all duration-300">
                                    {dragOver ? "Drop it here!" : "Upload your image"}
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 transition-all duration-300">
                                    Drag & drop or click to browse
                                </p>
                            </div>
                        ) : (
                            <div className="p-6">
                                <div className="relative">
                                    {!isLoading && (
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setFile(null);
                                            }}
                                            className="absolute top-2 right-2 z-10 p-2 rounded-xl bg-white/90 dark:bg-gray-800/90 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all duration-300 hover:scale-110 active:scale-95 shadow-lg backdrop-blur-sm"
                                            aria-label="Remove image"
                                        >
                                            <X className="h-5 w-5" />
                                        </button>
                                    )}

                                    {/* Image Preview */}
                                    <div className="relative w-full max-w-xs mx-auto mb-4 overflow-hidden rounded-xl">
                                        <img
                                            src={URL.createObjectURL(file)}
                                            alt="Preview"
                                            className="w-full h-48 object-cover shadow-lg transition-all duration-500 hover:scale-105"
                                        />
                                    </div>
                                </div>

                                <div className="text-center">
                                    <p className="font-medium text-gray-800 dark:text-gray-200 mb-1">{file.name}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {(file.size / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Submit Button */}
                <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isDisabled}
                    className={`
            w-full flex items-center justify-center gap-3 py-4 px-6 rounded-2xl 
            font-semibold text-lg transition-all duration-500 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]
            ${isDisabled
                            ? "bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed opacity-60"
                            : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg hover:shadow-xl hover:shadow-indigo-500/25 hover:scale-[1.02] active:scale-[0.98]"
                        }
          `}
                >
                    <Search className={`h-5 w-5 transition-all duration-300 ${isLoading ? 'animate-spin' : ''}`} />
                    <span>{isLoading ? 'Processing...' : 'Analyze Content'}</span>
                </button>
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