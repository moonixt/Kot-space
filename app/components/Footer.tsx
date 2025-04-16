// "use client";

// import Link from "next/link";
// import { useTranslation } from "react-i18next";

// export default function Footer() {
//   const { t } = useTranslation();
//   const currentYear = new Date().getFullYear();
  
//   return (
//     <footer className="w-full py-4 px-4 mt-auto border-t border-[var(--border-color)]">
//       <div className="max-w-screen-xl mx-auto flex flex-col sm:flex-row justify-between items-center">
//         <div className="text-sm text-[var(--foreground)] opacity-75 mb-2 sm:mb-0">
//           © {currentYear} Fair-note. {t('footer.allRightsReserved')}
//         </div>
//         <div className="flex space-x-6">
//           <Link 
//             href="/privacy" 
//             className="text-sm text-[var(--foreground)] opacity-75 hover:opacity-100 hover:underline transition"
//           >
//             {t('footer.privacyPolicy')}
//           </Link>
//         </div>
//       </div>
//     </footer>
//   );
// }