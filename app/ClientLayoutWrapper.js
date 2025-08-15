// app/ClientLayoutWrapper.js
"use client";

import Header from "../components/Header";
import Footer from "../components/Footer";


export default function ClientLayoutWrapper({ children }) {

    return (
        <div>
            <Header />
            <div className="flex-1 overflow-y-auto pt-20">
                {children}
            </div>
            <Footer />

        </div>
    );
}