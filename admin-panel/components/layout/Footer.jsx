export default function Footer() {
  return (
    <footer className="bg-white border-t mt-auto">
      <div className="px-4 sm:px-6 lg:px-8 py-4">
        <p className="text-center text-sm text-gray-500">
          © {new Date().getFullYear()} Parkent Express. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
