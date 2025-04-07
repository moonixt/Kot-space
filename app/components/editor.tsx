// NEED REVIEW

"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";
import {
  Save,
  Eye,
  Edit,
  ListOrdered,
  LayoutList,
  SmilePlus,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import EmojiPicker, { Theme } from "emoji-picker-react";
import { EmojiClickData } from "emoji-picker-react";

function Editor() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showEmojiPickerContent, setShowEmojiPickerContent] = useState(false);

  const toggleTag = (tag: string) => {
    setSelectedTags((prevTags) =>
      prevTags.includes(tag)
        ? prevTags.filter((t) => t !== tag)
        : [...prevTags, tag],
    );
  };

  //Handle Emoji selector, working in the title and TextArea
  const handleEmojiSelect = (emojiData: EmojiClickData) => {
    setTitle((prev) => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  const handleEmojiSelectContent = (emojiData: EmojiClickData) => {
    setContent((prev) => prev + emojiData.emoji);
    setShowEmojiPickerContent(false);
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
        newText = `**${selectedText || "text_example"}**`;
        break;
      case "italic":
        // Wrap the selected text (or placeholder text) with single asterisks for italic formatting
        newText = `*${selectedText || "text_example"}*`;
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
      case "orderedList":
        if (selectedText) {
          // Se já tiver conteúdo, formatar cada linha como item de lista ordenada
          const lines = selectedText.split("\n");
          newText = lines
            .map((line, index) => `${index + 1}. ${line}`)
            .join("\n");
        } else {
          // Se não tiver, adicionar um template
          newText = "1. Primeiro item\n2. Segundo item\n3. Terceiro item";
        }
        break;
      case "unorderedList":
        // Verificar se o texto selecionado já tem linhas
        if (selectedText) {
          // Se já tiver conteúdo, formatar cada linha como item de lista não ordenada
          const lines = selectedText.split("\n");
          newText = lines.map((line) => `- ${line}`).join("\n");
        } else {
          // Se não tiver, adicionar um template
          newText = "- Primeiro item\n- Segundo item\n- Terceiro item";
        }
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
    <div id="Editor" className="w-full h-full flex flex-col">
      <div className="mx-auto w-full h-full flex flex-col flex-grow">
        <div className="bg-[var(--background)] backdrop-blur-sm  shadow-xl overflow-hidden  flex flex-col flex-grow h-full">
          <div className="p-4 sm:p-6 border-b border-[var(--border-color)] relative">
            <div className="flex gap-4">
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className=" text-[var(--foreground)] hover:text-[var(--background)] hover:bg-[var(--foreground)] rounded transition-colors"
                title="Adicionar emoji"
              >
                <SmilePlus size={26} />
              </button>
              {showEmojiPicker && (
                <div className="absolute z-10 right-4 mt-2">
                  <div className="relative">
                    <EmojiPicker
                      onEmojiClick={handleEmojiSelect}
                      skinTonesDisabled
                      width={300}
                      height={400}
                      previewConfig={{ showPreview: false }}
                      theme={Theme.DARK}
                    />
                  </div>
                </div>
              )}
              <input
                className=" bg-transparent text-[var(--foreground)] focus:outline-none focus:ring-0 border-none w-full text-xl sm:text-3xl "
                placeholder="Tema da nota..."
                maxLength={40}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
          </div>
          <div
            id="nav1"
            className="bg-[var(--container)] bg-opacity-10  text-1xl px-1 sm:px-2 py-1 text-[var(--foreground)] flex justify-between"
          >
            <div className="flex  gap-1">
              <button
                className="rounded hover:bg-green-400 transition-colors px-1 sm:px-2 font-bold "
                onClick={() => insertMarkdown("bold")}
                title="Negrito (Ctrl+B)"
              >
                B
              </button>
              <button
                className="rounded hover:bg-green-400 transition-colors px-1 sm:px-2 italic"
                onClick={() => insertMarkdown("italic")}
                title="Itálico (Ctrl+I)"
              >
                I
              </button>
              <button
                className="rounded hover:bg-green-400 transition-colors px-1 sm:px-2"
                onClick={() => insertMarkdown("link")}
                title="Link"
              >
                🔗
              </button>
              <button
                className="rounded hover:bg-green-400 transition-colors px-1 sm:px-2"
                onClick={() => insertMarkdown("heading1")}
                title="Título 1"
              >
                H1
              </button>
              <button
                className="rounded hover:bg-green-400 transition-colors px-1 sm:px-2"
                onClick={() => insertMarkdown("heading2")}
                title="Título 2"
              >
                H2
              </button>
              <button
                className="rounded hover:bg-green-400 transition-colors px-1 sm:px-2"
                onClick={() => insertMarkdown("code")}
                title="Código"
              >
                &lt;/&gt;
              </button>
              <div
                id="Emojipicker"
                className="flex justify-end items-center pr-2"
              >
                <button
                  onClick={() =>
                    setShowEmojiPickerContent(!showEmojiPickerContent)
                  }
                  className=" text-[var(--foreground)] hover:text-white hover:bg-slate-700 rounded transition-colors"
                  title="Adicionar emoji"
                >
                  <SmilePlus size={16} />
                </button>
                {showEmojiPickerContent && (
                  <div className="absolute z-10 right-2 top-10 mt-2 max-h-80vh overflow-auto">
                    <div className="relative">
                      <EmojiPicker
                        onEmojiClick={handleEmojiSelectContent}
                        skinTonesDisabled
                        width={280} // Reduzido um pouco para caber melhor
                        height={350} // Reduzido um pouco para caber melhor
                        previewConfig={{ showPreview: false }}
                        theme={Theme.DARK}
                      />
                    </div>
                  </div>
                )}
              </div>
              <button
                className=" hidden sm:block rounded hover:bg-green-400 transition-colors px-1 sm:px-2 "
                onClick={() => insertMarkdown("orderedList")}
                title="Lista Numerada"
              >
                <ListOrdered size={16} />
              </button>
              <button
                className="hidden sm:block rounded hover:bg-green-400 transition-colors px-1 sm:px-2 "
                onClick={() => insertMarkdown("unorderedList")}
                title="Lista com Marcadores"
              >
                <LayoutList size={16} />
              </button>

              <button
                className={`rounded sm:px-3 sm:py-1 py-1 transition-colors flex items-center sm:gap-1 text-[var(--foreground)] ${isPreviewMode ? "bg-[var(--background)]" : "bg-[var(--button-bg)] hover:bg-[var(--hover-color)]"}`}
                onClick={() => setIsPreviewMode(false)}
                disabled={!isPreviewMode}
              >
                <Edit size={16} /> Editar
              </button>
              <button
                className={`rounded sm:px-3 sm:py-1 px-1 transition-colors flex items-center sm:gap-1 ml-2 text-[var(--foreground)] ${!isPreviewMode ? "bg-[var(--background)]" : "bg-[var(--button-bg)] hover:bg-[var(--hover-color)]"}`}
                onClick={() => setIsPreviewMode(true)}
                disabled={isPreviewMode}
              >
                <Eye size={16} /> Visualizar
              </button>
            </div>
          </div>
          <div
            id="nav2-smallscreen"
            className="bg-[var(--container)]  text-1xl px-1 sm:px-2 py-1 text-[var(--foreground)] flex  justify-between sm:hidden"
          >
            <div className="sm:flex sm:space-x-2 flex">
              <button
                className="rounded hover:bg-green-400 transition-colors px-1 sm:px-2"
                onClick={() => insertMarkdown("orderedList")}
                title="Lista Numerada"
              >
                <ListOrdered size={20} />
              </button>
              <button
                className="rounded hover:bg-green-400 transition-colors px-1 sm:px-2"
                onClick={() => insertMarkdown("unorderedList")}
                title="Lista com Marcadores"
              >
                <LayoutList size={16} />
              </button>
            </div>
          </div>

          <div className="flex-grow overflow-auto scrollbar">
            {!isPreviewMode ? (
              <div className="h-full">
                <textarea
                  className="p-4 sm:p-6 w-full bg-transparent text-[var(--foreground)] resize-none focus:outline-none min-h-[370px] h-full text-base sm:text-lg  overflow-auto"
                  placeholder="Escreva sua nota aqui..."
                  maxLength={15000}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  style={{ fontSize: "25px" }}
                />
              </div>
            ) : (
              <div className="markdown-content  p-4 sm:p-6 w-full bg-transparent text-[var(--foreground)] min-h-[370px] h-full text-base sm:text-lg overflow-auto">
                {content ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {content}
                  </ReactMarkdown>
                ) : (
                  <p className="text-[var(--foreground)]">
                    Nenhum conteúdo para visualizar...
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-1 sm:gap-2 p-2 sm:p-4 overflow-y-auto max-h-28 scrollbar">
            {[
              "agenda",
              "amizade",
              "análise",
              "animação",
              "aprendizado",
              "arte",
              "artigo",
              "autoconhecimento",
              "autocuidado",
              "autoestima",
              "autodisciplina",
              "automatização",
              "aventura",
              "avaliação",
              "bug",
              "checklist",
              "citação",
              "cloud",
              "code",
              "coleção",
              "comunidade",
              "conquista",
              "contos",
              "conversa",
              "cultura",
              "currículo",
              "curso",
              "debate",
              "desabafo",
              "design",
              "desenvolvimento",
              "destino",
              "dev",
              "diário",
              "dica",
              "dicas de viagem",
              "dieta",
              "documentação",
              "documentário",
              "emoções",
              "empreendedorismo",
              "esboço",
              "estudo",
              "evento",
              "evento cultural",
              "exercício",
              "experiência",
              "família",
              "feedback",
              "filme",
              "finanças",
              "fitness",
              "foco",
              "fotografia",
              "freelance",
              "gestão",
              "hábitos",
              "hábitos saudáveis",
              "hardware",
              "história",
              "hobby",
              "ideia",
              "importante",
              "influência",
              "inspiração",
              "inspiração visual",
              "inteligência artificial",
              "investimentos",
              "jogo",
              "lembrete",
              "liderança",
              "listagem",
              "listas",
              "livro",
              "marketing",
              "meditação",
              "memórias",
              "mentoria",
              "meta",
              "mochilão",
              "motivação",
              "música",
              "natureza",
              "negócio",
              "networking",
              "notas",
              "nutrição",
              "objetivo",
              "opinião",
              "organização",
              "passeio",
              "pesquisa",
              "pessoal",
              "planejamento",
              "podcast",
              "poesia",
              "prioridade",
              "programação",
              "projeto",
              "prototipo",
              "receita",
              "recomendações",
              "referências",
              "reflexão",
              "relacionamentos",
              "resumo",
              "reunião",
              "roteiro",
              "rotina",
              "salário",
              "saúde",
              "saúde mental",
              "segurança",
              "sentimentos",
              "série",
              "sistema",
              "software",
              "sono",
              "tarefa",
              "teatro",
              "tendência",
              "terapia",
              "tese",
              "testes",
              "trabalho",
              "trabalho acadêmico",
              "tutorial",
              "vendas",
              "viagem",
              "voluntariado",
            ].map((tag) => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`px-2 py-1 rounded-full text-xs ${
                  selectedTags.includes(tag)
                    ? "bg-blue-500 text-white"
                    : "bg-[var(--foreground)] text-[var(--background)]"
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>

          <div
            id="footer"
            className="flex justify-between items-center p-3 sm:p-4 bg-[var(--container)] mt-auto"
          >
            <div className="text-xs sm:text-sm text-slate-400">
              {content.length} / 15000
            </div>

            <button
              className={`flex items-center gap-1 sm:gap-2 px-3 py-2 sm:px-5 sm:py-3 rounded-lg text-sm sm:text-base font-medium transition-all ${
                saving
                  ? "bg-slate-700 text-slate-300"
                  : "bg-[var(--button-bg)] hover:bg-[var(--hover-color)] text-[var(--foreground)]"
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
