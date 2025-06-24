// NEED REVIEW

"use client";

import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "next-i18next";
import Link from "next/link";

const Ia = () => {
  const { t } = useTranslation("translation");
  const [inputValue, setInputValue] = useState("");
  const [chatResult, setChatResult] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [prevResult, setPrevResult] = useState<string[]>([]);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [test, setTest] = useState<Response | string>("");
  const [counter, setCounter] = useState(0);
  const [messagesLeft, setMessagesLeft] = useState(7);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [chatResult, prevResult]);

  // Focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  function countTime(): number {
    const start = counter;
    setCounter(start + 1);
    console.log("Many time bot chatted:", start);
    return start;
  }

  useEffect(() => {
    console.log("Use Effect executed");
    countTime();
  }, [test]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!inputValue.trim()) return;

    setIsLoading(true);
    setChatResult("");

    // Store user message
    const userMessage = inputValue;
    setPrevResult((prev) => [...prev, `USER: ${userMessage}`]);

    // Decrease messages left count
    if (messagesLeft > 0) {
      setMessagesLeft(messagesLeft - 1);
    }

    try {
      // Call your Next.js API route instead of the external endpoint
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          input_value: inputValue,
          output_type: "chat",
          input_type: "chat",
          tweaks: {
            "ChatInput-C95xY": {
              sender: "User",
              sender_name: "User",
              should_store_message: true,
            },
            "ChatOutput-sG4tO": {
              clean_data: true,
              data_template: "{text}",
              should_store_message: true,
            },
            "GroqModel-l81mn": {
              api_key: "", // API key handled on server
              base_url: "https://api.groq.com",
              model_name: "gemma2-9b-it",
              temperature: 0.1,
              stream: true,
            },
          },
        }),
      });

      setTest(response);

      if (!response.ok) {
        throw new Error(`Erro na API: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error(
          "Erro: A resposta não contém um corpo legível (ReadableStream)",
        );
      }

      const decoder = new TextDecoder();
      let accumulatedText = "";
      let partialLine = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          // Adicione este delay para desacelerar o streaming
          await new Promise((res) => setTimeout(res, 80)); // 80ms de atraso, ajuste como quiser

          const chunk = decoder.decode(value, { stream: true });
          partialLine += chunk;
          const lines = partialLine.split("\n");
          partialLine = lines.pop() || "";

          for (const line of lines) {
            if (line.trim() === "") continue;

            try {
              const event = JSON.parse(line);
              if (
                event.event === "token" &&
                event.data &&
                event.data.chunk !== undefined
              ) {
                accumulatedText += event.data.chunk;
                // Update the UI with the accumulated text
                setChatResult(accumulatedText);
              }
            } catch (e) {
              console.error("Erro ao processar linha JSON:", line, e);
            }
          }
        }

        if (accumulatedText) {
          setPrevResult((prev) => [...prev, `ATENA: ${accumulatedText}`]);
          setChatResult(""); // Clear the streaming result once it's added to history
          console.log("Added response to history:", accumulatedText);
        }
      } catch (error) {
        console.error("Erro ao processar stream:", error);
      }
    } catch (error) {
      console.error("Erro ao processar stream:", error);
    }

    setInputValue("");
    setIsLoading(false);
    // Focus input after submit
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Handle keydown events for sending with Enter and new line with Shift+Enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault(); // Prevent default to avoid new line
      if (inputValue.trim()) {
        handleSubmit(e as unknown as React.FormEvent);
      }
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-full w-full flex-col bg-[var(--background)] text-[var(--foreground)]">
        {/* Header */}
        <div className="border-b border-[var(--border-color)]/40 py-3">
          <div className="flex justify-center items-center text-xl font-medium">
            <h1 className="tracking-wide">Lynxky-AI</h1>
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1 overflow-hidden">
          <div
            ref={scrollAreaRef}
            className="h-full overflow-y-auto p-4 pb-32 md:p-6 md:pb-36 space-y-4"
            style={{
              scrollbarWidth: "thin",
              scrollbarColor: "#666 transparent",
            }}
          >
            {prevResult.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center px-4 md:px-8 text-gray-400">
                <h2 className="text-3xl font-semibold mb-5 text-[var(--foreground)]">
                  {t("chatAssistent.welcome", "How can I help you?")}
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8 w-full max-w-2xl">
                  <a
                    href="/editor"
                    className="flex items-center gap-2 bg-[var(--background)] hover:bg-[var(--button-bg2)]/10 border border-[var(--border-color)] rounded-lg p-3 transition-all"
                  >
                    <svg
                      className="w-5 h-5 text-[var(--accent-color)]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      ></path>
                    </svg>
                    <span>{t("chatAssistent.editor", "Editor")}</span>
                  </a>
                  <a
                    href="/dashboard"
                    className="flex items-center gap-2 bg-[var(--background)] hover:bg-[var(--button-bg2)]/10 border border-[var(--border-color)] rounded-lg p-3 transition-all"
                  >
                    <svg
                      className="w-5 h-5 text-[var(--accent-color)]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M4 6h16M4 10h16M4 14h16M4 18h16"
                      ></path>
                    </svg>
                    <span>{t("chatAssistent.dashboard", "Dashboard")}</span>
                  </a>
                  <a
                    href="/settings"
                    className="flex items-center gap-2 bg-[var(--background)] hover:bg-[var(--button-bg2)]/10 border border-[var(--border-color)] rounded-lg p-3 transition-all"
                  >
                    <svg
                      className="w-5 h-5 text-[var(--accent-color)]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      ></path>
                    </svg>
                    <span>{t("chatAssistent.settings", "Settings")}</span>
                  </a>
                  <a
                    href="/privacy"
                    className="flex items-center gap-2 bg-[var(--background)] hover:bg-[var(--button-bg2)]/10 border border-[var(--border-color)] rounded-lg p-3 transition-all"
                  >
                    <svg
                      className="w-5 h-5 text-[var(--accent-color)]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      ></path>
                    </svg>
                    <span>{t("chatAssistent.privacy", "Privacy")}</span>
                  </a>
                </div>

                <div className="space-y-4 max-w-md mx-auto">
                  <Link href="/terms">
                    <div className="bg-[var(--background)] hover:bg-[var(--button-bg2)]/10 border border-[var(--border-color)] rounded-lg p-3 cursor-pointer transition-all">
                      <p className="text-[var(--foreground)]">
                        {t(
                          "chatAssistent.support",
                          "How do I contact the support?",
                        )}
                      </p>
                    </div>
                  </Link>
                  {/* <div className="bg-[var(--background)] hover:bg-[var(--button-bg2)]/10 border border-[var(--border-color)] rounded-lg p-3 cursor-pointer transition-all">
                    <p className="text-[var(--foreground)]">{t('chatAssistent.editorHelp', 'What can I do with the editor?')}</p>
                  </div> */}

                  {/* <div className="bg-[var(--background)] hover:bg-[var(--button-bg2)]/10 border border-[var(--border-color)] rounded-lg p-3 cursor-pointer transition-all">
                    <p className="text-[var(--foreground)]">{t('chatAssistent.createNote', 'How do I create a new note?')}</p>
                  </div> */}
                </div>
              </div>
            )}

            {/* Chat messages */}
            {prevResult.map((result, index) => {
              const isUser = result.startsWith("USER:");
              const messageContent = isUser
                ? result.substring(5).trim()
                : result.substring(6).trim();

              return (
                <div
                  key={index}
                  className={`flex items-start ${isUser ? "justify-end" : ""}`}
                >
                  <div
                    className={`max-w-[90%] md:max-w-[80%] ${isUser ? "mr-0" : "ml-0"}`}
                  >
                    <div
                      className={`rounded-2xl p-4 text-[15px] leading-relaxed ${
                        isUser
                          ? "bg-[var(--button-bg1)] text-[var(--foreground)]"
                          : "bg-[var(--accent-color)] text-[var(--foreground)]"
                      }`}
                      style={{ whiteSpace: "pre-wrap" }}
                    >
                      {messageContent}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Current streaming message */}
            {chatResult && (
              <div className="flex items-start">
                <div className="max-w-[90%] md:max-w-[80%] ml-0">
                  <div
                    className="rounded-2xl p-4 text-[15px] leading-relaxed bg-[var(--accent-color)] text-[var(--foreground)]"
                    style={{ whiteSpace: "pre-wrap" }}
                  >
                    {chatResult}
                    <span className="inline-block w-1 h-4 ml-0.5 bg-[var(--foreground)] animate-pulse"></span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Message limit notice */}
        {/* {messagesLeft <= 10 && (
          <div className="flex justify-center py-2">
            <div className="px-4 py-2 bg-[var(--accent-color)]/50 rounded-full text-sm">
              You only have {messagesLeft} messages left. 
              <button className="ml-2 text-[var(--accent-color)]/80 underline hover:text-[var(--accent-color)]">
                Sign in to reset your limits
              </button>
            </div>
          </div>
        )} */}

        {/* Input area */}
        <div className="w-full border-t border-[var(--border-color)]/40 p-8 fixed bottom-0 bg-[var(--background)] z-10">
          <div className="mx-auto max-w-4xl relative">
            <form onSubmit={handleSubmit} className="relative group">
              <div className="flex items-center gap-0 rounded-xl bg-[var(--foreground)]/10 shadow-lg transition focus-within:ring-1 focus-within:ring-[var(--accent-color)]">
                <textarea
                  ref={inputRef}
                  className="flex-1 min-h-[50px] max-h-[150px] bg-transparent rounded-l-xl px-4 py-5 outline-none border-none text-[var(--foreground)] placeholder-gray-500 resize-none"
                  placeholder="Type your message here..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={true} //isloading when available
                  rows={1}
                  style={{
                    scrollbarWidth: "thin",
                    scrollbarColor: "#666 transparent",
                  }}
                />
                <div className="px-2 flex items-center">
                  <button
                    className="h-9 w-9 rounded-full bg-[var(--button-bg1)] hover:bg-[var(--button-bg2)] flex items-center justify-center transition disabled:opacity-50 disabled:hover:bg-[var(--button-bg1)]"
                    type="submit"
                    disabled={isLoading || !inputValue.trim()}
                    aria-label="Send message"
                  >
                    {isLoading ? (
                      <svg
                        className="animate-spin h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                    ) : (
                      <svg
                        className="h-5 w-5 text-white transform rotate-90"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                        ></path>
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              <div className="absolute bottom-[-24px] w-full text-center text-xs text-gray-500">
                <div className="flex items-center justify-center gap-1">
                  <span>Lynxky-AI</span>
                  <span className="mx-1">·</span>
                  <span>Powered by Lynxky</span>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Ia;
