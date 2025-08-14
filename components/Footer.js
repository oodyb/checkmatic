// components/Footer.js
export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="mt-auto">
            <div className="container mx-auto py-8">
                <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                    <p>&copy; {currentYear} CheckMatic. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
}