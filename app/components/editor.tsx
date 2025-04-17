// NEED REVIEW

"use client";

// import Papa from "papaparse";
// import * as XLSX from "xlsx";
import { useState, useRef, useEffect } from "react"; //import Usestate, the hook to managge state in react
import { supabase } from "../../lib/supabase"; //import the supabase client to connect to the database
import eventEmitter from "../../lib/eventEmitter"; // Import do event emitter
import {
  Save,
  Eye,
  Edit,
  ListOrdered,
  LayoutList,
  SmilePlus,
  Image,
  FolderIcon,
  ChevronDown, // Add import for dropdown icon
  } from "lucide-react"; //import of some icons from Lucide-React library
import { useAuth } from "../../context/AuthContext"; //import of the auth context to manage the authentication of the user
import ReactMarkdown from "react-markdown"; //Library to render markdown
import remarkGfm from "remark-gfm"; //Plugin to support GFM (GitHub Flavored Markdown) in ReactMarkdown
import EmojiPicker, { Theme } from "emoji-picker-react"; //LIbrary to enable support of emojis inside the text area
import { EmojiClickData } from "emoji-picker-react"; //Type for the emoji click data
import ClientLayout from "./ClientLayout";
import Profile from "../profile/page";
import { encrypt } from "./Encryption"; // Importar a função de criptografia
import { useTranslation } from "react-i18next"; // Import the translation hook


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
  const { t } = useTranslation(); // Add the translation hook to access translations
  
  // Add state for folders and folder selection
  const [folders, setFolders] = useState<Array<{id: string, name: string}>>([]);
  const [selectedFolder, setSelectedFolder] = useState<{id: string, name: string} | null>(null);
  const [showFolderDropdown, setShowFolderDropdown] = useState(false);

  // Carregar dados do localStorage quando o componente montar
  useEffect(() => {
    // Verificar se estamos no navegador (não em SSR)
    if (typeof window !== "undefined") {
      const savedTitle = localStorage.getItem("fair-note-title");
      const savedContent = localStorage.getItem("fair-note-content");
      const savedTags = localStorage.getItem("fair-note-tags");

      if (savedTitle) setTitle(savedTitle);
      if (savedContent) setContent(savedContent);
      if (savedTags) setSelectedTags(JSON.parse(savedTags));
      
      // Add this to load the folder if it was saved
      const savedFolder = localStorage.getItem("fair-note-folder");
      if (savedFolder) {
        try {
          setSelectedFolder(JSON.parse(savedFolder));
        } catch (e) {
          console.error("Error parsing saved folder", e);
        }
      }
    }
    
    // Fetch folders when component mounts
    if (user) {
      fetchFolders();
    }
  }, [user]);

  // Salvar dados no localStorage quando mudarem
  useEffect(() => {
    localStorage.setItem("fair-note-title", title);
    localStorage.setItem("fair-note-content", content);
    localStorage.setItem("fair-note-tags", JSON.stringify(selectedTags));
    
    // Add this to save the selected folder
    if (selectedFolder) {
      localStorage.setItem("fair-note-folder", JSON.stringify(selectedFolder));
    } else {
      localStorage.removeItem("fair-note-folder");
    }
  }, [title, content, selectedTags, selectedFolder]);

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
      </svg>${t('editor.loginRequired')}`;
      document.body.appendChild(notification);

      setTimeout(() => {
        //timeout for delay the notification
        notification.style.opacity = "0";
        setTimeout(() => notification.remove(), 500);
      }, 3000);
      return;
    }

    try {
      // Criptografar o conteúdo da nota antes de salvar
      const encryptedContent = encrypt(content);
      const encryptedTitle = encrypt(title);
      
      //Saving of the notes
      setSaving(true); //change the state to true
      const { error } = await supabase //call the supabase client
        .from("notes") //from the notes table
        .insert([
          //insert the following values
          {
            title: encryptedTitle, // Salvar título criptografado
            content: encryptedContent, // Salvar conteúdo criptografado
            user_id: user.id, // Add the user id in the note
            tags: selectedTags, // Add the selected tags in the dabase
            folder_id: selectedFolder ? selectedFolder.id : null, // Add the folder id if selected
          },
        ])
        .select(); //return and apply the values in the database

      if (error) throw error; //if error trow a error saved in the variable

      // If success, this flow will be executed:
      setTitle(""); // the title notes will be empty
      setContent(""); // the content of the notes will be empty
      setSelectedTags([]); // Clean the selected tags
      setSelectedFolder(null); // Clear selected folder

      // Limpar localStorage após salvar com sucesso
      if (!error) {
        localStorage.removeItem("fair-note-title");
        localStorage.removeItem("fair-note-content");
        localStorage.removeItem("fair-note-tags");
        localStorage.removeItem("fair-note-folder");
      }
      
      // Auto fetch notes and folders after saving
      fetchNotes();
      fetchFolders();

      // Emit event to notify other components
      eventEmitter.emit("noteSaved");

      // Notification toast for the success
      const notification = document.createElement("div");
      notification.className =
        "fixed bottom-4 left-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg transform transition-all duration-500 flex items-center gap-2";
      notification.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 00-1.414-1.414L9 10.586 7.707 9.293a1 1 00-1.414 1.414l2 2a1 1 001.414 0l4-4z" clip-rule="evenodd" />
      </svg>${t('editor.noteSaved')}`;
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
      </svg>${t('editor.saveError')}`;
      document.body.appendChild(notification);

      setTimeout(() => {
        //delay for the notification desappear
        notification.style.opacity = "0";
        setTimeout(() => notification.remove(), 500);
      }, 3000);
    } finally {
      setSaving(false); //after save, the state of the setSaving will be false
    }
    setTitle("");
    setContent("");
    setSelectedTags([]);
  };

  const isImageFile = (file: File) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    return allowedTypes.includes(file.type);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];

    if (!isImageFile(file)) {
      alert("Only image files are allowed.");
      return;
    }

    // Verificar se o usuário está autenticado
    if (!user) {
      alert(t('editor.loginRequired'));
      return;
    }

    try {
      setImageUploadLoading(true);

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
      alert(t('editor.imageUploadError'));
    } finally {
      setImageUploadLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // This function safely handles dynamic translation keys
  const translateTag = (tagKey: string): string => {
    // Using string interpolation with type assertion to satisfy TypeScript
    return t(`tags.${tagKey}`, { defaultValue: tagKey });
  };

  // Add fetchFolders function to get user's folders
  const fetchFolders = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("folders")
        .select("id, name")
        .eq("user_id", user.id)
        .order("name", { ascending: true });
      
      if (error) throw error;
      
      if (data) {
        setFolders(data);
      }
    } catch (error) {
      console.error("Error fetching folders:", error);
    }
  };

  // Function to handle folder creation
  const createNewFolder = async () => {
    // Prompt user for folder name
    const folderName = prompt(t('editor.enterFolderName', { defaultValue: 'Enter folder name' }));
    
    // Check if folder name is valid
    if (!folderName || !folderName.trim()) return;
    
    if (!user) {
      alert(t('editor.loginRequired'));
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from("folders")
        .insert([
          { name: folderName.trim(), user_id: user.id }
        ])
        .select();
      
      if (error) throw error;
      
      if (data && data[0]) {
        const newFolder = { id: data[0].id, name: data[0].name };
        setFolders([...folders, newFolder]);
        setSelectedFolder(newFolder);
        setShowFolderDropdown(false);
      }
    } catch (error) {
      console.error("Error creating folder:", error);
      alert(t('editor.folderCreateError',{ defaultValue: '' }));
    }
  };

  // Add fetchNotes function to get the latest notes
  const fetchNotes = async () => {
    if (!user) return;
    
    try {
      // We don't need to update local state since this is just to update the sidebar
      // This function is called after saving a note to refresh the sidebar
      const { error } = await supabase
        .from("notes")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      
      // The sidebar component will automatically fetch notes via its own hooks
      // This is just to trigger any event listeners that might be monitoring for changes
      
    } catch (error) {
      console.error("Erro ao buscar notas:", error);
    }
  };

  return (
    <div
      id="Editor"
      className="w-full h-full flex flex-col bg-[var(--background)] scrollbar"
    >
       <Profile />
      <div className="mx-auto w-full h-full flex flex-col flex-grow">
        <div className="bg-[var(--background)] backdrop-blur-sm shadow-lg rounded-lg overflow-hidden flex flex-col flex-grow h-full  border-[var(--border-color)] transition-all duration-300">
          {/* Title Section */}
          <div className="p-5 sm:p-6 border-b border-[var(--border-color)] relative">
            <div className="flex items-center gap-3">
                            <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="p-2 text-[var(--foreground)] hover:bg-[var(--container)] rounded-full transition-all duration-200"
                title={t('editor.addEmoji')}
              >
                <SmilePlus size={22} />
              </button>
              <input
                className="bg-transparent text-[var(--foreground)] focus:outline-none focus:ring-0 border-none w-full text-xl sm:text-2xl font-medium placeholder-opacity-60 placeholder-[var(--foreground)]"
                placeholder={t('editor.titlePlaceholder')}
                maxLength={40}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              {showEmojiPicker && (
                <div className="absolute z-50 top-16 left-4 sm:left-6 shadow-xl rounded-lg overflow-hidden">
                  <EmojiPicker
                    onEmojiClick={handleEmojiSelect}
                    skinTonesDisabled
                    width={300}
                    height={400}
                    previewConfig={{ showPreview: false }}
                    theme={Theme.DARK}
                  />
                </div>
              )}
              
              {/* Add folder selection dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowFolderDropdown(!showFolderDropdown)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-[var(--container)] hover:bg-opacity-80 text-[var(--foreground)] text-sm transition-colors"
                  title={t('editor.selectFolder')}
                >
                  <FolderIcon size={16} />
                  <span className="max-w-[100px] truncate">
                    {selectedFolder ? selectedFolder.name : t('editor.noFolder', { defaultValue: '' })}
                  </span>
                  <ChevronDown size={14} />
                </button>
                
                {showFolderDropdown && (
                  <div className="absolute right-0 mt-1 w-48 rounded-md bg-[var(--background)] border border-[var(--border-color)] shadow-lg z-50">
                    <div className="py-1 max-h-60 overflow-y-auto scrollbar">
                      <button
                        onClick={() => {
                          setSelectedFolder(null);
                          setShowFolderDropdown(false);
                        }}
                        className={`flex items-center w-full text-left px-3 py-2 text-sm ${
                          !selectedFolder ? "bg-[var(--accent-color)] text-white" : "hover:bg-[var(--container)] text-[var(--foreground)]"
                        }`}
                      >
                        {t('editor.noFolder', { defaultValue: '' })}
                      </button>
                      
                      {folders.map(folder => (
                        <button
                          key={folder.id}
                          onClick={() => {
                            setSelectedFolder(folder);
                            setShowFolderDropdown(false);
                          }}
                          className={`flex items-center w-full text-left px-3 py-2 text-sm ${
                            selectedFolder?.id === folder.id ? "bg-[var(--accent-color)] text-white" : "hover:bg-[var(--container)] text-[var(--foreground)]"
                          }`}
                        >
                          {folder.name}
                        </button>
                      ))}
                      
                      <div className="border-t border-[var(--border-color)] my-1"></div>
                      
                      <button
                        onClick={() => {
                          createNewFolder();
                          setShowFolderDropdown(false);
                        }}
                        className="flex items-center w-full text-left px-3 py-2 text-sm text-[var(--accent-color)] hover:bg-[var(--container)]"
                      >
                        + {t('editor.createFolder', { defaultValue: '' })}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Toolbar Section */}
          <div className="bg-[var(--container)] bg-opacity-30 border-b border-[var(--border-color)] text-sm px-2 sm:px-3 py-2 text-[var(--foreground)] flex justify-between items-center sticky top-0 z-10">
            <div className="flex flex-wrap items-center gap-1 sm:gap-2">
              <div className="flex items-center space-x-1 mr-2">
                <button
                  className="p-1.5 rounded-md hover:bg-[var(--accent-color)] hover:text-white transition-colors font-bold"
                  onClick={() => insertMarkdown("bold")}
                  title={t('editor.bold')}
                >
                  B
                </button>
                <button
                  className="p-1.5 rounded-md hover:bg-[var(--accent-color)] hover:text-white transition-colors italic"
                  onClick={() => insertMarkdown("italic")}
                  title={t('editor.italic')}
                >
                  I
                </button>
                <button
                  className="p-1.5 rounded-md hover:bg-[var(--accent-color)] hover:text-white transition-colors"
                  onClick={() => insertMarkdown("link")}
                  title={t('editor.link')}
                >
                  🔗
                </button>
              </div>

              <div className="flex items-center space-x-1 mr-2">
                <button
                  className="p-1.5 rounded-md hover:bg-[var(--accent-color)] hover:text-white transition-colors"
                  onClick={() => insertMarkdown("heading1")}
                  title={t('editor.heading1')}
                >
                  H1
                </button>
                <button
                  className="p-1.5 rounded-md hover:bg-[var(--accent-color)] hover:text-white transition-colors"
                  onClick={() => insertMarkdown("heading2")}
                  title={t('editor.heading2')}
                >
                  H2
                </button>
              </div>

              <div className="flex items-center space-x-1 mr-2">
                <button
                  className="p-1.5 rounded-md hover:bg-[var(--accent-color)] hover:text-white transition-colors"
                  onClick={() => insertMarkdown("code")}
                  title={t('editor.code')}
                >
                  &lt;/&gt;
                </button>
                <button
                  className="p-1.5 rounded-md hover:bg-[var(--accent-color)] hover:text-white transition-colors hidden sm:flex items-center justify-center relative"
                  onClick={() => {
                    if (imageUploadLoading) return;
                    if (fileInputRef.current) {
                      fileInputRef.current.click();
                    } else {
                      insertMarkdown("image");
                    }
                  }}
                  title={t('editor.insertImage')}
                >
                  <Image size={16} />
                  {imageUploadLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-[var(--accent-color)] bg-opacity-70 rounded-md">
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
              </div>

              <div className="flex items-center space-x-1 mr-2">
                <button
                  onClick={() =>
                    setShowEmojiPickerContent(!showEmojiPickerContent)
                  }
                  className="p-1.5 rounded-md hover:bg-[var(--accent-color)] hover:text-white transition-colors"
                  title={t('editor.addEmoji')}
                >
                  <SmilePlus size={16} />
                </button>
                {showEmojiPickerContent && (
                  <div className="absolute z-50 mt-36 right-4 shadow-xl rounded-lg overflow-hidden">
                    <EmojiPicker
                      onEmojiClick={handleEmojiSelectContent}
                      skinTonesDisabled
                      width={280}
                      height={350}
                      previewConfig={{ showPreview: false }}
                      theme={Theme.DARK}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                className={`rounded-md px-3 py-1.5 transition-all duration-200 flex items-center gap-1.5 ${
                  isPreviewMode
                    ? "bg-transparent text-[var(--foreground)] border border-[var(--border-color)]"
                    : "bg-[var(--button-bg1)] text-[var(--background)]"
                }`}
                onClick={() => setIsPreviewMode(false)}
                disabled={!isPreviewMode}
              >
                <Edit size={16} /> {t('editor.edit')}
              </button>
              <button
                className={`rounded-md px-3 py-1.5 transition-all duration-200 flex items-center gap-1.5 ${
                  !isPreviewMode
                    ? "bg-transparent text-[var(--foreground)] border border-[var(--border-color)]"
                    : "bg-[var(--button-bg1)] text-[var(--background)]"
                }`}
                onClick={() => setIsPreviewMode(true)}
                disabled={isPreviewMode}
              >
                <Eye size={16} /> {t('editor.preview')}
              </button>
            </div>
          </div>

          {/* Mobile Toolbar */}
          <div className="bg-[var(--container)] border-b border-[var(--border-color)] py-2 px-2 flex justify-between items-center sm:hidden">
            <div className="flex items-center space-x-2">
              <button
                className="p-1.5 rounded-md hover:bg-[var(--accent-color)] hover:text-white transition-colors flex items-center justify-center"
                onClick={() => insertMarkdown("orderedList")}
                title={t('editor.orderedList')}
              >
                <ListOrdered size={18} />
              </button>
              <button
                className="p-1.5 rounded-md hover:bg-[var(--accent-color)] hover:text-white transition-colors flex items-center justify-center"
                onClick={() => insertMarkdown("unorderedList")}
                title={t('editor.unorderedList')}
              >
                <LayoutList size={18} />
              </button>
              <button
                className="p-1.5 rounded-md hover:bg-[var(--accent-color)] hover:text-white transition-colors flex items-center justify-center relative"
                onClick={() => {
                  if (imageUploadLoading) return;
                  if (fileInputRef.current) {
                    fileInputRef.current.click();
                  } else {
                    insertMarkdown("image");
                  }
                }}
                title={t('editor.insertImage')}
              >
                <Image size={18} />
                {imageUploadLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-[var(--accent-color)] bg-opacity-70 rounded-md">
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div className=" scrollbar bg-[var(--background)] relative">
            {!isPreviewMode ? (
              <div className="h-full relative">
                <textarea
                  className="p-5 sm:p-6 w-full bg-transparent text-[var(--foreground)] resize-none focus:outline-none min-h-[370px] h-full text-base sm:text-lg overflow-auto transition-all duration-300"
                  placeholder={t('editor.contentPlaceholder')}
                  maxLength={15000}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  style={{ fontSize: "18px", lineHeight: "1.7" }}
                  onDragOver={(e) => e.preventDefault()}
                />
                <div className="absolute bottom-4 right-4">
                  <ClientLayout />
                </div>
              </div>
            ) : (
              <div className="markdown-content p-5 sm:p-6 w-full bg-transparent text-[var(--foreground)] min-h-[370px] h-full text-base sm:text-lg overflow-auto">
                {content ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {content}
                  </ReactMarkdown>
                ) : (
                  <p className="text-[var(--foreground)] opacity-60 italic">
                    {t('editor.noPreviewContent')}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Tags Search Section */}
          <div className="border-t border-[var(--border-color)] p-3 sm:p-4 bg-[var(--container)] bg-opacity-20">
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm text-[var(--foreground)] font-medium">
                {t('editor.tags')}
              </span>
              <div className="relative flex-grow">
                <input
                  type="text"
                  placeholder={t('editor.searchTags')}
                  value={tagSearchTerm}
                  onChange={(e) => setTagSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-md bg-[var(--background)] text-[var(--foreground)] border border-[var(--border-color)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-color)] transition-all duration-200"
                />
              </div>
            </div>
          </div>

          {/* Tags Selection Section */}
          <div className="flex flex-wrap gap-1.5 sm:gap-2 p-3 sm:p-4 overflow-y-auto max-h-28 scrollbar bg-[var(--background)] border-t border-[var(--border-color)]">
            {[
              "agenda",
              "friendship",
              "analysis",
              "animation",
              "learning",
              "art",
              "article",
              "selfKnowledge",
              "selfCare",
              "selfEsteem",
              "selfDiscipline",
              "automation",
              "adventure",
              "evaluation",
              "bug",
              "checklist",
              "quote",
              "cloud",
              "code",
              "collection",
              "community",
              "achievement",
              "stories",
              "conversation",
              "culture",
              "resume",
              "course",
              "debate",
              "vent",
              "design",
              "development",
              "destination",
              "dev",
              "diary",
              "tip",
              "travelTips",
              "diet",
              "documentation",
              "documentary",
              "emotions",
              "entrepreneurship",
              "draft",
              "study",
              "event",
              "culturalEvent",
              "exercise",
              "experience",
              "family",
              "feedback",
              "movie",
              "finance",
              "fitness",
              "focus",
              "photography",
              "freelance",
              "management",
              "habits",
              "healthyHabits",
              "hardware",
              "history",
              "hobby",
              "idea",
              "important",
              "influence",
              "inspiration",
              "visualInspiration",
              "artificialIntelligence",
              "investments",
              "game",
              "reminder",
              "leadership",
              "listing",
              "lists",
              "book",
              "marketing",
              "meditation",
              "memories",
              "mentoring",
              "goal",
              "backpacking",
              "motivation",
              "music",
              "nature",
              "business",
              "networking",
              "notes",
              "nutrition",
              "objective",
              "opinion",
              "organization",
              "tour",
              "research",
              "personal",
              "planning",
              "podcast",
              "poetry",
              "priority",
              "programming",
              "project",
              "prototype",
              "recipe",
              "recommendations",
              "references",
              "reflection",
              "relationships",
              "summary",
              "meeting",
              "script",
              "routine",
              "salary",
              "health",
              "mentalHealth",
              "security",
              "feelings",
              "series",
              "system",
              "software",
              "sleep",
              "task",
              "theater",
              "trend",
              "therapy",
              "thesis",
              "tests",
              "work",
              "academicWork",
              "tutorial",
              "sales",
              "travel",
              "volunteering",
            ]
              .filter(
                (tagKey) =>
                  tagSearchTerm === "" ||
                  translateTag(tagKey).toLowerCase().includes(tagSearchTerm.toLowerCase()),
              )
              .map((tagKey) => (
                <button
                  key={tagKey}
                  onClick={() => toggleTag(translateTag(tagKey))}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
                    selectedTags.includes(translateTag(tagKey))
                      ? "bg-[var(--accent-color)] text-white shadow-sm"
                      : "bg-[var(--container)] text-[var(--foreground)] hover:bg-opacity-80"
                  }`}
                >
                  #{translateTag(tagKey)}
                </button>
              ))}
            {tagSearchTerm !== "" &&
              [
                // List of tag keys
              ].filter((tagKey) =>
                translateTag(tagKey).toLowerCase().includes(tagSearchTerm.toLowerCase()),
              ).length === 0 && (
                <div className="w-full text-center py-2 text-sm text-[var(--foreground)] italic opacity-70">
                  {t('editor.noTagsFound')} {tagSearchTerm}
                </div>
              )}
          </div>

          {/* Footer Section */}
          <div className="flex justify-between items-center p-4 sm:p-5 bg-[var(--container)] border-t border-[var(--border-color)]">
            <div className="text-xs sm:text-sm text-[var(--foreground)] opacity-70">
              <span className="font-medium">{content.length}</span> / 15000 {t('editor.characters')}
            </div>

            <button
              className={`flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-md text-sm sm:text-base font-medium transition-all duration-300 ${
                saving
                  ? "bg-[var(--container)] text-[var(--foreground)] opacity-70"
                  : "bg-[var(--button-bg1)] hover:bg-[var(--hover-color)] text-[var(--background)] shadow-sm"
              }`}
              onClick={saveNote}
              disabled={saving || (!title.trim() && !content.trim())}
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-[var(--foreground)] border-t-transparent rounded-full animate-spin"></div>
                  <span>{t('editor.saving')}</span>
                </>
              ) : (
                <>
                  <Save size={18} />
                  <span>{t('editor.save')}</span>
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
