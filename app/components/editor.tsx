function Editor() {
    return (
        <div className="text-blue-400 p-8 text-4xl  ">
            <div className="border-4 border-white w-full h-[600px] bg-slate-950 rounded-lg">
                <div className=" p-8">
                    <input
                        className="focus:outline-none focus:ring-0 border-none w-full text-5xl"
                        placeholder="Title" maxLength={32}>
                    </input>
                </div>
                <textarea
                    className="p-8 w-full h-full bg-slate-950 text-blue-400 resize-none focus:outline-none"
                    placeholder="Add your note" maxLength={1000}
                ></textarea>
            </div>
        </div>
    )
}

export default Editor