"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { Save, Eye, Edit } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

function Editor() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  const toggleTag = (tag: string) => {
    setSelectedTags((prevTags) =>
      prevTags.includes(tag)
        ? prevTags.filter((t) => t !== tag)
        : [...prevTags, tag],
    );
  };

  // Function to insert Markdown syntax into the content
  const insertMarkdown = (markdownSyntax: string) => {
    // Get the textarea element where the content is being edited
    const textarea = document.querySelector("textarea");
    if (!textarea) return; // Exit if no textarea is found

    // Get the current selection range in the textarea
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    // Extract the selected text from the content
    const selectedText = content.substring(start, end);

    // Initialize a variable to hold the new text with Markdown syntax
    let newText = "";

    // Switch statement to handle different Markdown syntax insertions
    switch (markdownSyntax) {
      case "bold":
        // Wrap the selected text (or placeholder text) with double asterisks for bold formatting
        newText = `**${selectedText || "Insert between here the bold text "}**`;
        break;
      case "italic":
        // Wrap the selected text (or placeholder text) with single asterisks for italic formatting
        newText = `*${selectedText || "Insert between here the italic text"}*`;
        break;
      case "heading1":
        // Add a single hash symbol followed by the selected text (or placeholder) for a level 1 heading
        newText = `# ${selectedText || " "}`;
        break;
      case "heading2":
        // Add two hash symbols followed by the selected text (or placeholder) for a level 2 heading
        newText = `## ${selectedText || " "}`;
        break;
      case "code":
        // If the selected text contains newlines, wrap it in triple backticks for a code block
        // Otherwise, wrap it in single backticks for inline code
        newText = selectedText.includes("\n")
          ? `\`\`\`\n${selectedText || "código aqui"}\n\`\`\``
          : `\`${selectedText || "code here"}\``;
        break;
      case "link":
        // Create a Markdown link with the selected text (or placeholder) as the link text and "url" as the placeholder URL
        newText = `[${selectedText || "texto do link"}](url)`;
        break;
    }

    const newContent =
      content.substring(0, start) + newText + content.substring(end);
    setContent(newContent);

    // // Reposicionar o cursor após a inserção
    // setTimeout(() => {
    //   textarea.focus();
    //   const newCursorPos = start + newText.length;
    //   textarea.setSelectionRange(newCursorPos, newCursorPos);
    // }, 0);
  };

  // Função para salvar a nota no banco de dados
  const saveNote = async () => {
    if (!title.trim() && !content.trim()) return;

    // Verificar se usuário está autenticado
    if (!user) {
      // Exibir mensagem de erro
      const notification = document.createElement("div");
      notification.className =
        "fixed bottom-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg transform transition-all duration-500 flex items-center gap-2";
      notification.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 101.414 1.414L10 11.414l1.293 1.293a1 1 001.414-1.414L11.414 10l1.293-1.293a1 1 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
      </svg>Você precisa estar logado para salvar notas!`;
      document.body.appendChild(notification);

      setTimeout(() => {
        notification.style.opacity = "0";
        setTimeout(() => notification.remove(), 500);
      }, 3000);
      return;
    }

    try {
      setSaving(true);
      const { error } = await supabase
        .from("notes")
        .insert([
          {
            title,
            content,
            user_id: user.id, // Adiciona o ID do usuário à nota
            tags: selectedTags, // Adiciona as tags selecionadas
          },
        ])
        .select();

      if (error) throw error;

      // Feedback visual de sucesso
      setTitle("");
      setContent("");
      setSelectedTags([]); // Limpar as tags selecionadas

      // Notification toast instead of alert
      const notification = document.createElement("div");
      notification.className =
        "fixed bottom-4 left-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg transform transition-all duration-500 flex items-center gap-2";
      notification.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 00-1.414 1.414l2 2a1 1 001.414 0l4-4z" clip-rule="evenodd" />
      </svg>Nota salva com sucesso!`;
      document.body.appendChild(notification);

      setTimeout(() => {
        notification.style.opacity = "0";
        setTimeout(() => notification.remove(), 500);
      }, 3000);
    } catch (error) {
      console.error("Erro ao salvar nota:", error);

      // Notification toast para erro
      const notification = document.createElement("div");
      notification.className =
        "fixed bottom-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg transform transition-all duration-500 flex items-center gap-2";
      notification.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 101.414 1.414L10 11.414l1.293 1.293a1 1 001.414-1.414L11.414 10l1.293-1.293a1 1 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
      </svg>Erro ao salvar nota. Tente novamente.`;
      document.body.appendChild(notification);

      setTimeout(() => {
        notification.style.opacity = "0";
        setTimeout(() => notification.remove(), 500);
      }, 3000);
    } finally {
      setSaving(false);
    }
    window.location.reload();
  };

  return (
    <div className="w-full text-white p-2 sm:p-6">
      <div className="mx-auto">
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-xl overflow-hidden border border-slate-700">
          <div className="p-4 sm:p-6 border-b border-slate-700">
            <input
              className="bg-transparent text-white focus:outline-none focus:ring-0 border-none w-full text-xl sm:text-3xl placeholder-slate-500"
              placeholder="Título da nota... "
              maxLength={32}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="bg-slate-600 h-full text-1xl space-x-2 px-2 py-1 text-white flex justify-between">
            <div className="flex space-x-1">
              <button
                className="rounded hover:bg-pink-400 transition-colors px-2 font-bold"
                onClick={() => insertMarkdown("bold")}
                title="Negrito (Ctrl+B)"
              >
                B
              </button>
              <button
                className="rounded hover:bg-pink-400 transition-colors px-2 italic"
                onClick={() => insertMarkdown("italic")}
                title="Itálico (Ctrl+I)"
              >
                I
              </button>
              <button
                className="rounded hover:bg-pink-400 transition-colors px-2"
                onClick={() => insertMarkdown("link")}
                title="Link"
              >
                🔗
              </button>
              <button
                className="rounded hover:bg-pink-400 transition-colors px-2"
                onClick={() => insertMarkdown("heading1")}
                title="Título 1"
              >
                H1
              </button>
              <button
                className="rounded hover:bg-pink-400 transition-colors px-2"
                onClick={() => insertMarkdown("heading2")}
                title="Título 2"
              >
                H2
              </button>
              <button
                className="rounded hover:bg-pink-400 transition-colors px-2"
                onClick={() => insertMarkdown("code")}
                title="Código"
              >
                &lt;/&gt;
              </button>
              <button
                className={`rounded px-3 py-1 transition-colors flex items-center gap-1 ${isPreviewMode ? "bg-slate-700" : "bg-pink-500 hover:bg-pink-400"}`}
                onClick={() => setIsPreviewMode(false)}
                disabled={!isPreviewMode}
              >
                <Edit size={16} /> Editar
              </button>
              <button
                className={`rounded px-3 py-1 transition-colors flex items-center gap-1 ml-2 ${!isPreviewMode ? "bg-slate-700" : "bg-pink-500 hover:bg-pink-400"}`}
                onClick={() => setIsPreviewMode(true)}
                disabled={isPreviewMode}
              >
                <Eye size={16} /> Visualizar
              </button>
            </div>
          </div>

          {!isPreviewMode ? (
            <textarea
              className="p-4 sm:p-6 w-full bg-transparent text-white resize-none focus:outline-none min-h-[250px] sm:min-h-[400px] text-base sm:text-lg placeholder-slate-500"
              placeholder="Escreva sua nota aqui usando Markdown..."
              maxLength={15000}
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          ) : (
            <div className="p-4 sm:p-6 w-full min-h-[250px] sm:min-h-[400px] text-white prose prose-invert prose-sm sm:prose-base max-w-none markdown-content">
              {content ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {content}
                </ReactMarkdown>
              ) : (
                <p className="text-slate-500">
                  Nenhum conteúdo para visualizar...
                </p>
              )}
            </div>
          )}

          {/* Componente de tags na interface de criação/edição de notas */}
          <div className="flex flex-wrap gap-2 mt-2 p-3 sm:p-4">
            {[
              "tarefa",
              "meta",
              "organização",
              "lembrete",
              "importante",
              "ideia",
              "desabafo",
              "diário",
              "estudo",
              "trabalho",
              "pessoal",
              "saúde",
              "finanças",
              "projeto",
              "inspiração",
              "citação",
              "reunião",
              "evento",
              "viagem",
              "receita",
              "code",
              "bug",
              "dica",
              "artigo",
              "livro",
              "filme",
              "música",
              "podcast",
              "curso",
              "tutorial",
              "experiência",
              "reflexão",
              "feedback",
              "aprendizado",
              "networking",
              "mentoria",
            ].map((tag) => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`px-2 py-1 rounded-full text-xs ${
                  selectedTags.includes(tag)
                    ? "bg-blue-500 text-white"
                    : "bg-slate-700 text-slate-300"
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>

          <div className="flex justify-between items-center p-3 sm:p-4 bg-slate-800/80">
            <div className="text-xs sm:text-sm text-slate-400">
              {content.length} / 15000
            </div>

            <button
              className={`flex items-center gap-1 sm:gap-2 px-3 py-2 sm:px-5 sm:py-3 rounded-lg text-sm sm:text-base font-medium transition-all ${
                saving
                  ? "bg-slate-700 text-slate-300"
                  : "bg-blue-600 hover:bg-blue-500 text-white"
              }`}
              onClick={saveNote}
              disabled={saving || (!title.trim() && !content.trim())}
            >
              {saving ? (
                <>
                  <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-slate-300 border-t-transparent rounded-full animate-spin"></div>
                  <span>Salvando</span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>Salvar nota</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Editor;
