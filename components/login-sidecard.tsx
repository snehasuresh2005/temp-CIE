import * as React from "react";
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";

const illustrations = [
  {
    src: "/login_illustration_1.mp4",
    alt: "Login Video 1",
    text: "AI integrated to speed up daily activities!"
  },
  {
    src: "/login_illustration_2.mp4",
    alt: "Login Video 2",
    text: "Resume shortlisting based on LLMs!"
  },
  {
    src: "/login_illustration_3.mp4",
    alt: "Login Video 3",
    text: "A place where teachers and students can collaborate!"
  }
];

export function LoginSideCard() {
  const plugin = React.useRef(
    Autoplay({ delay: 2000, stopOnInteraction: false })
  )

  return (
    <div className="group flex flex-col items-center justify-center h-full w-full bg-white rounded-2xl min-w-[320px] max-w-[400px] p-0 relative">
      <Carousel 
        className="w-full" 
        opts={{ loop: true }}
        plugins={[plugin.current]}
        onMouseEnter={plugin.current.stop}
        onMouseLeave={plugin.current.reset}
      >
        <CarouselContent>
          {illustrations.map((item, idx) => (
            <CarouselItem key={idx} className="flex flex-col items-center justify-center">
              <video
                src={item.src}
                className="w-full h-[340px] object-contain"
                autoPlay
                loop
                muted
                playsInline
                style={{ userSelect: 'none' }}
              />
              <div className="text-center text-lg font-medium text-gray-700 px-2 min-h-[48px] flex items-center justify-center">
                {item.text}
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
        <CarouselNext className="right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
      </Carousel>
    </div>
  );
} 