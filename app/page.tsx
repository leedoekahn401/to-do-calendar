import LoginButton from "@/components/SignInButton";

export default function Main() {
  return (
    <div className="min-h-screen w-full relative overflow-hidden bg-primary flex items-center justify-center p-4 selection:bg-accent-mint selection:text-black">
      
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent-peach rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
      <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] bg-accent-mint rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-[-20%] left-[20%] w-[40%] h-[40%] bg-accent-blue rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>

      {/* Scattered Abstract shapes to enhance the comic aesthetic */}
      <div className="absolute top-20 left-20 w-16 h-16 bg-accent-yellow rounded-full border-[3px] border-black hidden md:block animate-bounce shadow-[4px_4px_0_0_#000]"></div>
      <div className="absolute bottom-32 right-24 w-12 h-12 bg-accent-purple rotate-45 border-[3px] border-black hidden md:block animate-[pulse_3s_ease-in-out_infinite] shadow-[4px_4px_0_0_#000]"></div>
      
      {/* Little accent dots */}
      <div className="absolute top-1/4 right-1/3 w-3 h-3 rounded-full bg-black hidden lg:block"></div>
      <div className="absolute bottom-1/4 left-1/4 w-3 h-3 rounded-full bg-black hidden lg:block"></div>
      <div className="absolute top-1/2 right-1/4 w-4 h-4 rounded-full bg-accent-orange border-2 border-black hidden lg:block"></div>
      <div className="absolute top-32 right-32 text-4xl text-black opacity-20 hidden lg:block rotate-12 font-bold">*</div>
      <div className="absolute bottom-20 left-40 text-5xl text-black opacity-20 hidden lg:block -rotate-12 font-bold">+</div>

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-md">
        
        {/* Floating Speech Bubble */}
        <div className="mb-6 animate-[bounce_3s_ease-in-out_infinite]">
          <div className="speech-bubble-left inline-block bg-white text-black font-bold px-6 py-3 rounded-2xl thick-border shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-lg -rotate-2">
            Stay organized! ✨
          </div>
        </div>

        {/* Card Panel */}
        <div className="bg-white thick-border-panel rounded-3xl p-8 md:p-10 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center text-center transform transition-transform duration-300 hover:scale-[1.01]">
          
          <div className="bg-accent-peach w-20 h-20 rounded-2xl flex items-center justify-center thick-border shadow-[4px_4px_0_0_#000] mb-6 rotate-3">
            <svg className="w-10 h-10 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>

          <h1 className="text-4xl md:text-5xl font-black text-black mb-4 tracking-tight drop-shadow-sm">
            To-Do<br/><span className="text-accent-purple drop-shadow-[2px_2px_0_#000]">Calendar</span>
          </h1>
          
          <p className="text-gray-700 font-medium text-lg mb-8 max-w-[280px]">
            Manage your tasks, events, and day all in one vibrant place.
          </p>
          
          <div className="w-full">
            <LoginButton />
          </div>

          <p className="mt-8 text-sm text-gray-500 font-medium">
            Secure, fast, and simple.
          </p>

        </div>
      </div>
      
      {/* Adding custom keyframes to tailwind dynamically via style block */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}} />
    </div>
  )
}