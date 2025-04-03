//Main container component off the app, its has a title and a description.

import Editor from "./editor";

function Blackbox() {
  return (
    <div className="flex justify-center overflow-hidden">
      <div className="text-[var(--foreground)] bg-[var(--container)] w-full h-screen flex flex-col">
        {/* <div className="flex justify-center pt-1 md:pt-4 px-2">
          <h1 className="font-bold text-[var(--foreground)] text-2xl md:text-4xl text-center ">
            Fair-note 🐍
          </h1>
        </div>
        <div className="hidden md:flex justify-center px-4 mb-1 md:mb-2">
          <p className="text-[var(--foreground)] text-lg md:text-xl italic text-center">
            Organize suas notas com facilidade.
          </p>
        </div> */}

        {/* Área do editor com altura restante da tela */}
        <div className="   flex-grow flex flex-col h-[calc(100vh-50px)] md:h-[calc(100vh-120px)] ">
          <Editor />
        </div>
      </div>
    </div>
  );
}

export default Blackbox;
