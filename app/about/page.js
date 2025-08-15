// app/about/page.js
import { HiCheckCircle } from "react-icons/hi";

export const metadata = {
    title: "About - CheckMatic",
    description: "Learn more about CheckMatic.",
};

export default function About() {
    return (
        <div className="pt-20 md:pt-24 min-h-screen bg-white dark:bg-gray-900">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="py-8 sm:py-12">
                    {/* Header Section */}
                    <div className="text-center mb-8 sm:mb-12">
                        <div className="flex items-center justify-center space-x-2 sm:space-x-3 mb-4">
                            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-indigo-600 dark:text-indigo-400">
                                About
                            </h1>
                            <HiCheckCircle className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-indigo-600 dark:text-indigo-400" />
                            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-indigo-600 dark:text-indigo-400">
                                CheckMatic
                            </h1>
                        </div>
                    </div>

                    {/* Content Section */}
                    <div className="max-w-3xl mx-auto space-y-6 sm:space-y-8">
                        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-6 sm:p-8 border border-gray-200 dark:border-gray-700">
                            <h2 className="text-xl sm:text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">
                                What is CheckMatic?
                            </h2>
                            <p className="text-base sm:text-lg leading-relaxed text-gray-700 dark:text-gray-300">
                                CheckMatic is an AI-powered fake news detection platform designed to help users quickly
                                verify the authenticity of news articles and social media posts. Powered by advanced 
                                natural language processing and machine learning techniques, CheckMatic provides real-time
                                analysis to empower informed decisions.
                            </p>
                        </div>

                        <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl p-6 sm:p-8 border border-indigo-200 dark:border-indigo-800">
                            <h2 className="text-xl sm:text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">
                                Our Mission
                            </h2>
                            <p className="text-base sm:text-lg leading-relaxed text-gray-700 dark:text-gray-300">
                                Our goal is to combat misinformation by making fact-checking accessible and easy for
                                everyone. CheckMatic offers a reliable, user-friendly tool to assess the credibility 
                                of information in today&#39;s fast-paced digital world.
                            </p>
                        </div>

                        {/* Features Section */}
                        <div className="grid gap-4 sm:gap-6 sm:grid-cols-2">
                            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-5 sm:p-6 border border-green-200 dark:border-green-800">
                                <h3 className="text-lg sm:text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100">
                                    Real-time Analysis
                                </h3>
                                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                                    Get instant assessments powered by advanced AI algorithms.
                                </p>
                            </div>

                            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-5 sm:p-6 border border-blue-200 dark:border-blue-800">
                                <h3 className="text-lg sm:text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100">
                                    User-Friendly
                                </h3>
                                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                                    Simple interface designed for users of all technical backgrounds.
                                </p>
                            </div>

                            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-5 sm:p-6 border border-purple-200 dark:border-purple-800">
                                <h3 className="text-lg sm:text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100">
                                    Comprehensive Detection
                                </h3>
                                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                                    Analyzes credibility, content type, and potential bias in articles.
                                </p>
                            </div>

                            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-5 sm:p-6 border border-orange-200 dark:border-orange-800">
                                <h3 className="text-lg sm:text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100">
                                    Accessible Everywhere
                                </h3>
                                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                                    Available for anyone seeking reliable information.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}