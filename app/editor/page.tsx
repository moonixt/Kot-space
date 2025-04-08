import Editor from "../components/editor";
import { ProtectedRoute } from "../components/ProtectedRoute";

export default function EditorPage() {
  return (
    <ProtectedRoute>
      <div className="flex flex-row min-h-screen w-full overflow-hidden smooth">
        <div className="flex-1 h-screen">
          <Editor></Editor>
        </div>
      </div>
    </ProtectedRoute>
  );
}
