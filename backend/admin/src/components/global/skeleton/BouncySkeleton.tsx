import React from "react";

interface BouncySkeletonProps {
  text?: string;
}

export function BouncySkeleton({ text = "Loading..." }: BouncySkeletonProps) {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full min-h-[400px] p-8 relative overflow-hidden">
      <div className="relative flex flex-col items-center justify-center">
        {/* Container for the 3D glowing blob */}
        <div className="relative w-32 h-32 md:w-40 md:h-40 flex items-center justify-center mb-8">
          {/* Ambient background glow */}
          <div className="absolute w-full h-full bg-purple-600/20 blur-[50px] rounded-full animate-pulse"></div>
          
          {/* Main morphing blob */}
          <div 
            className="absolute w-full h-full bg-[#0a0514] border border-[#a855f7]/40 shadow-[inset_-10px_-10px_40px_rgba(168,85,247,0.3),inset_10px_10px_40px_rgba(79,70,229,0.3),0_0_30px_rgba(168,85,247,0.5)]"
            style={{
              animation: 'blobMorph 5s ease-in-out infinite alternate',
            }}
          >
            {/* Inner specular highlight to give it 3D glass/fluid look */}
            <div className="absolute top-[5%] left-[10%] w-[80%] h-[40%] bg-gradient-to-b from-white/10 to-transparent rounded-full blur-[2px] opacity-70 transform -rotate-12"></div>
            
            {/* Color accent (blue/purple inner glow) */}
            <div 
              className="absolute inset-0 bg-gradient-to-tr from-indigo-600/30 via-transparent to-purple-600/30 mix-blend-screen"
              style={{
                animation: 'blobMorph 7s ease-in-out infinite alternate-reverse',
              }}
            ></div>
          </div>
          
          {/* Secondary rotating color rim to add dynamic light */}
          <div 
            className="absolute w-[105%] h-[105%] border-[2px] border-transparent border-t-purple-500/50 border-r-indigo-500/50 rounded-full mix-blend-screen blur-[2px]"
            style={{
              animation: 'blobSpin 4s linear infinite',
              animationDirection: 'alternate'
            }}
          ></div>
        </div>

        {/* Text */}
        <h3 className="text-xl font-bold tracking-wider text-purple-200/80 drop-shadow-[0_0_10px_rgba(168,85,247,0.8)]">
          {text}
        </h3>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes blobMorph {
          0% {
            border-radius: 40% 60% 70% 30% / 40% 40% 60% 50%;
            transform: scale(1) rotate(0deg);
          }
          34% {
            border-radius: 70% 30% 50% 50% / 30% 30% 70% 70%;
            transform: scale(1.02) rotate(15deg);
          }
          67% {
            border-radius: 100% 60% 60% 100% / 100% 100% 60% 60%;
            transform: scale(0.98) rotate(-15deg);
          }
          100% {
            border-radius: 40% 60% 70% 30% / 40% 40% 60% 50%;
            transform: scale(1) rotate(0deg);
          }
        }

        @keyframes blobSpin {
          from {
            transform: rotate(0deg);
            border-radius: 50% 50% 50% 50%;
          }
          to {
            transform: rotate(360deg);
            border-radius: 60% 40% 50% 50%;
          }
        }
      `}} />
    </div>
  );
}
