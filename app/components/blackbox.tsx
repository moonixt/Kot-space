//Main container component off the app, its has a title and a description.

import Editor from "./editor";

function Blackbox() {
  return (
    <div className="flex justify-center">
      <div className="text-white bg-gradient-to-br from-slate-950 to-slate-900 w-full min-h-screen">
        <div className="flex justify-center md:pt-20 pt-8 px-4">
          <h1 className="font-bold text-white text-4xl md:text-5xl text-center">
            Fair-note 🐍
          </h1>
        </div>
        <div className="flex justify-center pt-1 px-4">
          <p className="text-white text-xl md:text-2xl italic text-center">
            Organize suas notas com facilidade.
          </p>
        </div>
        <div className="px-2 sm:px-4 pb-4">
          <Editor></Editor>
        </div>
      </div>
    </div>
  );
}

export default Blackbox;
