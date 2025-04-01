// import Image from "next/image";
import Blackbox from "./components/blackbox";
import { ProtectedRoute } from "./components/ProtectedRoute";

export default function Home() {
  return (
    <ProtectedRoute>
      <div className="flex flex-row min-h-screen w-full overflow-hidden">
        <div className="flex-1 h-screen">
          <Blackbox></Blackbox>
        </div>
      </div>
    </ProtectedRoute>
  );
}
