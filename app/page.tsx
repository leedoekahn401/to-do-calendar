import LoginButton from "@/components/SignInButton";
import Image from "next/image";
import myImage from "../assets/images.jpg";

export default function Main() {
  return (
    <div className="min-h-screen bg-[#FFF5E1] flex flex-col items-center justify-center p-6 font-sans">
      <div className="bg-white border-4 border-black border-solid rounded-xl p-10 max-w-lg w-full shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] text-center flex flex-col items-center space-y-8">
        
        <h1 className="text-5xl font-black text-black tracking-tight uppercase border-b-4 border-black pb-2">
          Login?
        </h1>
        
        <div className="relative w-64 h-64 border-4 border-black border-solid shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] bg-gray-200 overflow-hidden">
          <Image 
            src={myImage} 
            alt="Sign in image" 
            fill
            className="object-cover"
            priority
          />
        </div>

        <div className="bg-[#FF90E8] border-4 border-black border-solid px-6 py-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-2xl font-bold text-black font-mono">
            hmm what to do now...
          </p>
        </div>

        <p className="text-xl font-bold text-black">
          (The big button below is a good start 👇)
        </p>

        <div className="w-full flex justify-center mt-4">
          <LoginButton />
        </div>
      </div>
    </div>
  )
}