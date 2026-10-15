"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function MainPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const logged = localStorage.getItem("isLoggedIn") === "true";
    if (!logged) {
      router.push("/login");
    } else {
      setIsLoggedIn(true);
    }
  }, []);

  function handleModuleClick(path: string) {
    if (!isLoggedIn) {
      router.push("/login");
    } else {
      router.push(path);
    }
  }

  const cards = [
    {
      id: "makesluke",
      title: "Makes Luke",
      subtitle: "Chat, memory and stuff",
      avatar: "/maks.png",
      path: "/chat",
    },
    {
      id: "phodex",
      title: "Phodex Coder",
      subtitle: "Yeah, lets code baby",
      avatar: "/phodex.png",
      path: "/phodex",
    },       
    {
      id: "rag",
      title: "Scrapy Coco",
      subtitle: "Document intelligence",
      avatar: "/merda.png",
      path: "/rag",
    },
    {
      id: "doctor",
      title: "Virtual Doc",
      subtitle: "AI medical guidance",
      avatar: "/doctor.png",
      path: "/doctor",
    },


  ];

  return (
    <div className="main-layout">
      <main className="main-container">
        <h1 className="main-title"> Secaio Assistant</h1>
        <p className="main-subtitle">AI Technology that empowers your business</p>

        <div className="cards-grid">
          {cards.map((c) => (
            <div
              key={c.id}
              className="ai-card"
              onClick={() => handleModuleClick(c.path)}
            >
              <div className="ai-avatar-box">
                <Image
                  src={c.avatar}
                  alt={c.title}
                  width={180}
                  height={180}
                  className="ai-avatar-image"
                  loading="eager"
                />
              </div>

              <h3 className="ai-card-title">{c.title}</h3>
              <p className="ai-card-subtitle">{c.subtitle}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
