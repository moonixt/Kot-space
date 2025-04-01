//Main container component off the app, its has a title and a description.

import Editor from "./editor";

function Blackbox() {
  return (
    <div className="flex justify-center overflow-x-hidden">
      <div className="text-white bg-gradient-to-br from-slate-950 to-slate-900 w-full min-h-screen flex flex-col">
        <div className="flex justify-center pt-2 md:pt-10 px-4">
          <h1 className="font-bold text-white text-4xl md:text-5xl text-center">
            Fair-note 🐍
          </h1>
        </div>
        <div className="flex justify-center px-4 mb-2 md:mb-4">
          <p className="text-white text-xl md:text-2xl italic text-center hidden md:block">
            Organize suas notas com facilidade.
          </p>
        </div>
        <div className="px-2 sm:px-4 pb-4 flex-grow">
          <Editor />
        </div>
      </div>
    </div>
  );
}

export default Blackbox;
