// import Image from "next/image";
import Blackbox from "./components/blackbox"
import Editor from "./components/editor";
import Sidebox from "./components/sidebox"

export default function Home() {
  return (
    <div className="flex flex-row min-h-screen w-full overflow-hidden">
      <div className="h-screen">
        <Sidebox></Sidebox>
      </div>
      <div className="flex-1 h-screen">
        <Blackbox></Blackbox>
      </div>
    </div>
  );
}
