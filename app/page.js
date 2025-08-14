// app/page.js
"use client";

import { useState } from "react";
import SearchBar from "../components/SearchBar";
import AnalysisResult from "../components/AnalysisResult";
import { HiCheckCircle } from "react-icons/hi";

export default function Home() {
  const [analysisData, setAnalysisData] = useState(null); // State to hold the analysis result

  return (
    <main className="flex flex-col items-center justify-center p-6 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="flex items-center space-x-2 md:mt-6">
        <HiCheckCircle className="w-12 h-12 mb-6 text-indigo-600 dark:text-indigo-600" />
        <h1 className="text-4xl font-extrabold mb-6 text-indigo-600 dark:text-indigo-600">CheckMatic</h1>
      </div>

      {/* Pass the state setter function to SearchBar */}
      <SearchBar setAnalysisData={setAnalysisData} />
      
      {/* Conditionally render the AnalysisResult component if data exists */}
      {analysisData && <AnalysisResult analysis={analysisData} />}

    </main>
  );
}