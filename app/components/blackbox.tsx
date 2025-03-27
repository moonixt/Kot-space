import Editor from "./editor";

function Blackbox() {
    return (
        <div className="flex justify-center  ">
            <div className="text-white bg-slate-950 w-full h-screen">
               
                <div className="flex justify-center pt-20">
                    <h1 className="font-bold text-5xl">BlackBox</h1>
                </div>
                <div className="grid grid-cols-1 gap-4 p-8">
                    <Editor></Editor>
                </div>
            </div>
        </div>
    )
}

export default Blackbox