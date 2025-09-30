import { h, useState } from "refreshjs";

interface TableTennis3DProps {
  onTableClick: () => void;
}

export function TableTennis3D({ onTableClick }: TableTennis3DProps) {
  const [isHovered, setIsHovered] = useState(false);
  return (
    <div class="flex items-center justify-center min-h-[400px] perspective-1000">
      <div
        class={`relative transform-style-preserve-3d transition-all duration-300 cursor-pointer ${
          isHovered ? "scale-110 rotate-y-3" : ""
        }`}
        style={{ perspective: "1000px", transformStyle: "preserve-3d" }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={onTableClick}
      >
        {/* Table Surface */}
        <div
          class="relative w-80 h-48 bg-gradient-to-br from-green-600 to-green-800 border-4 border-white shadow-2xl"
          style={{
            transform: "rotateX(60deg) rotateY(0deg) translateZ(0)",
            transformOrigin: "center center",
          }}
        >
          {/* Net (vertical) */}
          <div
            class="absolute left-1/2 top-0 w-1 h-full bg-white transform -translate-x-1/2 z-10"
            style={{ height: "100%" }}
          />
          {/* Net (horizontal) */}
          <div
            class="absolute left-1/2 top-0 w-full h-1 bg-white transform -translate-x-1/2 z-10"
            style={{ top: "50%", height: "2px" }}
          />
          {/* Court Lines */}
          <div class="absolute left-1/2 top-4 bottom-4 w-0.5 bg-white opacity-40 transform -translate-x-1/2" />
          <div
            class="absolute w-3 h-16 bg-gray-600"
            style={{ left: "10%", top: "100%", transform: "translateZ(-32px)" }}
          />
          <div
            class="absolute w-3 h-16 bg-gray-600"
            style={{
              right: "10%",
              top: "100%",
              transform: "translateZ(-32px)",
            }}
          />
          <div
            class="absolute w-3 h-16 bg-gray-600"
            style={{
              left: "10%",
              bottom: "0%",
              transform: "translateZ(-32px) translateY(100%)",
            }}
          />
          <div
            class="absolute w-3 h-16 bg-gray-600"
            style={{
              right: "10%",
              bottom: "0%",
              transform: "translateZ(-32px) translateY(100%)",
            }}
          />
        </div>

        {/* Paddle + Handle Wrapper */}
        <div
          class={`absolute transition-all duration-300 ${isHovered ? "animate-bounce" : ""}`}
          style={{
            right: "20%",
            top: "10%",
            transform: "rotateX(60deg) translateZ(8px)",
            zIndex: 20,
          }}
        >
          {/* Paddle */}
          <div
            class="w-8 h-12 bg-red-600 border-red-800 rounded-lg"
            style={{ position: "relative" }}
          >
            {/* Handle */}
            <div
              class="w-2 h-8 border-2 rounded-b-lg"
              style={{
                background: "linear-gradient(to bottom, #fbbf24, #f59e0b)",
                position: "absolute",
                bottom: "-26px",
                left: "50%",
                transform: "translateX(-50%)",
                zIndex: -10,
              }}
            />
          </div>
        </div>

        {/* Ball */}
        <div
          class={`absolute w-3 h-3 bg-white rounded-full shadow-lg transition-all duration-300 ${
            isHovered ? "animate-ping" : ""
          }`}
          style={{
            left: "45%",
            top: "40%",
            transform: "rotateX(60deg) translateZ(12px)",
          }}
        />

        {/* Hover Effect Glow */}
        {isHovered && (
          <div
            class="absolute inset-0 bg-cyan-400 opacity-20 rounded-lg blur-xl"
            style={{
              transform: "rotateX(60deg) scale(1.2)",
              animation: "pulse 1s infinite",
            }}
          />
        )}
      </div>

      {/* Click to Play Text */}
      <div class="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full mt-8">
        <div class="text-center">
          <div class="text-cyan-400 font-mono tracking-wider animate-pulse">
            » CLICK TO ENTER GAME «
          </div>
          <div class="text-xs text-gray-400 mt-1 font-mono">
            Press SPACE or click the table
          </div>
        </div>
      </div>
    </div>
  );
}
