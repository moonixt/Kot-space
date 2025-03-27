import Editor from "./editor";

function Blackbox() {
    return (
        <div className="flex justify-center">
            <div className="text-black bg-white w-[1420px] h-screen">
                <div className="p-8">
                    <button className="bg-white text-black border-2 border-red-950 rounded-full p-5 transition-all delay-100 duration-300 ease-in-out hover:bg-blue-400 hover:text-white ">Add note</button>
                </div>
                <div className="flex justify-center">
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