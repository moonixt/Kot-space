"use client"

// import { useState } from "react"
import { Avatar, AvatarImage } from "@radix-ui/react-avatar";
import Image from "next/image";



const Profile = () => {
    // const [bio, setBio] = useState("")

    // const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    //     e.preventDefault()
    //     if (!bio.trim()) return

        
    // }


return (
    <div className=" flex justify-center ">
        <div className="bg-[var(--background)]  text-[var(--background]">
            <div className="">
                <Image
                    src="/static/images/4.jpeg"
                    alt="Profile"
                    width={4000}
                    height={4000}
                    className=" w-600 h-55 sm:h-130 md:h-70 2xl:h-150 object-cover "
                />
            </div>
            <div className="flex justify-center items-center gap-2 mt-[-50px] pb-10 ">
            <Avatar>
                <AvatarImage
                className=" h-[40px] w-[40px]"
                src="/icons/cop-note.png"
               />  
            </Avatar>
     
                <h2 className="italic text-[var(--foreground)] bg-[var(--background)] ">{' "You are what you think"  '}</h2>
            </div>

        </div>

    </div>
  )
}

export default Profile