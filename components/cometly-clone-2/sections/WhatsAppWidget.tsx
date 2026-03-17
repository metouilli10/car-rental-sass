import Link from "next/link";

const WHATSAPP_PHONE = "212645792457";
const WHATSAPP_MESSAGE = encodeURIComponent(
  "Bonjour, je souhaite en savoir plus sur Locaryx."
);

function WhatsAppIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="currentColor"
    >
      <path d="M19.05 4.91A9.82 9.82 0 0 0 12.03 2c-5.46 0-9.9 4.44-9.9 9.9 0 1.74.45 3.44 1.31 4.94L2 22l5.32-1.39a9.86 9.86 0 0 0 4.71 1.2h.01c5.46 0 9.9-4.44 9.9-9.9a9.83 9.83 0 0 0-2.89-7ZM12.04 20.14h-.01a8.2 8.2 0 0 1-4.18-1.14l-.3-.18-3.16.83.84-3.08-.2-.32a8.19 8.19 0 0 1-1.26-4.35c0-4.53 3.69-8.22 8.23-8.22a8.16 8.16 0 0 1 5.83 2.42 8.16 8.16 0 0 1 2.4 5.81c0 4.53-3.69 8.22-8.2 8.23Zm4.5-6.16c-.25-.13-1.5-.74-1.73-.82-.23-.08-.4-.13-.57.12-.17.25-.66.82-.8.98-.15.17-.3.19-.55.07-.25-.13-1.07-.39-2.04-1.25-.76-.67-1.27-1.5-1.42-1.75-.15-.25-.02-.38.11-.5.11-.11.25-.3.38-.45.12-.15.17-.25.25-.42.08-.17.04-.32-.02-.45-.07-.13-.57-1.37-.78-1.88-.21-.49-.42-.42-.57-.43h-.49c-.17 0-.45.07-.68.32-.23.25-.88.86-.88 2.09s.9 2.42 1.02 2.59c.13.17 1.77 2.7 4.29 3.78.6.26 1.07.41 1.43.53.6.19 1.15.16 1.58.1.48-.07 1.5-.61 1.71-1.2.21-.59.21-1.1.15-1.2-.06-.1-.23-.17-.48-.3Z" />
    </svg>
  );
}

export function WhatsAppWidget() {
  return (
    <div className="fixed bottom-4 right-4 z-[60] md:bottom-6 md:right-6">
      <Link
        href={`https://wa.me/${WHATSAPP_PHONE}?text=${WHATSAPP_MESSAGE}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Contacter Locaryx sur WhatsApp"
        className="flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_18px_40px_rgba(37,211,102,0.28)] transition-transform duration-200 hover:scale-[1.02] hover:bg-[#20bd5c]"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/18">
          <WhatsAppIcon />
        </span>
      </Link>
    </div>
  );
}
