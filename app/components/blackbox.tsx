import Editor from "./editor";

function Blackbox() {
  return (
    <div className="flex justify-center  ">
      <div className="text-white bg-gradient-to-br from-slate-950 to-slate-900 w-full h-screen">
        <div className="flex justify-center md:pt-20 pt-5 ">
          <h1 className="font-bold text-white text-5xl ">Fair-note 🐍</h1>
        </div>
        <div className="flex justify-center pt-1">
          <p className="text-white text-2xl italic">
            Organize suas notas com facilidade.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 p-4">
          <Editor></Editor>
        </div>
      </div>
    </div>
  );
}

export default Blackbox;
