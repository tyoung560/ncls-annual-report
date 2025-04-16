import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-200 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex justify-center md:order-2 space-x-6">
            <Link href="/about" className="text-gray-500 hover:text-gray-600">
              About
            </Link>
            <Link href="/privacy" className="text-gray-500 hover:text-gray-600">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-gray-500 hover:text-gray-600">
              Terms of Service
            </Link>
            <Link href="/help" className="text-gray-500 hover:text-gray-600">
              Help
            </Link>
          </div>
          <div className="mt-8 md:mt-0 md:order-1">
            <p className="text-center text-base text-gray-500">
              &copy; {currentYear} North Country Library System. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
