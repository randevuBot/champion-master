const fs = require('fs');
const path = require('path');

const pages = ['squad', 'inbox', 'calendar', 'finance', 'academy', 'stats'];

pages.forEach(page => {
  const dirPath = path.join(__dirname, 'app', page);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  const PageComponent = page.charAt(0).toUpperCase() + page.slice(1) + 'Container';

  // Create page.js
  const pageContent = `import { ${PageComponent} } from "@/containers/${PageComponent}";

export default function ${page.charAt(0).toUpperCase() + page.slice(1)}Page() {
  return <${PageComponent} />;
}
`;
  fs.writeFileSync(path.join(dirPath, 'page.js'), pageContent);

  // Create Container.js
  const containerPath = path.join(__dirname, 'containers', `${PageComponent}.js`);
  if (!fs.existsSync(containerPath)) {
    const containerContent = `"use client";

import { useGameStore } from "@/store/gameStore";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function ${PageComponent}() {
  const router = useRouter();
  const { myClubId } = useGameStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!myClubId) router.push("/");
  }, [myClubId, router]);

  if (!mounted || !myClubId) return null;

  return (
    <div className="p-8">
      <h2 className="text-3xl font-rajdhani font-bold mb-4 tracking-wide text-primary">${page.toUpperCase()}</h2>
      <div className="bg-card border border-border p-8 rounded-xl text-center text-muted-foreground">
        Bu modül eski sistemden (vanilla_backup) yakında port edilecektir.
      </div>
    </div>
  );
}
`;
    fs.writeFileSync(containerPath, containerContent);
  }
});

console.log("Pages generated successfully.");
