// components/Header.js
"use client";

import Link from "next/link";
import { FaGithub, FaLinkedinIn } from "react-icons/fa";
import {
    HiOutlineHome,
    HiOutlineInformationCircle,
    HiOutlineMail,
} from "react-icons/hi";

const links = [
    { href: "/", label: "Home", icon: HiOutlineHome },
    { href: "/about", label: "About", icon: HiOutlineInformationCircle },
    { href: "/contact", label: "Contact", icon: HiOutlineMail },
    {
        href: "https://github.com/oodyb/checkmatic",
        label: "GitHub",
        icon: FaGithub,
        external: true,
    },
    {
        href: "https://www.linkedin.com/in/alwaleed-sarieh-daher/",
        label: "LinkedIn",
        icon: FaLinkedinIn,
        external: true,
    },
];

const linkStyles =
    "p-2 md:p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-indigo-600 dark:hover:text-indigo-400 flex flex-col md:flex-row items-center md:space-x-2 transition-all duration-300 ease-in-out hover:shadow-md group";

export default function Header() {
    return (
        <header className="fixed top-0 left-0 w-full z-50 bg-white dark:bg-gray-900 bg-opacity-90 dark:bg-opacity-90 backdrop-blur-sm dark:border-gray-700">
            <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 md:py-4">
                <nav className="flex justify-center space-x-1 md:space-x-2 text-gray-700 dark:text-gray-300 font-medium">
                    {links.map((link) => (
                        <Link
                            key={link.label}
                            href={link.href}
                            className={linkStyles}
                            {...(link.external && { target: "_blank", rel: "noopener noreferrer" })}
                        >
                            <link.icon className="w-5 h-5 md:w-6 md:h-6 mb-1 md:mb-0" />
                            <span className="text-xs md:text-base leading-tight text-center md:text-left">
                                {link.label}
                            </span>
                        </Link>
                    ))}
                </nav>
            </div>
        </header>
    );
}