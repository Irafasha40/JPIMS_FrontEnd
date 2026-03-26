import { Construction } from "lucide-react";

export default function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] text-center">
      <Construction className="w-12 h-12 text-muted-foreground mb-4" />
      <h1 className="text-2xl font-heading font-bold">{title}</h1>
      <p className="text-muted-foreground text-sm mt-2">This module is coming soon.</p>
    </div>
  );
}
