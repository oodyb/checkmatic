// app/page.js
"use client";

import { useState, useEffect } from "react";
import SearchBar from "../components/SearchBar";
import AnalysisResult from "../components/AnalysisResult";
import { HiCheckCircle } from "react-icons/hi";

export default function Home() {
  const [analysisData, setAnalysisData] = useState(() => {
    if (typeof window !== "undefined") {
      const savedData = sessionStorage.getItem('analysisData');
      return savedData ? JSON.parse(savedData) : null;
    }
    return null;
  });

  useEffect(() => {
    if (analysisData) {
      sessionStorage.setItem('analysisData', JSON.stringify(analysisData));
    } else {
      sessionStorage.removeItem('analysisData');
    }
  }, [analysisData]);

  return (
    <main className="flex flex-col items-center justify-center p-6 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="flex items-center space-x-2 mt-6">
        <HiCheckCircle className="w-12 h-12 mb-6 text-indigo-600 dark:text-indigo-400" />
        <h1 className="text-4xl font-extrabold mb-6 text-indigo-600 dark:text-indigo-400">CheckMatic</h1>
      </div>

      <SearchBar setAnalysisData={setAnalysisData} />

      {analysisData && <AnalysisResult analysis={analysisData} />}

    </main>
  );
}