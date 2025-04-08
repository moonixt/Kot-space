// NEED REVIEW

"use client";

// import Papa from "papaparse";
// import * as XLSX from "xlsx";
import { useState, useRef } from "react"; //import Usestate, the hook to managge state in react
import { supabase } from "../../lib/supabase"; //import the supabase client to connect to the database
import {
  Save,
  Eye,
  Edit,
  ListOrdered,
  LayoutList,
  SmilePlus,
  Image, // Adicione esta importação
} from "lucide-react"; //import of some icons from Lucide-React library
import { useAuth } from "../../context/AuthContext"; //import of the auth context to manage the authentication of the user
import ReactMarkdown from "react-markdown"; //Library to render markdown
import remarkGfm from "remark-gfm"; //Plugin to support GFM (GitHub Flavored Markdown) in ReactMarkdown
import EmojiPicker, { Theme } from "emoji-picker-react"; //LIbrary to enable support of emojis inside the text area
import { EmojiClickData } from "emoji-picker-react"; //Type for the emoji click data
import ClientLayout from "./ClientLayout";

function Editor() {
  //main function for the editor component
  const [title, setTitle] = useState(""); //state for the title of the note, initialized as empty string
  const [content, setContent] = useState(""); //state for the content of the note, initialized as empty string
  const [saving, setSaving] = useState(false); //state for the saving process, inatilized as false
  const { user } = useAuth(); // get the user method for the context auth, to get the user data from the context
  const [selectedTags, setSelectedTags] = useState<string[]>([]); // state for the selected tags, initialized as empty array of strings
  const [isPreviewMode, setIsPreviewMode] = useState(false); // state for preview mode, start as a false, and are active when the user click on preview button
  const [showEmojiPicker, setShowEmojiPicker] = useState(false); // state for the emoji picker
  const [showEmojiPickerContent, setShowEmojiPickerContent] = useState(false); //state for the emoji picker in the content area
  const [imageUploadLoading, setImageUploadLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [tagSearchTerm, setTagSearchTerm] = useState("");

  const toggleTag = (tag: string) => {
    //function to togle in the tags, if the tag is already selected, it will be removed, otherwise it will be added to the selected tags
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

  const insertMarkdown = (markdownSyntax: string) => {
    //main function to insert markdown in the text area
    // Get the textarea element where the content is being edited
    const textarea = document.querySelector("textarea"); // Select the textarea by its tag name
    if (!textarea) return; // Exit if no textarea is found

    // Get the current selection range in the textarea
    const start = textarea.selectionStart; // get the select the start position of the text area
    const end = textarea.selectionEnd; // get the select the end position of the text area

    // Extract the selected text from the content
    const selectedText = content.substring(start, end); // get the selected text from the content

    // Initialize a variable to hold the new text with Markdown syntax
    let newText = "";

    // Switch statement to handle different Markdown syntax insertions
    switch (markdownSyntax) {
      case "bold":
        // Wrap the selected text (or placeholder text) with double asterisks for bold formatting
        newText = `**${selectedText || "text_example"}**`; //bold text example
        break;
      case "italic":
        // Wrap the selected text (or placeholder text) with single asterisks for italic formatting
        newText = `*${selectedText || "text_example"}*`; //italic text example
        break;
      case "heading1":
        // Add a single hash symbol followed by the selected text (or placeholder) for a level 1 heading
        newText = `# ${selectedText || " "}`; // heading level 1 exemple
        break;
      case "heading2":
        // Add two hash symbols followed by the selected text (or placeholder) for a level 2 heading
        newText = `## ${selectedText || " "}`; //heading level 2 example
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
          const lines = selectedText.split("\n"); // of has already content it will be formated
          newText = lines
            .map((line, index) => `${index + 1}. ${line}`)
            .join("\n");
        } else {
          // if not add a basic template
          newText = "1. Primeiro item\n2. Segundo item\n3. Terceiro item";
        }
        break;
      case "unorderedList":
        if (selectedText) {
          // if has already a content , format the text
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
      case "image":
        newText = `![${selectedText || "descrição da imagem"}](url_da_imagem)`;
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

  const saveNote = async () => {
    //main fuction to save the notes in the database
    if (!title.trim() && !content.trim()) return; //if the title is with space, removed it

    // Verify if the user is verified
    if (!user) {
      //if the user is not verified
      // Show the notification error
      const notification = document.createElement("div");
      notification.className =
        "fixed bottom-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg transform transition-all duration-500 flex items-center gap-2";
      notification.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 101.414 1.414L10 11.414l1.293-1.293a1 1 00-1.414-1.414L11.414 10l1.293-1.293a1 1 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
      </svg>Você precisa estar logado para salvar notas!`;
      document.body.appendChild(notification);

      setTimeout(() => {
        //timeout for delay the notification
        notification.style.opacity = "0";
        setTimeout(() => notification.remove(), 500);
      }, 3000);
      return;
    }

    try {
      //Saving of the notes
      setSaving(true); //change the state to true
      const { error } = await supabase //call the supabase client
        .from("notes") //from the notes table
        .insert([
          //insert the following values
          {
            title, //Insert the title in the database
            content, // insert the content in the database
            user_id: user.id, // Add the user id in the note
            tags: selectedTags, // Add the selected tags in the dabase
          },
        ])
        .select(); //return and apply the values in the database

      if (error) throw error; //if error trow a error saved in the variable

      // If success, this flow will be executed:
      setTitle(""); // the title notes will be empty
      setContent(""); // the content of the notes will be empty
      setSelectedTags([]); // Clean the selected tags

      // Notification toast for the success
      const notification = document.createElement("div");
      notification.className =
        "fixed bottom-4 left-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg transform transition-all duration-500 flex items-center gap-2";
      notification.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 00-1.414-1.414L9 10.586 7.707 9.293a1 1 00-1.414 1.414l2 2a1 1 001.414 0l4-4z" clip-rule="evenodd" />
      </svg>Nota salva com sucesso!`;
      document.body.appendChild(notification);

      setTimeout(() => {
        //delay for the notification desappear
        notification.style.opacity = "0";
        setTimeout(() => notification.remove(), 500);
      }, 3000);
    } catch (error) {
      console.error("Erro ao salvar nota:", error); //error logged in the console

      // Notification toast for erro
      const notification = document.createElement("div");
      notification.className =
        "fixed bottom-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg transform transition-all duration-500 flex items-center gap-2";
      notification.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 101.414 1.414L10 11.414l1.293-1.293a1 1 00-1.414-1.414L11.414 10l1.293-1.293a1 1 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
      </svg>Erro ao salvar nota. Tente novamente.`;
      document.body.appendChild(notification);

      setTimeout(() => {
        //delay for the notification desappear
        notification.style.opacity = "0";
        setTimeout(() => notification.remove(), 500);
      }, 3000);
    } finally {
      setSaving(false); //after save, the state of the setSaving will be false
    }
    window.location.reload(); //reload the page
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Verificar se o usuário está autenticado
    if (!user) {
      alert("Você precisa estar logado para fazer upload de imagens!");
      return;
    }

    try {
      setImageUploadLoading(true);

      const file = files[0];
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      // Upload para o Storage do Supabase
      const { error } = await supabase.storage
        .from("images")
        .upload(filePath, file);

      if (error) throw error;

      // Obter a URL pública
      const { data: publicUrlData } = supabase.storage
        .from("images")
        .getPublicUrl(filePath);

      // Solução simples: Apenas adicionar a imagem ao final do conteúdo atual
      const imageUrl = publicUrlData.publicUrl;
      const imageMarkdown = `\n\n![${file.name}](${imageUrl})\n`;

      // Adicionar ao conteúdo atual
      setContent((currentContent) => currentContent + imageMarkdown);
    } catch (error) {
      console.error("Erro ao fazer upload da imagem:", error);
      alert("Erro ao fazer upload da imagem. Tente novamente.");
    } finally {
      setImageUploadLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // const handleDrop = async (e: React.DragEvent<HTMLTextAreaElement>) => {
  //   e.preventDefault();

  //   const files = e.dataTransfer.files;
  //   if (!files || files.length === 0 || !files[0].type.startsWith("image/"))
  //     return;

  //   // Simular um upload de arquivo como se fosse pelo input
  //   const dataTransfer = new DataTransfer();
  //   dataTransfer.items.add(files[0]);

  //   if (fileInputRef.current) {
  //     fileInputRef.current.files = dataTransfer.files;
  //   }
  // };

  return (
    //return of the Divs
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
              <button
                className="rounded hover:bg-green-400 transition-colors px-1 sm:px-2 relative hidden sm:block"
                onClick={() => {
                  if (imageUploadLoading) return;
                  if (fileInputRef.current) {
                    fileInputRef.current.click();
                  } else {
                    insertMarkdown("image");
                  }
                }}
                title="Inserir Imagem"
              >
                <Image size={16} />
                {imageUploadLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-green-400 bg-opacity-50 rounded">
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </button>

         
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                style={{ display: "none" }}
              />
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
                className={`rounded sm:px-3 sm:py-1 py-1 transition-colors flex items-center sm:gap-1 text-[var(--background)] ${isPreviewMode ? "bg-[var(--button-bg2)]" : "bg-[var(--button-bg1)] hover:bg-[var(--hover-color)]"}`}
                onClick={() => setIsPreviewMode(false)}
                disabled={!isPreviewMode}
              >
                <Edit size={16} /> Editar
              </button>
              <button
                className={`rounded sm:px-3 sm:py-1 px-1 transition-colors flex items-center sm:gap-1 ml-2 text-[var(--background)] ${!isPreviewMode ? "bg-[var(--button-bg2)]" : "bg-[var(--button-bg1)] hover:bg-[var(--hover-color)]"}`}
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
              <button
                className="rounded hover:bg-green-400 transition-colors px-1 sm:px-2 relative"
                onClick={() => {
                  if (imageUploadLoading) return;
                  if (fileInputRef.current) {
                    fileInputRef.current.click();
                  } else {
                    insertMarkdown("image");
                  }
                }}
                title="Inserir Imagem"
              >
                <Image size={20} />
                {imageUploadLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-green-400 bg-opacity-50 rounded">
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </button>

              {/* Input de arquivo oculto para upload de imagem */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                style={{ display: "none" }}
              />
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
                  // onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                />
                <div className="absolute bottom-65 right-4">
      <ClientLayout />
    </div>
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

          <div className="border-t border-[var(--border-color)] p-2 sm:p-3 bg-[var(--container)] bg-opacity-20">
            <div className="flex items-center">
              <span className="text-xs sm:text-sm mr-2 text-[var(--foreground)]">
                Tags:
              </span>
              <input
                type="text"
                placeholder="Procurar tags..."
                value={tagSearchTerm}
                onChange={(e) => setTagSearchTerm(e.target.value)}
                className="flex-grow px-2 py-1 text-xs sm:text-sm rounded bg-[var(--background)] text-[var(--foreground)] border border-[var(--border-color)] focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
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
            ]
              .filter(
                (tag) =>
                  tagSearchTerm === "" ||
                  tag.toLowerCase().includes(tagSearchTerm.toLowerCase()),
              )
              .map((tag) => (
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
            {tagSearchTerm !== "" &&
              [
                /* ...todas as tags... */
              ].filter((tag: string) =>
                tag.toLowerCase().includes(tagSearchTerm.toLowerCase()),
              ).length === 0 && (
                <div className="w-full text-center py-2 text-sm text-[var(--foreground)]">
                  Nenhuma tag encontrada para {tagSearchTerm}
                </div>
              )}
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
                  : "bg-[var(--button-bg1)] hover:bg-[var(--hover-color)] text-[var(--background)]"
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
