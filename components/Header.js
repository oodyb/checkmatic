// components/Header.js
"use client";

import Link from "next/link";
import { FaGithub } from "react-icons/fa";
import {
    HiOutlineHome,
    HiOutlineInformationCircle,
    HiOutlineMail,
    HiMenu,
    HiX,
} from "react-icons/hi";
import { useState } from "react";

const links = [
    { href: "/", label: "Home", icon: HiOutlineHome },
    { href: "/about", label: "About", icon: HiOutlineInformationCircle },
    { href: "/contact", label: "Contact", icon: HiOutlineMail },
    {
        href: "https://github.com/oodyb",
        label: "GitHub",
        icon: FaGithub,
        external: true,
    },
];

const desktopLinkStyles =
    "p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center space-x-1 transition-all duration-300 ease-in-out hover:shadow-md";

const mobileLinkStyles =
    "flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-indigo-600";

export default function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    return (
        <>
            <header className="fixed top-0 left-0 w-full bg-opacity-90 dark:bg-opacity-90 z-50">
                <div className="max-w-7xl mx-auto flex items-center justify-center px-6 py-4">
                    <div className="hidden md:block"></div>

                    <nav className="hidden md:flex space-x-2 text-gray-700 dark:text-gray-300 font-medium items-center backdrop-blur-xs rounded-xs">
                        {links.map((link) => (
                            <Link
                                key={link.label}
                                href={link.href}
                                className={desktopLinkStyles}
                                {...(link.external && { target: "_blank", rel: "noopener noreferrer" })}
                            >
                                <link.icon className="w-6 h-6" />
                                <span>{link.label}</span>
                            </Link>
                        ))}
                    </nav>

                    <button
                        aria-label="Toggle menu"
                        className="md:hidden ml-auto text-indigo-600 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 focus:outline-none cursor-pointer"
                        onClick={toggleMenu}
                    >
                            <HiMenu className="w-8 h-8 text-indigo-600 hover:text-indigo-400 backdrop-blur-xs rounded-xs" />
                    </button>
                </div>
            </header>

            {isMenuOpen && (
                <div
                    className="fixed inset-0 backdrop-blur-sm z-40 md:hidden"
                    onClick={toggleMenu}
                />
            )}

            <div
                className={`fixed top-0 right-0 h-full w-64 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 shadow-lg transform transition-transform duration-300 ease-in-out z-50 ${isMenuOpen ? "translate-x-0" : "translate-x-full"
                    }`}
            >
                <div className="flex justify-end p-4">
                    <button
                        aria-label="Close menu"
                        onClick={toggleMenu}
                        className="text-indigo-600 hover:text-indigo-400 focus:outline-none cursor-pointer"
                    >
                        <HiX className="w-8 h-8" />
                    </button>
                </div>

                <nav className="flex flex-col space-y-4 px-6 pb-6 font-medium">
                    {links.map((link) => (
                        <Link
                            key={link.label}
                            href={link.href}
                            onClick={toggleMenu}
                            className={mobileLinkStyles}
                            {...(link.external && { target: "_blank", rel: "noopener noreferrer" })}
                        >
                            <link.icon className="w-6 h-6" />
                            <span>{link.label}</span>
                        </Link>
                    ))}
                </nav>
            </div>
        </>
    );
}