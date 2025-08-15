// components/Footer.js
export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="mt-auto">
            <div className="container mx-auto py-8 bg-white dark:bg-gray-900">
                <div className="text-center text-xs text-gray-500 dark:text-gray-400">
                    <p>&copy; {currentYear} CheckMatic. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
}