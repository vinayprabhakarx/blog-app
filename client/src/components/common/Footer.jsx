import React from "react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full text-sm text-center bg-background py-4 text-foreground no-print border-t border-border">
      &copy; {currentYear} | Designed & Developed By:{" "}
      <a
        href="https://vinayprabhakar.dev"
        target="_blank"
        rel="noopener noreferrer"
        className="hover:text-primary"
      >
        <strong>@VinayPrabhakarX</strong>
      </a>
    </footer>
  );
};

export default Footer;
