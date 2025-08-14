// app/about/page.js
import { HiCheckCircle } from "react-icons/hi";

export const metadata = {
    title: "About - CheckMatic",
    description: "Learn more about CheckMatic, the AI-powered fake news detection platform.",
};

export default function About() {
    return (
        <div className="md:mt-16 max-w-4xl mx-auto px-6 flex flex-col justify-center bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
            <div className="flex items-center space-x-2">
                <h1 className="text-4xl font-extrabold mb-6 text-indigo-600 dark:text-indigo-600">About</h1>
                <HiCheckCircle className="w-12 h-12 mb-6 text-indigo-600 dark:text-indigo-600" />
                <h1 className="text-4xl font-extrabold mb-6 text-indigo-600 dark:text-indigo-600">CheckMatic</h1>
            </div>
            <p className="text-lg leading-relaxed mb-4 text-gray-700 dark:text-gray-300">
                CheckMatic is an AI-powered fake news detection platform designed to help users quickly
                verify the authenticity of news articles and social media posts. Using advanced natural
                language processing and machine learning techniques, CheckMatic provides real-time
                analysis to empower informed decisions.
            </p>
            <p className="text-lg leading-relaxed mb-4 text-gray-700 dark:text-gray-300">
                Our goal is to combat misinformation by making fact-checking accessible and easy for
                everyone. Whether you&apos;re a student, journalist, or concerned reader, CheckMatic offers
                a reliable, user-friendly tool to assess the credibility of information in today’s fast-paced
                digital world.
            </p>
        </div>
    );
}