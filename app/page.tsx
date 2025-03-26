// import Image from "next/image";
import Blackbox from "./components/blackbox"
import Sidebox from "./components/sidebox"

export default function Home() {
  return (
    <div className=" ">
      <div>
        <Sidebox></Sidebox>
      </div>
      <div className="">
        <Blackbox></Blackbox>
      </div>
    </div>
  );
}
