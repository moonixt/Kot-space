"use client";

import { useState, useRef, useEffect } from "react";
import { ProtectedRoute } from "../components/ProtectedRoute";
import Link from "next/link";
import {
  ArrowLeft,
  Upload,
  Book,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
// import { useTranslation } from "react-i18next";
import i18n from "../../i18n";
import Profile from "../profile/page";

interface EbookFile {
  name: string;
  file: File;
  url: string;
  fileType: string;
}

export default function EbookReaderPage() {
  const [currentEbook, setCurrentEbook] = useState<EbookFile | null>(null);
  const [ebookContent, setEbookContent] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // const { t } = useTranslation();

  // Initialize language detection based on browser language
  useEffect(() => {
    const browserLang = navigator.language;
    const supportedLanguages = Object.keys(i18n.options.resources || {});

    if (browserLang && supportedLanguages.includes(browserLang)) {
      i18n.changeLanguage(browserLang);
    } else if (browserLang && browserLang.startsWith("pt")) {
      i18n.changeLanguage("pt-BR");
    }
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];

    // Check if file is a supported format (PDF, EPUB, TXT)
    const fileExt = file.name.split(".").pop()?.toLowerCase();
    const supportedFormats = ["pdf", "epub", "txt"];

    if (!fileExt || !supportedFormats.includes(fileExt)) {
      alert("Only PDF, EPUB, and TXT files are supported.");
      return;
    }

    setLoading(true);
    try {
      // Create a URL for the file
      const url = URL.createObjectURL(file);

      // Create a local ebook object
      const newEbook: EbookFile = {
        name: file.name,
        file: file,
        url: url,
        fileType: fileExt,
      };

      // Set as current ebook
      setCurrentEbook(newEbook);

      // Load content
      await loadEbookContent(newEbook);
    } catch (error) {
      console.error("Error processing file:", error);
      alert("Error processing file. Please try again.");
    } finally {
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const loadEbookContent = async (ebook: EbookFile) => {
    try {
      if (ebook.fileType === "txt") {
        // Read text file
        const text = await ebook.file.text();
        setEbookContent(text);
        setTotalPages(1);
        setCurrentPage(1);
      } else if (ebook.fileType === "pdf") {
        // For PDF, we'll use the object URL directly
        setEbookContent(ebook.url);
        // We don't have a way to get PDF page count in a browser environment without additional libraries
        setTotalPages(1);
        setCurrentPage(1);
      } else if (ebook.fileType === "epub") {
        // For EPUB, we would need a specialized library
        setEbookContent(ebook.url);
        setTotalPages(1);
        setCurrentPage(1);
      }
    } catch (error) {
      console.error("Error loading ebook content:", error);
      alert("Error loading ebook content. Please try again.");
    }
  };

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const closeEbook = () => {
    if (currentEbook?.url) {
      URL.revokeObjectURL(currentEbook.url);
    }
    setCurrentEbook(null);
    setEbookContent("");
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[var(--background)] flex flex-col">
        <Profile />

        <div className="p-4 max-w-7xl mx-auto w-full flex-grow flex flex-col">
          {/* Header */}
          <div className="w-full mt-2 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 text-xs px-3 py-1.5 rounded-md">
            ⚠️ Alpha version: This ebook reader currently works only on
            desktop/laptop computers and for now only support PDFs and TXT
          </div>
          <div className="flex items-center mb-6">
            <Link
              href="/dashboard"
              className="p-2 rounded-full hover:bg-[var(--container)] transition-colors mr-2"
              title="Back to Dashboard"
            >
              <ArrowLeft size={20} className="text-[var(--foreground)]" />
            </Link>
            <h1 className="text-2xl font-bold text-[var(--foreground)] flex items-center gap-2">
              <Book size={24} />
              Ebook Reader
            </h1>

            {/* Open button */}
            <div className="ml-auto">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                className="flex items-center gap-2 bg-[var(--accent-color)] hover:bg-opacity-85 text-white px-4 py-2 rounded-md transition-colors"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Loading...</span>
                  </>
                ) : (
                  <>
                    <Upload size={18} />
                    <span>Open Ebook</span>
                  </>
                )}
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".pdf,.epub,.txt"
                className="hidden"
              />
            </div>
          </div>

          {/* Reader panel */}
          <div className="flex-grow bg-[var(--container)] rounded-lg p-4 min-h-[calc(100vh-200px)] flex flex-col">
            {currentEbook ? (
              <>
                <div className="mb-4 flex items-center justify-between flex-wrap gap-2">
                  <h2 className="text-lg font-semibold text-[var(--foreground)] break-all max-w-full">
                    {currentEbook.name}
                  </h2>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      className="p-2 rounded hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors text-red-500"
                      onClick={closeEbook}
                      title="Close this ebook"
                    >
                      Fechar
                    </button>
                    <button
                      className="p-2 rounded-full hover:bg-[var(--container-hover)] disabled:opacity-50"
                      onClick={prevPage}
                      disabled={currentPage <= 1}
                    >
                      <ChevronLeft
                        size={20}
                        className="text-[var(--foreground)]"
                      />
                    </button>
                    <span className="text-sm text-[var(--foreground)]">
                      Página {currentPage} de {totalPages}
                    </span>
                    <button
                      className="p-2 rounded-full hover:bg-[var(--container-hover)] disabled:opacity-50"
                      onClick={nextPage}
                      disabled={currentPage >= totalPages}
                    >
                      <ChevronRight
                        size={20}
                        className="text-[var(--foreground)]"
                      />
                    </button>
                  </div>
                </div>
                <div className="flex-grow overflow-auto bg-white dark:bg-slate-900 rounded-md p-2 sm:p-5">
                  {currentEbook.fileType === "txt" ? (
                    <div className="whitespace-pre-wrap text-black dark:text-white font-serif leading-relaxed">
                      {ebookContent}
                    </div>
                  ) : currentEbook.fileType === "pdf" ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <iframe
                        src={`${ebookContent}#page=${currentPage}`}
                        className="w-full min-h-[60vh] h-full"
                        title={currentEbook.name}
                      />
                    </div>
                  ) : currentEbook.fileType === "epub" ? (
                    <div className="w-full h-full flex items-center justify-center text-center text-[var(--foreground)]">
                      <div>
                        <p>EPUB não suportado nativamente</p>
                        <a
                          href={currentEbook.url}
                          download={currentEbook.name}
                          className="mt-4 inline-block bg-[var(--accent-color)] text-white px-4 py-2 rounded-md"
                        >
                          Baixar EPUB
                        </a>
                      </div>
                    </div>
                  ) : null}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-[var(--foreground-muted)]">
                <div className="text-center w-full">
                  <Book size={48} className="mx-auto mb-4 opacity-60" />
                  <h3 className="text-xl font-medium mb-2">
                    Nenhum ebook aberto
                  </h3>
                  <p className="mb-6">Abra um arquivo para começar a leitura</p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-[var(--accent-color)] text-white rounded-md hover:bg-opacity-90 transition-colors flex items-center gap-2 mx-auto"
                  >
                    <Upload size={16} />
                    <span>Abrir Ebook</span>
                  </button>
                  <p className="text-xs mt-6 max-w-md mx-auto">
                    Formatos suportados: PDF, EPUB, TXT. O arquivo é aberto
                    localmente e não é salvo.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
